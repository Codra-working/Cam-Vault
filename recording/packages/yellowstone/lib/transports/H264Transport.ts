// Process SDP and RTP packets
// De-packetize RTP packets to re-create H264 NAL Units
// Write H264 NAL units to a .264 file

import RTSPClient from '../RTSPClient';
import { RTPPacket } from '../util';
import * as transform from 'sdp-transform';
import {  Readable } from 'stream';

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
// .h264 file header
const H264_HEADER = Buffer.from([0x00, 0x00, 0x00, 0x01]);

export default class H264Transport extends Readable {
  client: RTSPClient;
  rtpPackets: Buffer[] = [];
  _headerWritten = false;
  stream: Buffer[];

  AUqueue:CircularQueue<AccessUnit>= new CircularQueue<AccessUnit>(100);
  protected canPushMore:boolean=false;
  protected MAX_QUE_SIZE=150;
  curPacketTimestamp = -1;
  details: Details;
  nextPacketTimestamp = -1;
  prevPacketMarker = false;
  firstAUHead:Buffer|undefined=undefined;
  constructor(
    client: RTSPClient,
    details: Details,
  ) {
    super({objectMode:true,highWaterMark:30});
    this.stream=[];
    this.client = client;
    this.details = details;
    client.on('data', (channel: number, data: Buffer, packet: RTPPacket) => {
      if (channel == details.rtpChannel) {
        if (this._headerWritten) {
          this.processRTPPacket(packet);
        }
      }
    });
    this.processConnectionDetails();
  }

  
  processConnectionDetails(): void {

    const details=this.details;
    // Extract SPS and PPS from the MediaSource part of the SDP
    const fmtp = details.mediaSource.fmtp[0];

    if (!fmtp) {
      return;
    }

    const fmtpConfig = transform.parseParams(fmtp.config);
    const splitSpropParameterSets = fmtpConfig['sprop-parameter-sets']
      .toString()
      .split(',');
    const sps_base64 = splitSpropParameterSets[0];
    const pps_base64 = splitSpropParameterSets[1];
    const sps = Buffer.from(sps_base64, 'base64');
    const pps = Buffer.from(pps_base64, 'base64');

    this.stream.push(H264_HEADER);
    this.stream.push(sps);
    this.stream.push(H264_HEADER);
    this.stream.push(pps);

    this._headerWritten = true;
    this.firstAUHead=(Buffer.concat([H264_HEADER,sps,H264_HEADER,pps]));
  }

  processRTPPacket(packet: RTPPacket): void {
    this.nextPacketTimestamp = packet.timestamp;

    // When Marker is set to 1 pass the group of packets to processRTPFrame()
    if (this.curPacketTimestamp !== this.nextPacketTimestamp) {
      if (this.prevPacketMarker) {
        this.processRTPFrame(this.rtpPackets);
      } else {
        console.log(
          'H264Warning: Access unit is discarded since there are no marker on last RTP packet...',
        );
      }

      this.curPacketTimestamp = this.nextPacketTimestamp;
      this.stream=[]
      this.rtpPackets = [];
    }
    this.prevPacketMarker = packet.marker === 1;

    // Accumatate RTP packets
    this.rtpPackets.push(packet.payload);
  }

