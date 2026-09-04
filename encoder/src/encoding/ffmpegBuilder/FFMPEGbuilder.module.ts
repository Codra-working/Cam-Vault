import { Module } from '@nestjs/common';
import { FFMPEGBuilderFactory } from './FFMPEGBuilder';

@Module({
  providers: [FFMPEGBuilderFactory],
  exports: [FFMPEGBuilderFactory],
})
export class FFMPEGBuilderModule {}
