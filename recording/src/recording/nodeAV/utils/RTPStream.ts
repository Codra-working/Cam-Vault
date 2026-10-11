import { Readable, ReadableOptions } from 'node:stream';
import { parseRTPPacket } from 'yellowstone/dist/util';
import { Record, RTPObj } from './parseRTPDump';

function min(...vars:number[]) {
  let x = Infinity;
  for (let i = 0; i < vars.length; i++) {
    x = x < vars[i] ? x : vars[i];
  }
  return x;
}

export default class RTPStream extends Readable {
  rtpDump:RTPObj;

  i:number;

  /**
   * Create readableStream from RTPObject.
   * @param options options of ReadableStream but object mode will be always true.
   * @param rtpDump an RTPObj which you want to pass to this RTPStream instance.
   */
  constructor(options:ReadableOptions, rtpDump:RTPObj) {
    Object.assign(options, { objectMode: true });
    super(options);
    this.rtpDump = rtpDump;
    this.i = 0;
  }

  /**
   * Read internal RTPObj and transform it to RTPPackets
   * @param size the number of records that you want to read. default values is 1
   */
  _read(size = 1) {
    const offset = this.i;
    let _continue;
    do {
      const buf = Buffer.from(this.rtpDump.fileBody[this.i].recordBody);
      const rtpPacket = parseRTPPacket(buf);
      _continue = this.push(rtpPacket);
      this.i++;
    } while (this.i < min(offset + size, this.rtpDump.fileBody.length) && _continue);
    if (this.i >= this.rtpDump.fileBody.length) this.push(null);
  }
}
