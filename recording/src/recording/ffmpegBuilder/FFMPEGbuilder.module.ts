import { Module } from '@nestjs/common';
import {
  NodeAVRecordingEngine,
  // FFMPEGRecordingProcessFactory,
  RecordingProcessFactory,
} from './recordingProcessFactory';
import { ConfigModule } from 'src/config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RecordingProcessFactory,
      useClass: NodeAVRecordingEngine,
    },
  ],
  exports: [RecordingProcessFactory],
})
export class FFMPEGBuilderModule {}
