import { PassThrough, Readable, Writable } from 'node:stream';

import { H264Transport, RTSPClient, type Details } from 'yellowstone';

import { Demuxer, Muxer, Packet, pipeline, Rational } from 'node-av';
import { Injectable } from '@nestjs/common';
import { randomUUID, UUID } from 'node:crypto';
type AccessUnit = {
  data: Buffer;
  packetType: 'key' | 'delta';
  clockRate: number;
  timestamp: number;
  durationTicks: number;
};

@Injectable()
export class RTSPClientManager {
  client!: RTSPClient;
  detailsArray: Details[] = [];
  h264Transport!: H264Transport;
  baseTimeStamp: number;
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
export class SegmentJob {
  ID: UUID;
  segment: AccessUnit[];
  baseTimestamp: number;
  startedAt: string;
  segmentDuration: number;
  dataPipe: PassThrough;
  constructor(
    dataPipe: PassThrough,
    segment: AccessUnit[],
    baseTimeStamp: number,
    dateOfStarted: string,
    segmentDuration: number,
  ) {
    this.ID = randomUUID();
    this.dataPipe = dataPipe;
    this.segment = segment;
    this.baseTimestamp = baseTimeStamp;
    this.startedAt = dateOfStarted;
    this.segmentDuration = segmentDuration;
  }
}
export const videoToSegments = (
  accessUnitStream: H264Transport,
  cb: (stream: Readable, startedAt: string) => Promise<void>,
  segmentDuration: number,
) => {
  const workers: Map<UUID, SegmentJob> = new Map();
  const maxConcurrentJobs = 100;
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
          //create and register a Job
          if (workers.size < maxConcurrentJobs) {
            const dataPipe = new PassThrough();
            const worker = new SegmentJob(
              dataPipe,
              segment,
              auBaseTimeStamp,
              startInDate,
              segmentDuration,
            );
            workers.set(worker.ID, worker);
            Promise.all([
              muxAUsToMpegTs(segment, dataPipe, firstAUBaseTimeStamp).then(() =>
                dataPipe.end(),
              ),
              cb(dataPipe, startInDate),
            ])
              .catch(console.log)
              .finally(() => {
                workers.delete(worker.ID);
                dataPipe.destroy();
              });
          } else {
            //skip segment
            const msg = `Warning: A segment is dropped`;
            console.warn(msg);
          }
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

async function muxAUsToMpegTs(
  segment: AccessUnit[],
  target: Writable,
  baseTimestamp: number,
) {
  console.log('Processing a segment...');

  await using videoInput = await Demuxer.open(segment[0].data, {
    format: 'h264',
  });
  await using output = await Muxer.open(target, {
    format: 'mpegts',
    options: {
      mpegts_flags: 'initial_discontinuity',
    },
  });

  const videoStream = videoInput.video();
  if (!videoStream) {
    throw new Error('processing failed');
  }
  videoStream.timeBase = new Rational(1, segment[0].clockRate);
  const streamIdx = output.addStream(videoStream);

  const startTime = Date.now();
  for (let index = 0; index < segment.length; index++) {
    const au = segment[index];
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
    await output.writePacket(packet, streamIdx);
  }
  const elapsedTime = Date.now() - startTime;

  await output.writePacket(null, streamIdx);

  console.log(`Processing complete in ${elapsedTime.toString()} ms`);
}
