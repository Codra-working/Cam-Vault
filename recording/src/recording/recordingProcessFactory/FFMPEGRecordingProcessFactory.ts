import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams } from 'child_process';
import RecordingProcessFactory from './RecordingProcessFactory';
import { EncodingProcessBuilderStrategy } from '../ffmpegBuilder/FFMPEGBuilderStrategy';
import { EncodingContext, FFMPEGProcessBuilder } from '../ffmpegBuilder/FFMPEGBuilder';

@Injectable()
export default class FFMPEGRecordingProcessFactory extends RecordingProcessFactory {
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
