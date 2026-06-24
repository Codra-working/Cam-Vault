import RTSPClient from '../RTSPClient';
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
    timestamp: number;
    durationTicks: number;
};
export default class H264Transport extends Readable {
    client: RTSPClient;
    rtpPackets: Buffer[];
    _headerWritten: boolean;
    stream: Buffer[];
    AUqueue: Queue;
    protected canPushMore: boolean;
    protected MAX_QUE_SIZE: number;
    curPacketTimestamp: number;
    details: Details;
    nextPacketTimestamp: number;
    prevPacketMarker: boolean;
    firstAUHead: Buffer | undefined;
    constructor(client: RTSPClient, details: Details);
    processConnectionDetails(): void;
    processRTPPacket(packet: RTPPacket): void;
    processRTPFrame(rtpPackets: Buffer[]): void;
    _read(): void;
}
declare class Queue {
    bottom: number;
    q: AccessUnit[];
    push(x: AccessUnit): void;
    deque(): AccessUnit;
    isEmpty(): boolean;
    reset(): void;
    size(): number;
}
export {};
