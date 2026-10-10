import { IOContext, IOStream } from 'node-av';
import { PassThrough, Readable } from 'node:stream';

export default class IOStreamWrapper extends Readable {
  passthrough:PassThrough;

  constructor(options) {
    const _options = { ...options };
    _options.objectMode = true;
    super(_options);
    this.passthrough = new PassThrough(_options);
  }

  _read(size: number): void {
    this.push(this.passthrough.read(size));
  }

  createOutput():IOContext {
    return IOStream.createOutput(this.passthrough);
  }
}
