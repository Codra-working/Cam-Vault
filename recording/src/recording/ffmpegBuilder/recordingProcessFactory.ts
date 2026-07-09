import { ChildProcessWithoutNullStreams } from 'child_process';
import { EncodingContext, FFMPEGProcessBuilder } from './FFMPEGBuilder';
import { EncodingProcessBuilderStrategy } from './FFMPEGBuilderStrategy';
import { Injectable } from '@nestjs/common';
import { RTSPClient } from 'yellowstone';
import { RTSPConnectionManager } from './RTSP';
import { ConfigService } from '@nestjs/config';

export abstract class RecordingProcessFactory {
  abstract create(
    context: EncodingContext,
  ): ChildProcessWithoutNullStreams | Promise<RTSPClient>;
}
@Injectable()
export class FFMPEGRecordingProcessFactory extends RecordingProcessFactory {
  private readonly ffmpegProcessBuildStrategy: EncodingProcessBuilderStrategy<FFMPEGProcessBuilder>;
  constructor(
    buildStrategy: EncodingProcessBuilderStrategy<FFMPEGProcessBuilder>,
  ) {
    super();
    this.ffmpegProcessBuildStrategy = buildStrategy;
  }
  create(context: EncodingContext): ChildProcessWithoutNullStreams {
    return new FFMPEGProcessBuilder()
      .applyStrategy(this.ffmpegProcessBuildStrategy, context)
      .build();
  }
}
@Injectable()
export class NodeAVRecordingEngine extends RecordingProcessFactory {
  constructor(private configService: ConfigService) {
    super();
  }
  async create(context: EncodingContext): Promise<RTSPClient> {
    const rtsp = new RTSPConnectionManager();
    await rtsp.connect(
      context.inputs[0],
      this.configService.get('username'),
      this.configService.get('password'),
    );
    await rtsp.play();
    return rtsp.client;
  }
}
