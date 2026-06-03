import { Module } from '@nestjs/common';
import { FFMPEGBuilder } from './FFmpegProcessBuilder';

@Module({
    providers:[FFMPEGBuilder],
    exports:[FFMPEGBuilder]
})
export class ProcessBuilderModule {}
