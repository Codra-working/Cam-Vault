import { Readable } from "node:stream";
import RTSPClient from "./RTSPClient";
import CircularQueue from "./CircularQueue";
import RTPPacket from "./transports/RTPPacket";
export default class RTSPClientAdapter extends Readable {
    rtspClient: RTSPClient;
    channel: number;
    queue: CircularQueue<RTPPacket>;
    constructor(username: string, password: string, options: any);
}
