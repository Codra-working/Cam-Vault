import {
  AV_CODEC_ID_H264,
  AVMEDIA_TYPE_VIDEO,
  FFmpegError, FormatContext, IOStream, Rational,
} from 'node-av';
import { Readable } from 'node:stream';
import PassThroughWrapper from './PassThroughWrapper';

export default class FormatContextWrapper extends FormatContext {
  output:Readable;

  constructor() {
    super();
    FFmpegError.throwIfError(
      this.allocOutputContext2(null, 'mpegts', null),
      '출력 컨텍스트 초기화 실패',
    );
  }

  newStream(
    extradata,
    codecType = AVMEDIA_TYPE_VIDEO,
    codecId = AV_CODEC_ID_H264,
    width = 640,
    height = 360,
  ) {
    const stream = super.newStream();
    stream.codecpar.codecType = codecType;
    stream.codecpar.codecId = codecId;
    stream.codecpar.width = width;
    stream.codecpar.height = height;
    stream.codecpar.extradata = extradata;
    stream.timeBase = new Rational(1, 90000);
    return stream;
  }

  async newIO() {
    const passthrough = new PassThroughWrapper();
    this.pb = IOStream.createOutput(passthrough);
    FFmpegError.throwIfError(
      await this.writeHeader(),
      '헤더 작성 실패',
    );
    this.output = passthrough;
  }
}
