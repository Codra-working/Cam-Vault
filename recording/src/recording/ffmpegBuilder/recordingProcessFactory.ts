import { ChildProcessWithoutNullStreams } from 'child_process';
import { EncodingContext, FFMPEGProcessBuilder } from './FFMPEGBuilder';
import { FFMPEGProcessBuildStrategy } from './FFMPEGBuilderStrategy';
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
  create(context: EncodingContext): ChildProcessWithoutNullStreams {
    return new FFMPEGProcessBuilder()
      .applyStrategy(FFMPEGProcessBuildStrategy, context)
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
