import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { RecordingConfigDTO } from './recordingConfig.DTO';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('recording')
export class RecordingController {
  constructor(@Inject('RECORDING_SERVICE') private client: ClientProxy) {}
  @Get('configs')
  async getConfig() {
    const streams: string[] = await lastValueFrom(
      this.client.send({ cmd: 'get_RTSP_URLs' }, Number(-1)),
    );
    const targetDir: string = await lastValueFrom(
      this.client.send({ cmd: 'get_storage_directory' }, {}),
    );
    const segmentLength: string = await lastValueFrom(
      this.client.send({ cmd: 'get_recording_segment_length' }, {}),
    );

    return { streams, targetDir, segmentLength };
  }

  @Get(['configs/rtspurls', 'configs/rtspurls/:id'])
  getConfigRTSPURLs(@Param('id') idx?: string) {
    return this.client.send(
      { cmd: 'get_RTSP_URLs' },
      idx ? Number(idx) : Number(-1),
    );
  }

  @Post('configs/rtspurls')
  setConfigRTSPURL(@Body('url') url: string) {
    return this.client.send({ cmd: 'set_RTSP_URL' }, url);
  }

  @Put('configs/rtspurls')
  @Get()
  getVideoList() {
    return;
  }
}
