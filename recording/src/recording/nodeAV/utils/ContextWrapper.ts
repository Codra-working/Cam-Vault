import {
  AV_CODEC_ID_H264,
  AVMEDIA_TYPE_VIDEO,
  FFmpegError, FormatContext, IOStream, Rational,
} from 'node-av';
import { PassThrough } from 'node:stream';
import PassThroughWrapper from './PassThroughWrapper';

export default class FormatContextWrapper {
  inner:FormatContext;

  output:PassThrough;

  constructor(formatContext:FormatContext) {
    this.inner = formatContext;
    FFmpegError.throwIfError(
      this.inner.allocOutputContext2(null, 'mpegts', null),
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
    const stream = this.inner.newStream();
    stream.codecpar.codecType = codecType;
    stream.codecpar.codecId = codecId;
    stream.codecpar.width = width;
    stream.codecpar.height = height;
    stream.codecpar.extradata = extradata;
    stream.timeBase = new Rational(1, 90000);
    return stream;
  }

  async newIO() {
    const passthrough = new PassThroughWrapper(new PassThrough());
    this.inner.pb = IOStream.createOutput(passthrough.inner);
    FFmpegError.throwIfError(
      await this.inner.writeHeader(),
      '헤더 작성 실패',
    );
    this.output = passthrough.inner;
  }
}
