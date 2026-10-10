import { PassThrough, ReadableOptions } from 'node:stream';

/**
 * Custom wrapper class of Readable
 */
export default class PassThroughWrapper extends PassThrough {
  startedAt:string;

  constructor(options?) {
    super(options);
    this.startedAt = new Date().toISOString();
  }
}
