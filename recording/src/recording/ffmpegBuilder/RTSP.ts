import { PassThrough, Readable, Writable } from 'node:stream';

import { H264Transport, RTSPClient, type Details } from 'yellowstone';

import { Demuxer, Muxer, Packet, pipeline, Rational } from 'node-av';
import { Injectable } from '@nestjs/common';

type RTSPConnection = 'udp' | 'tcp';

type AccessUnit = {
  data: Buffer;
  packetType: 'key' | 'delta';
  clockRate: number;
  timestamp: number;
  durationTicks: number;
};

//responsible for managing a RTSPConnection
@Injectable()
export class RTSPControlBox {
  client!: RTSPClient;
  detailsArray: Details[] = [];
  h264Transport!: H264Transport;
  baseTimeStamp: number;
  RTSPURL: string;
  userName: string;
  password: string;
  transport: RTSPConnection;
  retryflag: boolean = true;
  status: string = 'started';
  postConnectionErrCnt: number;
  constructor(
    url: string,
    username: string = '',
    password: string = '',
    transport: RTSPConnection = 'udp',
    postConnectionErrCnt: number = 5,
  ) {
    this.RTSPURL = url;
    this.userName = username;
    this.password = password;
    this.transport = transport;
    this.postConnectionErrCnt = postConnectionErrCnt;

    // Step 1: Create an RTSPClient instance
    this.client = new RTSPClient(this.userName, password);

    // RTSP post connection error handling
    this.client.on('error', (error) => {
      console.log(error);
      this.status = 'reconecting';
      const sleep = (timeout: number) =>
        new Promise((res) => {
          setTimeout(res, timeout);
        });

      for (let i = 0; i < this.postConnectionErrCnt; i++) {
        sleep(Math.pow(2, i) * 1000)
          .then(() => this.client.close())
          .then(() => this.connect(this.RTSPURL, this.transport))
          .then(() => this.play())
          .then(() => {
            i = this.postConnectionErrCnt - 1;
          })
          .catch((error: unknown) => {
            console.log(error);
            if (i < this.postConnectionErrCnt)
              console.log('Reconnecting to RTSP...');
            else {
              console.error(
                `Warning RTSP reconnect attempts failed, stream ${this.RTSPURL}`,
              );
            }
          });
      }
    });
  }
  async connect(url: string, transport: RTSPConnection) {
    // Will automatically exit if the Argument (the RTSL URL) is missing

    console.log('Connecting to ' + url);
    this.status = 'connecting';
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
    this.status = 'playing';
  }
}

export const videoToSegments = (
  accessUnitStream: H264Transport,
  cb: (stream: Readable, startedAt: string) => void,
  segmentDuration: number,
) => {
  let init = true;
  let startInDate: string = '';
  let elapsedTime = 0;
  let auBaseTimeStamp = -1;
  let firstAUBaseTimeStamp = -1;
  let waitings: AccessUnit[] = [];
  let waitingsBottom = 0;
  let segment: AccessUnit[] = [];
  let veryFirst = true;
  accessUnitStream.on('data', (accessUnit: AccessUnit) => {
    const firstAUHead = accessUnitStream.firstAUHead;
    if (!firstAUHead) {
      console.log('Warning: AU is droped since there are no FU header');
      return;
    }
    waitings.push(accessUnit);

    while (waitingsBottom < waitings.length) {
      const accessUnit: AccessUnit = waitings[waitingsBottom];
      waitingsBottom++;
      if (init && accessUnit.packetType === 'key') {
        init = false;
        startInDate = new Date().toISOString();
        elapsedTime = 0;
        auBaseTimeStamp = accessUnit.timestamp;
        if (veryFirst) {
          firstAUBaseTimeStamp = accessUnit.timestamp;
          veryFirst = false;
        }
        segment = [
          {
            ...accessUnit,
            data: Buffer.concat([firstAUHead, accessUnit.data]),
          },
        ];
        break;
      } else if (init && accessUnit.packetType === 'delta') break;

      //calculate elapsed time
      const delta = (accessUnit.timestamp - auBaseTimeStamp) >>> 0;
      elapsedTime = delta / accessUnit.clockRate;

      //when the time is not elapsed
      if (elapsedTime < segmentDuration) segment.push(accessUnit);
      //when the time is elapsed
      else {
        if (accessUnit.packetType !== 'key') {
          segment.push(accessUnit);
        } //when AU is a key AU
        else {
          //write a segment to the outStream
          const writable = new PassThrough();
          cb(writable, startInDate);
          remuxAUsToMpegTs(segment, writable, firstAUBaseTimeStamp).catch(
            console.log,
          );

          init = true;
          waitings.unshift(accessUnit);
        }
      }
    }
    waitings = [];
    waitingsBottom = 0;
  });
};
//handle AU
export async function remuxSegments(source: Buffer, target: Writable) {
  await using input = await Demuxer.open(source, { format: 'mpegts' });

  await using output = await Muxer.open(target, { format: 'mpegts' });
  const control = pipeline(input, output);
  await control.completion;
}

async function remuxAUsToMpegTs(
  segments: AccessUnit[],
  target: Writable,
  baseTimestamp: number,
) {
  console.log('Processing a segment...');

  const videoInput = await Demuxer.open(segments[0].data, { format: 'h264' });
  const output = await Muxer.open(target, {
    format: 'mpegts',
    options: {
      mpegts_flags: 'initial_discontinuity',
    },
  });

  const videoStream = videoInput.video();
  if (!videoStream) {
    throw new Error('processing failed');
  }
  videoStream.timeBase = new Rational(1, segments[0].clockRate);
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
