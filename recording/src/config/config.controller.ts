import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  //RTSP URLS config
  @MessagePattern({ cmd: 'get_RTSP_URLs' })
  getUrls(@Payload() idx: number) {
    if (idx === -1) {
      return this.configService.get<string[]>('streams');
    }
    return this.configService.get<string[]>('streams')[idx];
  }

  //config
  @MessagePattern({ cmd: 'set_RTSP_URL' })
  setUrls(@Payload() RTSPURL: string) {
    const streams: string[] = this.configService.get('streams')!;
    streams.push(RTSPURL);
    this.configService.set('streams', streams);
    console.log(`new stream added: ${RTSPURL}`);
  }

  //Storage Directory config
  @MessagePattern({ cmd: 'get_storage_directory' })
  getDirectory() {
    return this.configService.get('targetDirectory');
  }

  //config
  @MessagePattern({ cmd: 'set_storage_directory' })
  setDirectory(directoryPath: string) {
    this.configService.set('targetDirectory', directoryPath);
  }

  //config
  @MessagePattern({ cmd: 'get_recording_segment_length' })
  getRecordingDuration() {
    return this.configService.get('segmentLength');
  }

  //config
  @MessagePattern({ cmd: 'set_recording_duration' })
  setRecordingDuration(segmentLength) {
    this.configService.set('segmentLength', segmentLength);
  }
}
