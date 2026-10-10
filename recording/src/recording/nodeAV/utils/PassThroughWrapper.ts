import { PassThrough } from 'node:stream';

/**
 * Custom wrapper class of Readable
 */
export default class PassThroughWrapper {
  inner:PassThrough;

  startedAt:string;

  constructor(passthrough:PassThrough) {
    this.inner = passthrough;
    this.startedAt = new Date().toISOString();
  }
}
