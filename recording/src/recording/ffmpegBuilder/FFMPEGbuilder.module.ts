import { Module } from '@nestjs/common';
import { FFMPEGBuilder } from './FFMPEGBuilder';

@Module({
    providers:[FFMPEGBuilder],
    exports:[FFMPEGBuilder]
})
export class FFMPEGBuilderModule {}
