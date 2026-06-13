import { Body, Controller, Get, Inject, Put } from '@nestjs/common';
import type { RecordingConfigDTO } from './recordingConfig.DTO';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Controller('recording')
export class RecordingController {
  constructor(@Inject('RECORDING_SERVICE') private client: ClientProxy) {}
  @Get('config')
  async getConfig() {
    const streams: string[] = await lastValueFrom(
      this.client.send({ cmd: 'get_RTSP_URLs' }, {}),
    );
    const targetDir: string = await lastValueFrom(
      this.client.send({ cmd: 'get_storage_directory' }, {}),
    );
    const duration: string = await lastValueFrom(
      this.client.send({ cmd: 'get_recording_duration' }, {}),
    );
    const videoLen: number = await lastValueFrom(
      this.client.send({ cmd: 'get_video_length' }, {}),
    );

    return { streams, targetDir, duration, videoLen };
  }
  //아직 활성화 안됨
  @Put('config')
  updateConfig(@Body() recording_config_dto: RecordingConfigDTO) {
    const pattern = { cmd: 'update_recording_config' };
    const payload = recording_config_dto;
    return this.client.send(pattern, payload);
  }
  @Get()
  getVideoList() {
    return;
  }
}
