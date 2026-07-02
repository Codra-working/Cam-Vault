import { Module } from '@nestjs/common';
import { FFMPEGBuilder } from './FFMPEGBuilder.service';

@Module({
  providers: [FFMPEGBuilder],
  exports: [FFMPEGBuilder],
})
export class FFMPEGBuilderModule {}
