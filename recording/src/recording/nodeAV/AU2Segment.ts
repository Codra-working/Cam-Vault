import {
  PassThrough, Readable, Transform, Writable,
} from 'node:stream';
import {
  AV_CODEC_ID_H264,
  AVMEDIA_TYPE_VIDEO,
  FFmpegError, FormatContext, Packet,
  Rational,
} from 'node-av';
import { AccessUnit } from './utils/AcessUnit';
import AU2Packet from './utils/muxing';
import IOStreamWrapper from './utils/IOStreamWrapper';

type ContextWrapper = FormatContext &{stream:Writable}
type ReadableWrapper = Readable &{startedAt:string|undefined}
export default class AU2Segment extends Writable {
  firstAUHead;

  startInDate: string = '';

  segmentDuration:number;

  baseTimestamp:bigint;

  firstAUFlag:boolean = true;

  streamIndex:number;

  context:ContextWrapper;

  nextPacket:Packet|null;

  io;

  baseAU:AccessUnit;

  cirAU:AccessUnit;

  dest:Writable;

  readableQueue:Transform;

  constructor(options) {
    const {
      firstAUHead, segmentDuration = 30, streamIndex, ..._options
    } = options;
    super({ objectMode: true, ..._options });
    this.firstAUHead = firstAUHead;
    this.startInDate = '';
    this.segmentDuration = segmentDuration;
    this.streamIndex = streamIndex;
    this.readableQueue = new PassThrough({ objectMode: true });
  }

  async _write(au: AccessUnit, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
    try {
      this.cirAU = au;
      if (this.firstAUFlag) {
        const readable:Readable = await this.createPipeLine();
        this.readableQueue.push(Object.assign(readable, { startedAt: new Date().toISOString() }) as ReadableWrapper);
        this.firstAUFlag = false;
      }
      const relativeTimestamp = this.firstAUFlag
        ? 0n
        : BigInt.asUintN(32, au.timestamp - this.baseTimestamp);
      const packet = AU2Packet(au, relativeTimestamp, this.streamIndex);
      await this.accumulatePackets(packet);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }

  async _final(callback: (error?: Error | null) => void) {
    try {
      this.removeContext(this.context);
      this.readableQueue.push(null);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }

  createContext() {
    const _context: FormatContext = new FormatContext();
    Object.assign(_context, { stream: undefined });
    const context: ContextWrapper = _context as ContextWrapper;
    FFmpegError.throwIfError(
      context.allocOutputContext2(null, 'mpegts', null),
      '출력 컨텍스트 초기화 실패',
    );
    const stream = context.newStream();

    stream.codecpar.codecType = AVMEDIA_TYPE_VIDEO;
    stream.codecpar.codecId = AV_CODEC_ID_H264;
    stream.codecpar.width = 640;
    stream.codecpar.height = 360;
    if (this.firstAUHead) {
      stream.codecpar.extradata = this.firstAUHead;
    }
    stream.timeBase = new Rational(1, 90000);
    return context;
  }

  updateBaseTimestamp(au:AccessUnit) {
    this.baseAU = au;
    this.baseTimestamp = au.timestamp;
  }

  async createIO(context:FormatContext):Promise<Readable> {
    const ioStreamWrapper = new IOStreamWrapper({ objectMode: true });
    const io = ioStreamWrapper.createOutput();
    context.pb = io;
    FFmpegError.throwIfError(
      await this.context.writeHeader(),
      '헤더 작성 실패',
    );
    Object.assign(context, { stream: ioStreamWrapper.passthrough });
    return ioStreamWrapper.passthrough;
  }

  removeContext(context:ContextWrapper) {
    const io = this.context.pb;
    context.pb = null;
    context.freeContext();
    context.stream.end();
    io!.freeContext();
  }

  async createPipeLine() {
    this.context = this.createContext();
    this.updateBaseTimestamp(this.cirAU);
    return this.createIO(this.context);
  }

  async accumulatePackets(packet:Packet) {
    if (this.nextPacket) {
      await this.context.interleavedWriteFrame(this.nextPacket);
      this.nextPacket.free();
      this.nextPacket = null;
    }// 생각 필요
    if (packet.pts < this.segmentDuration * 90000 || packet.isKeyframe !== true) {
      await this.context.interleavedWriteFrame(packet);// push
      packet.free();
    } else {
      const isAUListOK = this.baseAU.packetType === 'key';
      //        && this.workerPool.size < this.maxConcurrentJobs;

      // if AUListOK process previous segment
      if (isAUListOK) {
        FFmpegError.throwIfError(
          await this.context.interleavedWriteFrame(null),
          'Failed to flush packets',
        );
        FFmpegError.throwIfError(
          await this.context.writeTrailer(),
          'Failed to finalize output',
        );
        await this.context.pb!.flush();
      } else {
        const msg = 'Warning: a Segment is dropped';
        console.warn(msg);
      }
      // discard AUList

      this.removeContext(this.context);
      // pre
      const readable:Readable = await this.createPipeLine();
      this.readableQueue.push(Object.assign(readable, { startedAt: new Date().toISOString() }));

      // post
      this.nextPacket = packet;
      packet.dts = 0n;
      packet.pts = 0n;
    }
  }
}
