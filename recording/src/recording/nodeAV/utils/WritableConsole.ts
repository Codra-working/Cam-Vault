import { Writable } from 'node:stream';

export default class WritableBuffer extends Writable {
  buffer:Buffer[] = [];

  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    try {
      this.buffer.push(chunk);
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  getBuffer() {
    return Buffer.concat(this.buffer);
  }
}
