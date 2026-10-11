import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import { ClientProxy } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/common/dto/encodingRequest.dto';
import {
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from 'node:child_process';
import { randomUUID, UUID } from 'node:crypto';
import { DBService } from 'src/DB/DB.service';
import { lastValueFrom } from 'rxjs';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { H264Transport, RTSPClient } from 'yellowstone';
import {
  PassThrough, Readable, Writable,
} from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ConfigService } from '@nestjs/config';
import { checkIfThereAreBucket } from 'src/storage/storage.module';
import { RTSPURL } from 'src/common/types/types';

import { read } from 'node:fs';
import { EncodingContext } from './ffmpegBuilder/FFMPEGBuilder';
import RecordingProcessFactory from './recordingProcessFactory/RecordingProcessFactory';
import AU2Segment from './nodeAV/AU2Segment';

type RecordingStatus = 'starting'|'recording' | 'completed' | 'error' | 'stopped';
type RecordingSession = {
  id: string;
  status: RecordingStatus;
  streamNumber: number;
  rtspURL:RTSPURL;
  segmentLen:number;
  Bucket: string;
  firstFileName?: string;
  startedAt: string;
  endedAt?: string;
  exitCode?: number;
  errors: Error[];
  recordingEngine?: ChildProcessWithoutNullStreams | RTSPClient;
  encodingContext?: EncodingContext;
};

@Injectable()
export default class RecordingService implements OnModuleInit {
  recordingSessions: Map<string, RecordingSession> = new Map();

  private curStreamNumber: number = 0;

  constructor(
    @Inject('RMQ_SERVICE')
    private producer: ClientProxy,
    private recordingProcessFactory: RecordingProcessFactory,
    private dbService: DBService,
    private s3Client: S3Client,
    private configService: ConfigService,
  ) {}

  createRecordingSession(
    sessionID: string,
    rtspURL:RTSPURL,
    segmentLen:number,
    bucket: string,
  ): RecordingSession {
    const session: RecordingSession = {
      id: sessionID,
      streamNumber: this.curStreamNumber,
      rtspURL,
      segmentLen,
      startedAt: new Date().toISOString(),
      status: 'recording',
      Bucket: bucket,
      errors: [],
    };
    this.curStreamNumber++;
    this.recordingSessions.set(sessionID, session);
    return session;
  }

  /**
   * function which turns filePaths in to an EncodingRequest
   * @param filePaths
   * @param videoCodec
   */
  createEncodingRequestPayload(
    Bucket: string,
    Key: string,
    videoCodec: string,
  ): EncodingRequestDTO {
    return {
      Bucket,
      Key,
      codec: videoCodec,
    };
  }

  /**
   * emit event to broker
   * @param eventName Name of event to emit
   * @param job payloads that you want to send with this event
   */
  emit<DTO = EncodingRequestDTO>(eventName: string, job: DTO) {
    return lastValueFrom(this.producer.emit<DTO>(eventName, job));
  }

  getRecordingSession(sessionID: string) {
    return this.recordingSessions.get(sessionID);
  }

  async requestEncoding(recordingSession: RecordingSession, Key: string) {
    if (!recordingSession.id || !recordingSession.startedAt) {
      const something = !recordingSession.id
        ? 'recordingSession.id'
        : 'recordingSession.startedAt';
      console.log(`${something} is missing, cannot send EncodingRequest`);
      return;
    }
    const encodingJob = this.createEncodingRequestPayload(
      recordingSession.Bucket,
      Key,
      'libx264',
    );
    // await this.dbService.save(

    //   recordingSession.Key,
    //   recordingSession.startedAt,
    //   recordingSession.endedAt,
    // );
    await this.emit('encoding_request', encodingJob);
  }

  // async monitorSegmentListFile(recordingSession: RecordingSession) {
  //   await this.requestEncoding(recordingSession);
  // }

