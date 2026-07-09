import { Buffer } from 'buffer';
declare class RTPPacket {
    private _bufpkt;
    constructor(bufpayload: Buffer, hasHeader?: boolean);
    get type(): number;
    set type(val: number);
    get seq(): number;
    set seq(val: number);
    get time(): number;
    set time(val: number);
    get source(): number;
    set source(val: number);
    get payload(): Buffer<ArrayBuffer>;
    set payload(val: Buffer<ArrayBuffer>);
    get packet(): Buffer<ArrayBufferLike>;
    set packet(val: Buffer<ArrayBufferLike>);
}
export default RTPPacket;
