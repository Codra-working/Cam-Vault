import { RTPPacket } from '../util';
import * as transform from 'sdp-transform';
import { Readable } from 'stream';
export interface Details {
    codec: string;
    mediaSource: transform.MediaDescription;
    rtpChannel: number;
    rtcpChannel: number;
}
type AccessUnit = {
    data: Buffer;
    packetType: 'key' | 'delta';
    clockRate: number;
    timestamp: bigint;
    durationTicks: bigint;
};
export default class H264Transport extends Readable {
    client: Readable;
    rtpPackets: Buffer[];
    _headerWritten: boolean;
    stream: Buffer[];
    details: Details;
    AUqueue: CircularQueue<AccessUnit | null>;
    curPacketTimestamp: bigint;
    nextPacketTimestamp: bigint;
    prevPacketMarker: boolean;
    firstAUHead: Buffer | undefined;
    constructor(client: any, details: Details);
    processConnectionDetails(): void;
    processRTPPacket(packet: RTPPacket): void;
    processRTPFrame(rtpPackets: Buffer[]): AccessUnit | null | undefined;
    /**
     * inner read function
     * @param size the number of AU to read
     */
    _read(): void;
}
declare class CircularQueue<inputType> {
    buffer: inputType[];
    p1: number;
    p2: number;
    emptyFlag: boolean;
    constructor(qSize: number);
    isEmpty(): boolean;
    isFull(): boolean;
    enqueue(x: inputType): inputType | undefined;
    dequeue(): inputType | undefined;
}
export {};