  processRTPFrame(rtpPackets: Buffer[]) {
    const nals = [];
    let partialNal = [];

    for (let i = 0; i < rtpPackets.length; i++) {
      const packet = rtpPackets[i];
      const nal_header_f_bit = (packet[0] >> 7) & 0x01;
      const nal_header_nri = (packet[0] >> 5) & 0x03;
      const nal_header_type = (packet[0] >> 0) & 0x1f;

      if (nal_header_type >= 1 && nal_header_type <= 23) {
        // Normal NAL. Not fragmented
        nals.push(packet);
      } else if (nal_header_type == 24) {
        // Aggregation type STAP-A. Multiple NAls in one RTP Packet
        let ptr = 1; // start after the nal_header_type which was '24'
        // if we have at least 2 more bytes (the 16 bit size) then consume more data
        while (ptr + 2 < packet.length - 1) {
          const size = (packet[ptr] << 8) + (packet[ptr + 1] << 0);
          ptr = ptr + 2;
          nals.push(packet.slice(ptr, ptr + size));
          ptr = ptr + size;
        }
      } else if (nal_header_type == 25) {
        // STAP-B
        // Not supported
      } else if (nal_header_type == 26) {
        // MTAP-16
        // Not supported
      } else if (nal_header_type == 27) {
        // MTAP-24
        // Not supported
      } else if (nal_header_type == 28) {
        // Frag FU-A
        // NAL is split over several RTP packets
        // Accumulate them in a tempoary buffer
        // Parse Fragmentation Unit Header
        const fu_header_s = (packet[1] >> 7) & 0x01; // start marker
        const fu_header_e = (packet[1] >> 6) & 0x01; // end marker
        const fu_header_type = (packet[1] >> 0) & 0x1f; // Original NAL unit header

        // Check Start and End flags
        if (fu_header_s == 1 && fu_header_e == 0) {
          // Start of Fragment}
          const reconstructed_nal_type =
            (nal_header_f_bit << 7) + (nal_header_nri << 5) + fu_header_type;
          partialNal = [];
          partialNal.push(reconstructed_nal_type);

          // copy the rest of the RTP payload to the temp buffer
          for (let x = 2; x < packet.length; x++) partialNal.push(packet[x]);
        }

        if (fu_header_s == 0 && fu_header_e == 0) {
          // Middle part of fragment}
          for (let x = 2; x < packet.length; x++) partialNal.push(packet[x]);
        }

        if (fu_header_s == 0 && fu_header_e == 1) {
          // End of fragment}
          for (let x = 2; x < packet.length; x++) partialNal.push(packet[x]);
          nals.push(Buffer.from(partialNal));
        }
      } else if (nal_header_type == 29) {
        // Frag FU-B
        // Not supported
      }
    }

    // Write out all the NALs
    for (let x = 0; x < nals.length; x++) {
      this.stream.push(H264_HEADER);
      this.stream.push(nals[x]);
    }

      const packetType = nals.some((nal) => (nal[0] & 0x1f) === 5)
        ? 'key'
        : 'delta';
      const clockRate = this.details.mediaSource.rtp[0].rate
        ? this.details.mediaSource.rtp[0].rate
        : 90000;
      const timestamp = this.curPacketTimestamp;
      const durationTicks =
        (this.nextPacketTimestamp - this.curPacketTimestamp) >>> 0;
      const AU:AccessUnit={data:Buffer.concat(this.stream),packetType,clockRate,timestamp,durationTicks}
      if(!this.AUqueue.isFull()){
        if(!this.canPushMore){
          this.AUqueue.enqueue(AU)
          return;
        }
          
        this.canPushMore=this.push(AU);
        return;
      }
      this.AUqueue.dequeue();
      this.AUqueue.enqueue(AU)
  }
  _read():void{
    this.canPushMore=true;
    while(!this.AUqueue.isEmpty()&&this.canPushMore){
      this.canPushMore=this.push(this.AUqueue.dequeue())
    }
  };
}
class CircularQueue<inputType>{
  q:inputType[]
  p1:number
  p2:number
  emptyFlag:boolean
  //rule1: p1,p2 ∈ [0, qlen-1]
  //suppose rule1 is always true when any function is called
  constructor(qSize:number){
    this.q=Array<inputType>(qSize)
    this.p1=0
    this.p2=this.q.length-1
    this.emptyFlag=true
  }
  isEmpty(){
    return this.emptyFlag
  }
  isFull():boolean{
    if((this.p2===this.p1-1||(this.p1===0&&this.p2===this.q.length-1))&&!this.isEmpty())//if rule1 and (( p2 = p1-1 ) or (p1 = 0 and p2 = qlen-1))
      return true
    return false; 
  }
  enqueue(x:inputType):inputType | undefined{
    
    if(this.isFull()) {
      //cannot enqueue
      return undefined
    }
    this.emptyFlag=false
    //rule1 is true since there is no change in p1,p2
    //we should find a way to increase p2(enqueue) without violating rule 1
  
    if(this.p2!==this.q.length-1){// rule1 and p2!=p1-1 and p2 !=qlen-1 ⇔ p1 ∈ [0, qlen-1]\{p2+1} p2 ∈ [0, qlen-2]
      //so we can increase p2 without rule1 violation
      this.p2++;
      this.q[this.p2]=x
      return x
    }
    // rule1 is true since there are no change in p1,p2
    // rule1 and p2!=p1-1 and p1!=0 and p2 =qlen-1 ⇔ p1 ∈ [1, qlen-1], p2=qLen-1 
    // we can't increase p2 since rule1 violation
    // let p2=0 then rule1 is true
    this.p2=0 
    this.q[this.p2]=x
    return x
  }

  dequeue():inputType | undefined{
    if(this.isEmpty()){ 
      return undefined
    }
    //if rule1 and not empty
    //we should find a way to increase p1(dequeue) without violating rule1
    let retValue:inputType;
    if(this.p1===this.q.length-1){
      retValue = this.q[this.p1]
      this.p1=0  
    }else{
      retValue = this.q[this.p1++] 
    }
    if(this.p2===this.p1-1||(this.p1===0&&this.p2===this.q.length-1))this.emptyFlag=true
    //if rule1 and p1!=p2 and p1!=qlen-1 then p1 ∈ [0,qlen-2]
    //we can increase p1 since p1!=qlen-1
    return retValue
  }
}

class Queue{
  bottom:number=0;
  q:AccessUnit[]=[]
  
  push(x:AccessUnit){
    this.q.push(x)
  }
  deque(){
    const temp =this.q[this.bottom]
    this.bottom++;
    return temp
  }
  isEmpty(){
    return this.q.length===this.bottom;
  }
  reset(){
    this.bottom=0;
    this.q=[]
  }
  size(){
    return this.q.length-this.bottom
  }
}