import { PassThrough, Readable, Writable } from 'node:stream';

import { H264Transport, RTSPClient, type Details } from 'yellowstone';

import { Demuxer, Muxer, Packet, Rational } from 'node-av';
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
export class RemuxingWorker {
  workerManager: Map<UUID, RemuxingWorker>;
  ID: UUID;
  segment: AccessUnit[];
  segmentBaseTimeStamp: number;
  startedAt: string;
  segmentDuration: number;
  target: Writable;
  constructor(
    workerManeger: Map<UUID, RemuxingWorker>,
    dataPipe: PassThrough,
    segment: AccessUnit[],
    timeStamp: number,
    dateOfStarted: string,
    segmentDuration: number,
  ) {
    this.workerManager = workerManeger;
    this.ID = randomUUID();
    this.target = dataPipe;
    this.segment = segment;
    this.segmentBaseTimeStamp = timeStamp;
    this.startedAt = dateOfStarted;
    this.segmentDuration = segmentDuration;
  }
  async rmAUsToMpegTs() {
    console.log('Processing a segment...');

    await using videoInput = await Demuxer.open(this.segment[0].data, {
      format: 'h264',
    });
    await using output = await Muxer.open(this.target, {
      format: 'mpegts',
      options: {
        mpegts_flags: 'initial_discontinuity',
      },
    });

    const videoStream = videoInput.video();
    if (!videoStream) {
      throw new Error('processing failed');
    }
    videoStream.timeBase = new Rational(1, this.segment[0].clockRate);
    const streamIdx = output.addStream(videoStream);

    const startTime = Date.now();
    for (let index = 0; index < this.segment.length; index++) {
      const au = this.segment[index];
      const relativeTimestamp =
        (au.timestamp - this.segmentBaseTimeStamp) >>> 0;
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
    this.target.end();
    console.log(`Processing complete in ${elapsedTime.toString()} ms`);
  }
  destroy() {
    this.workerManager.delete(this.ID);
  }
}
export const videoToSegments = (
  accessUnitStream: H264Transport,
  cb: (stream: Readable, startedAt: string) => Promise<void>,
  segmentDuration: number,
) => {
  const workerManager: Map<UUID, RemuxingWorker> = new Map();
  const maxConcurrentJobs = 100;
  let startInDate: string = '';
  let elapsedTime = segmentDuration + 1; //isAUListOK is set to false at the very first receivement of AU
  let AUListRef: AccessUnit[] = [];

  accessUnitStream.on('data', (au: AccessUnit) => {
    const firstAUHead = accessUnitStream.firstAUHead as Uint8Array;

    //processing an access unit
    if (elapsedTime < segmentDuration || au.packetType !== 'key')
      AUListRef.push(au);
    else {
      //create a new segment
      const newAUList: AccessUnit[] = [
        {
          ...au,
          data: Buffer.concat([firstAUHead, au.data]),
        },
      ];
      const newStartInDate = new Date().toISOString();
      elapsedTime = 0;

      const isAUListOK =
        AUListRef.length > 0 &&
        AUListRef[0].packetType === 'key' &&
        workerManager.size < maxConcurrentJobs;

      //process previous segment
      if (isAUListOK) {
        //change AUList into a video segment if AUList is ok
        const passThrough = new PassThrough();
        const rmWorker = new RemuxingWorker(
          workerManager,
          passThrough,
          [...AUListRef], //copy current AUList
          AUListRef[0].timestamp,
          startInDate,
          segmentDuration,
        );
        workerManager.set(rmWorker.ID, rmWorker);
        Promise.all([
          rmWorker.rmAUsToMpegTs(),
          cb(passThrough, startInDate), //upload segment and update db
        ])
          .catch(console.log)
          .finally(() => {
            workerManager.delete(rmWorker.ID);
            passThrough.destroy();
          });
      } else {
        //discard AUList
        const msg = `Warning: a Segment is dropped`;
        console.warn(msg);
      }
      //update AUList
      AUListRef = newAUList;
      startInDate = newStartInDate;
    }

    //update elapsed time
    const delta = (au.timestamp - AUListRef[0].timestamp) >>> 0;
    elapsedTime = delta / au.clockRate;
  });
};
