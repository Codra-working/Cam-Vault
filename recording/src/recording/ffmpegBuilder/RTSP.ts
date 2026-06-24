import { PassThrough, Writable } from 'node:stream';

import { H264Transport, RTSPClient, type Details } from 'yellowstone';

import { Demuxer, Muxer, Packet, Rational } from 'node-av';
import { Injectable } from '@nestjs/common';

type AccessUnit = {
  data: Buffer;
  packetType: 'key' | 'delta';
  clockRate: number;
  timestamp: number;
  durationTicks: number;
};

@Injectable()
export class RTSPConnectionManager {
  client!: RTSPClient;
  detailsArray: Details[] = [];
  h264Transport!: H264Transport;
  async connect(url: string, username = '', password = '') {
    // Will automatically exit if the Argument (the RTSL URL) is missing
    const transport = 'tcp';

    // Step 1: Create an RTSPClient instance
    console.log('Connecting to ' + url);
    this.client = new RTSPClient(username, password);
    this.detailsArray = await this.client.connect(url, {
      connection: transport,
      secure: false,
    });
    console.log('Connected');

    if (this.detailsArray.length == 0) {
      throw new Error(
        'ERROR: There are no compatible RTP payloads to save to disk',
      );
    }
    for (let i = 0; i < this.detailsArray.length; i++) {
      const details = this.detailsArray[i];
      console.log(`Stream ${i.toString()}. Codec is`, details.codec);
      // Step 3: Open the output file
      if (details.codec == 'H264') {
        // Step 4: Create H264Transport passing in the client, file, and details
        // This class subscribes to the client 'data' event, looking for the video payload
        this.client.h264Transport = new H264Transport(this.client, details);
      } else throw new Error('Error: not supported codec');
    }
  }
  async play() {
    // Step 5: Start streaming!
    await this.client.play();
    console.log('Play sent');
  }
}

export const videoToSegments = (
  accessUnitStream: H264Transport,
  cb,
  segmentDuration: number,
) => {
  let isFirstAU = true;
  let acessUnits: AccessUnit[] = [];
  let start: number = -1;
  let elapsedTime = 0;
  accessUnitStream.on('data', (accessUnit: AccessUnit) => {
    const firstAUHead = accessUnitStream.firstAUHead;
    if (!firstAUHead) {
      console.log('Warning: AU is droped since there are no FU header');
      return;
    }

    const { data, packetType, clockRate, timestamp } = accessUnit;

    //calculate elapsed time
    if (start != -1) {
      const delta = (timestamp - start) >>> 0;
      elapsedTime = delta / clockRate;
    }
    //when the time is not elapsed
    if (elapsedTime < segmentDuration) {
      //first key AU
      if (isFirstAU && packetType === 'key') {
        acessUnits.push({
          ...accessUnit,
          data: Buffer.concat([firstAUHead, accessUnit.data]),
        });
        start = timestamp;
        isFirstAU = false;
      } else if (!isFirstAU) {
        acessUnits.push(accessUnit);
      } //first delta AU
    } //when the time is elapsed
    else {
      //when AU is not a key AU
      if (packetType !== 'key') {
        acessUnits.push(accessUnit);
      } //when AU is a key AU
      else {
        //write a segment to the stream
        const outStream = new PassThrough();
        cb(outStream);
        remuxAUsToMpegTs(acessUnits, outStream).catch(console.log);
        //loop initialization;
        start = timestamp;
        acessUnits = [];
        acessUnits.push({
          ...accessUnit,
          data: Buffer.concat([firstAUHead, accessUnit.data]),
        });

        isFirstAU = false;
        elapsedTime = 0;
      }
    }
  });
};
//handle AU

async function remuxAUsToMpegTs(segments: AccessUnit[], target: Writable) {
  console.log('Processing a segment...');

  const videoInput = await Demuxer.open(segments[0].data, { format: 'h264' });
  const output = await Muxer.open(target, { format: 'mpegts' });

  const videoStream = videoInput.video();
  if (!videoStream) {
    throw new Error('processing failed');
  }
  videoStream.timeBase = new Rational(1, segments[0].clockRate);
  const baseTimestamp = segments[0].timestamp;
  const videoIdx = output.addStream(videoStream);

  const startTime = Date.now();
  for (let index = 0; index < segments.length; index++) {
    const au = segments[index];
    const relativeTimestamp = (au.timestamp - baseTimestamp) >>> 0;
    using packet = new Packet();
    packet.alloc();
    packet.data = au.data;
    packet.pts = BigInt(relativeTimestamp);
    packet.dts = BigInt(relativeTimestamp);
    packet.duration = BigInt(au.durationTicks);
    packet.timeBase = {
      num: 1,
      den: au.clockRate,
    };
    packet.isKeyframe = au.packetType === 'key';
    packet.pos = -1n;
    await output.writePacket(packet, videoIdx);
  }
  const elapsedTime = Date.now() - startTime;

  await output.writePacket(null, videoIdx);
  await videoInput.close();
  await output.close();

  console.log(`Processing complete in ${elapsedTime.toString()} ms`);
  target.end();
}
