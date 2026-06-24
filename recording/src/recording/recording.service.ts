import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import { ClientProxy } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { EncodingContext } from './ffmpegBuilder/FFMPEGBuilder';
import {
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DBService } from 'src/DB/DB.service';
import { watch } from 'node:fs/promises';
import { lastValueFrom } from 'rxjs';
import { RecordingProcessFactory } from './ffmpegBuilder/recordingProcessFactory';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { RTSPClient } from 'yellowstone';
import { Readable } from 'node:stream';
import { videoToSegments } from './ffmpegBuilder/RTSP';
import { ConfigService } from '@nestjs/config';
import { checkIfThereAreBucket } from 'src/storage/storage.module';

type RecordingStatus = 'recording' | 'completed' | 'error' | 'stopped';
type VideoFileExt =
  | '.ts'
  | '.mp4'
  | '.mkv'
  | '.mov'
  | '.avi'
  | '.webm'
  | '.flv'
  | '.m3u8';
type RecordingSession = {
  id: string;
  recordingEngine: ChildProcessWithoutNullStreams | RTSPClient;
  encodingContext: EncodingContext;
  streamNumber: number;
  startedAt: string;
  endedAt?: string;
  status: RecordingStatus;
  exitCode?: number;
  error?: Error;
  Bucket: string;
  Key?: string;
  watchAbortController: AbortController;
};

@Injectable()
export class RecordingService implements OnModuleInit {
  private recordingSessions: Map<string, RecordingSession> = new Map();
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
    process: ChildProcessWithoutNullStreams | RTSPClient,
    encodingContext: EncodingContext,
    bucket: string,
  ): RecordingSession {
    const session: RecordingSession = {
      id: sessionID,
      streamNumber: this.curStreamNumber,
      recordingEngine: process,
      encodingContext: encodingContext,
      startedAt: new Date().toISOString(),
      status: 'recording',
      Bucket: bucket,
      watchAbortController: new AbortController(),
    };
    this.curStreamNumber++;
    this.recordingSessions.set(sessionID, session);
    return session;
  }

  /**
   * function where turns filePaths in to an array of EncodingRequest
   * @param filePaths
   * @param videoCodec
   */
  createEncodingRequestPayload(
    filePath: string,
    videoCodec: string,
  ): EncodingRequestDTO {
    return {
      filePath: path.parse(filePath),
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

  async requestEncodingForCompletedSegment(recordingSession: RecordingSession) {
    try {
      if (
        !recordingSession.Key ||
        !recordingSession.startedAt ||
        !recordingSession.endedAt
      ) {
        const something = !recordingSession.Key
          ? 'recordingSession.Key'
          : !recordingSession.startedAt
            ? 'recordingSession.startedAt'
            : 'recordingSession.endedAt';
        console.log(`${something} is missing, cannot send EncodingRequest`);
        return;
      }
      const encodingJob = this.createEncodingRequestPayload(
        recordingSession.Key,
        'libx264',
      );
      // await this.dbService.save(

      //   recordingSession.Key,
      //   recordingSession.startedAt,
      //   recordingSession.endedAt,
      // );
      await this.emit('encoding_request', encodingJob);
    } catch (error) {
      console.log(error);
    }
  }

  async monitorSegmentListFile(recordingSession: RecordingSession) {
    if (!recordingSession.encodingContext.segmentInfoFile) {
      throw new Error(
        'segmentInfoFile is missing, cannot monitor segments of the recording stream',
      );
    }
    const segmentInfoFile = recordingSession.encodingContext.segmentInfoFile;
    const targetDir = path.parse(segmentInfoFile).dir;
    const signal = recordingSession.watchAbortController.signal;
    try {
      for await (const { eventType, filename } of watch(targetDir, {
        signal,
      })) {
        if (filename !== segmentInfoFile) continue;
        else if (eventType === 'change') {
          const lines = readFileSync(segmentInfoFile)
            .toString()
            .trim()
            .split(/\r?\n/);
          if (lines.length - 2 >= 0)
            await this.requestEncodingForCompletedSegment(recordingSession);
        }
      }
    } catch (error) {
      console.log(error);
      recordingSession.error = error as Error;
    }
  }

  bindRecordingProcessToSession(session: RecordingSession) {
    const process = session.recordingEngine;

    process.on('error', (err) => {
      session.endedAt = new Date().toISOString();
      session.error = err;
      session.status = 'error';
      console.log(session.error);
      return;
    });

    process.on('close', (code, signal) => {
      session.endedAt = new Date().toISOString();
      if (signal !== null || code === null) {
        session.error = new Error(`process terminated by: ${signal} ${code}`);
        session.status = 'stopped'; //다시 시작 필요
      } else {
        if (code === 0) {
          //recording success
          session.exitCode = code;
          session.status = 'completed';
        } else {
          session.error = new Error(`process terminated by: ${signal} ${code}`);
          session.status = 'error';
        }
      }

      session.watchAbortController.abort();
      if (session.error) console.log(session.error);
      return session;
    });
  }
  async record(inputStream: string, segmentLen: number, Bucket: string) {
    await checkIfThereAreBucket(this.s3Client, Bucket);

    const recordingContext: EncodingContext = {
      inputs: [inputStream],
      outputs: [Bucket],
      segmentLen: segmentLen,
      codec: 'copy',
      segmentInfoFile: path.join(Bucket, `${inputStream}.csv`),
    };

    //create recording process
    const recordingEngine =
      await this.recordingProcessFactory.create(recordingContext);

    // create and register a new recording session
    const sessionID = randomUUID();
    const session = this.createRecordingSession(
      sessionID,
      recordingEngine,
      recordingContext,
      Bucket,
    );
    let body: Readable;
    if (session.recordingEngine instanceof ChildProcess) {
      this.bindRecordingProcessToSession(session);
      body = session.recordingEngine.stdout;
      const videoFileName = `stream${this.curStreamNumber.toString()} ${session.startedAt}.ts`;
      //create recording output file name
      session.Key = videoFileName;

      //upload readable stream;
      try {
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: session.Bucket,
            Key: session.Key,
            Body: body,
          },
        });
        await upload.done();
        await this.monitorSegmentListFile(session);
      } catch (error) {
        console.log(error);
      }
    } else {
      let segmentNumber = 0;
      const pipe = async (body: Readable) => {
        session.Key = `${sessionID}-${new Date().toISOString().replace(/[:.]/g, '-')}.ts`;
        session.endedAt = new Date().toISOString();
        try {
          const upload = new Upload({
            client: this.s3Client,
            params: {
              Bucket: session.Bucket,
              Key: session.Key,
              Body: body,
            },
          });
          await upload.done();
          //await this.requestEncodingForCompletedSegment(session);

          segmentNumber++;
          await this.dbService.save(
            session.Bucket,
            session.Key,
            session.startedAt,
            new Date().toISOString(),
            false,
          );
        } catch (error) {
          console.log(error);
        }
      };
      videoToSegments(session.recordingEngine.h264Transport, pipe, segmentLen);
    }
  }

  onModuleInit() {
    const streams: string[] =
      this.configService.getOrThrow<string[]>('streams');
    const videoLen: number =
      this.configService.getOrThrow<number>('segmentLength');
    console.log(`${streams.length.toString()} streams detacted`);
    for (let i = 0; i < streams.length; i++) {
      const Bucket: string = `stream${(i + 1).toString()}`;
      this.record(streams[i], videoLen, Bucket).catch(console.error);
    }
  }
}
