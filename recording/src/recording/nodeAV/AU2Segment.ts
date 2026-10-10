import {
  PassThrough, Transform, Writable,
  WritableOptions,
} from 'node:stream';
import {

  FFmpegError, FormatContext, Packet,

} from 'node-av';
import { AccessUnit } from './utils/AcessUnit';
import AU2Packet from './utils/muxing';
import FormatContextWrapper from './utils/ContextWrapper';

type WritableOptionsWrapper =
WritableOptions & {firstAUHead:any, segmentDuration:number, streamIndex:number}
/**
 * A WritableStream which Transforms AUs(Frames) to a video segment file.
 * You can access to output streams by referencing internal readableQueue.
 * readableQueue stores a series of Readable.
 * You can access to video segment format by reading Readable.
 * Video segment is stored in MPEG.ts format
 */
export default class AU2Segment extends Writable {
  firstAUHead;

  startInDate: string = '';

  segmentDuration:number;

  baseTimestamp:bigint;

  firstAUFlag:boolean = true;

  streamIndex:number;

  context:FormatContextWrapper;

  nextPacket:Packet|null;

  io;

  baseAU:AccessUnit;

  cirAU:AccessUnit;

  dest:Writable;

  readableQueue:Transform;

  /**
   * Constructor of AU2Segment.
   * ObjectedMode is always enbled. if it is false this class would not work
   * @param writableOptionsWrapper: Wrapper of WritableOptions
   */
  constructor(writableOptionsWrapper:WritableOptionsWrapper) {
    const {
      firstAUHead, segmentDuration = 30, streamIndex, ..._options
    } = writableOptionsWrapper;
    super({ objectMode: true, ..._options });
    this.firstAUHead = firstAUHead;
    this.startInDate = '';
    this.segmentDuration = segmentDuration;
    this.streamIndex = streamIndex;
    this.readableQueue = new PassThrough({ objectMode: true });
  }

  /**
   * Implamentation of Writable._write()
   * Frame is passed as chunk.
   * @param chunk an object
   * @param encoding not necessory value yet
   * @param callback _write() callback
   */
  async _write(
    chunk: AccessUnit,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    try {
      this.cirAU = chunk;
      if (this.firstAUFlag) {
        await this.createPipeLine();
        this.firstAUFlag = false;
      }
      const relativeTimestamp = this.firstAUFlag
        ? 0n
        : BigInt.asUintN(32, chunk.timestamp - this.baseTimestamp);
      const packet = AU2Packet(chunk, relativeTimestamp, this.streamIndex);
      await this.accumulatePackets(packet);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Implementation of Writable._final()
   * @param callback
   */
  async _final(callback: (error?: Error | null) => void) {
    try {
      this.removeContext(this.context);
      this.readableQueue.push(null);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Update base timestamp of AccessUnit
   * @param au
   */
  updateBaseTimestamp(au:AccessUnit) {
    this.baseAU = au;
    this.baseTimestamp = au.timestamp;
  }

  async createPipeLine() {
    this.context = new FormatContextWrapper();
    this.context.newStream(this.firstAUHead);
    await this.context.newIO();
    this.updateBaseTimestamp(this.cirAU);// 이것도 나중에 바꿀 수 있음
    this.readableQueue.write(this.context.output);
  }

  /**
   * Free FormatContext
   * @param context
   */
  removeContext(context:FormatContext) {
    const io = this.context.pb;
    io!.freeContext();
    // 생각좀 해봐야됨
    context.pb = null;
    context.freeContext();
    if (context instanceof FormatContextWrapper)(context.output as Transform).end();
  }

  async accumulatePackets(packet:Packet) {
    if (this.nextPacket) {
      await this.context.interleavedWriteFrame(this.nextPacket);
      this.nextPacket.free();
      this.nextPacket = null;
    }
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
      await this.createPipeLine();
      // pre
      // post
      this.nextPacket = packet;
      packet.dts = 0n;
      packet.pts = 0n;
    }
  }
}