  bindRecordingProcessToSession(session: RecordingSession) {
    if (!(session.recordingEngine instanceof ChildProcess)) {
      const msg = 'session.recordingEngine should be instance of ChildProcess';
      session.errors.push(new Error(msg));
      throw session.errors;
    }
    const process = session.recordingEngine;
    // const chunkToString = (chunk: Buffer) => chunk.toString();
    // process.stderr.on('data', (chunk) => {
    //   console.log(chunkToString(chunk));
    // });
    process.on('error', (err) => {
      session.endedAt = new Date().toISOString();
      session.errors.push(err);
      session.status = 'error';
      throw session.errors;
    });

    process.once('close', (code, signal) => {
      session.endedAt = new Date().toISOString();
      if (signal !== null || code === null) {
        session.errors.push(new Error(`process terminated by: ${signal} ${code}`));
        session.status = 'stopped'; // 다시 시작 필요
      } else if (code === 0) {
        // recording success
        session.exitCode = code;
        session.status = 'completed';
        this.requestEncoding(session, session.firstFileName!);
        this.dbService.save({
          sessionID: session.id,
          RTSPURL: session.rtspURL,
          segmentNumber: 0,
          Bucket: session.Bucket,
          Key: session.firstFileName!,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          isEncoded: false,
        });
      } else {
        session.errors.push(new Error(`process terminated by: ${signal} ${code}`));
        session.status = 'error';
      }
      if (session.errors.length > 0) throw session.errors;
      return session;
    });
  }

  // 녹화,인코딩,DB저장에 원자성이 필요함
  async record(session:RecordingSession) {
    await checkIfThereAreBucket(this.s3Client, session.Bucket);

    const recordingContext: EncodingContext = {
      inputs: [session.rtspURL],
      outputs: [session.Bucket],
      segmentLen: session.segmentLen,
      codec: 'copy',
      segmentInfoFile: path.join(session.Bucket, `${session.rtspURL}.csv`),
    };

    // create recording process
    const recordingEngine = await this.recordingProcessFactory.create(recordingContext);

    let body: Readable;
    if (recordingEngine instanceof ChildProcess) {
      session.status = 'starting';
      session.recordingEngine = recordingEngine;
      // create video file name
      const key = `${session.id}-${session.startedAt.replace(/[:.]/g, '-')}.ts`;
      this.bindRecordingProcessToSession(session);
      body = recordingEngine.stdout;

      // upload readable stream;
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: session.Bucket,
          Key: key,
          Body: body,
        },
      });
      void upload.done();

      // 보완 필요
    } else {
      let segmentNumber = 0;
      const callback = async (Body: Readable, segmentWasStartedAt: string) => {
        const endedAt = new Date().toISOString();
        const key = `${session.id}-${segmentWasStartedAt.replace(/[:.]/g, '-')}.ts`;
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: session.Bucket,
            Key: key,
            Body,
            ContentType: 'video/mp2t',
            ContentDisposition: 'inline',
          },
        });
        segmentNumber++;
        const jobs = [upload.done().then(() => this.requestEncoding(session, key)),
          this.dbService.save({
            sessionID: session.id,
            RTSPURL: session.rtspURL,
            segmentNumber,
            Bucket: session.Bucket,
            Key: key,
            startedAt: segmentWasStartedAt,
            endedAt,
            isEncoded: false,
          })];
        await Promise.all(jobs);
      };
      const { firstAUHead } = recordingEngine.h264Transport;
      const segmentDuration = session.segmentLen;
      const framesToVideo:AU2Segment = new AU2Segment({
        firstAUHead, segmentDuration, streamIndex: session.streamNumber,
      });
      pipeline((recordingEngine as RTSPClient).h264Transport, framesToVideo);
      for await (const readable of framesToVideo.readableQueue) {
        await callback(readable, readable.startedAt);
      }
    }
    session.status = 'recording';
    return {
      recordingEngine,
      recordingContext,
    };
  }

  onModuleInit() {
    const streams: string[] = this.configService.getOrThrow<string[]>('recording.streams');
    const segmentLen: number = this.configService.getOrThrow<number>(
      'recording.segmentLength',
    );
    console.log(`${streams.length.toString()} streams detacted`);
    // 세션
    for (let i = 0; i < streams.length; i++) {
      const Bucket: string = `stream${(i + 1).toString()}`;
      const sessionID = randomUUID();
      const stream = streams[i];
      const session = this.createRecordingSession(sessionID, stream as RTSPURL, segmentLen, Bucket);
      this.record(session).then((value) => {
        const { recordingEngine, recordingContext } = value;
        session.recordingEngine = recordingEngine;
        session.encodingContext = recordingContext;
      }).catch(console.error);
    }
    return this.recordingSessions;
  }
}
