import { Readable } from "node:stream";
import RTSPClient from "./RTSPClient";
import CircularQueue from "./CircularQueue";
import RTPPacket from "./transports/RTPPacket";

export default class RTSPClientAdapter extends Readable{
    rtspClient:RTSPClient;
    channel!:number;
    queue:CircularQueue<RTPPacket>;
    constructor(username:string,password:string,options:any){
        options.objectMode=true;
        super(options)
        this.rtspClient=new RTSPClient(username,password);
        this.queue=new CircularQueue(1024);
        this.rtspClient.on('data',(channel: number, data: Buffer, packet: RTPPacket)=>{
            this.channel=channel;
            this.queue.enqueue(packet);
        })
    }
    // _read(size: number): void {
    //     const packet:RTPPacket=undefined;
    //     if(this.queue.isEmpty())
    // }
}