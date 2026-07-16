import { ChildProcessWithoutNullStreams } from 'child_process';
import { EncodingContext, FFMPEGProcessBuilder } from './FFMPEGBuilder';
import { EncodingProcessBuilderStrategy } from './FFMPEGBuilderStrategy';
import { Injectable } from '@nestjs/common';
import { RTSPClient } from 'yellowstone';
import { RTSPControlBox } from './RTSP';
import { ConfigService } from '@nestjs/config';

export abstract class RecordingProcessFactory {
  abstract create(
    context: EncodingContext,
  ): ChildProcessWithoutNullStreams | Promise<RTSPClient | undefined>;
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
  async create(context: EncodingContext): Promise<RTSPClient | undefined> {
    let rtsp: RTSPControlBox;
    for (let i = 0; i < 5; i++) {
      rtsp = new RTSPControlBox(
        context.inputs[0],
        this.configService.get<string>('username') ?? '',
        this.configService.get<string>('password') ?? '',
      );
      try {
        await rtsp.connect(context.inputs[0], 'tcp');
        await rtsp.play();
        return rtsp.client;
      } catch (error) {
        console.log(error);
        await rtsp.client.close();
        if (i < 5) {
          console.log('reconnecting...');
        } else {
          console.log(
            `Warning RTSP stream connection failed; ${context.inputs[0]} `,
          );
        }
      }
    }
  }
}
