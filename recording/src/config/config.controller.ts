import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  //RTSP URLS config
  @MessagePattern({ cmd: 'Get_config_rtsp_urls' })
  getUrls() {
    return this.configService.getOrThrow<string[]>('recording.streams');
  }

  @MessagePattern({ cmd: 'Get_config_rtsp_urls_:id' })
  getUrl(@Payload() idx: number) {
    return this.configService.getOrThrow<string[]>('recording.streams')[idx];
  }

  @MessagePattern({ cmd: 'Post_config_rtsp_urls' })
  setUrls(@Payload() RTSPURL: string) {
    const inStream = String(RTSPURL);
    const streams: string[] =
      this.configService.getOrThrow('recording.streams');
    streams.push(inStream);
    this.configService.set('streams', streams);
    return inStream;
  }

  @MessagePattern({ cmd: 'Delete_config_rtsp_urls' })
  delURL(@Payload() RTSPURL: string) {
    if (!isNaN(Number(RTSPURL))) {
      const index = Number(RTSPURL);
      const streams: string[] =
        this.configService.getOrThrow('recording.streams');
      const target: string = streams.splice(index, 1)[0];
      this.configService.set('streams', streams);
      return target;
    }
    const target = String(RTSPURL);
    const streams: string[] =
      this.configService.getOrThrow('recording.streams');
    const index = streams.indexOf(target);
    if (index !== -1) {
      streams.splice(index, 1);
      this.configService.set('recording.streams', streams);
      return target;
    }
  }

  //config
  @MessagePattern({ cmd: 'Get_config_segmentLength' })
  getRecordingDuration() {
    return this.configService.getOrThrow<number>('recording.segmentLength');
  }
  //config
  @MessagePattern({ cmd: 'Post_config_segmentLength' })
  setRecordingDuration(@Payload() segmentLength: string) {
    this.configService.set('recording.segmentLength', segmentLength);
  }
  //instructions bellow are authentication required
  //Storage Directory config
  @MessagePattern({ cmd: 'Get_config_Bucket' })
  getDirectory() {
    return this.configService.getOrThrow('storage.targetDir');
  }

  @MessagePattern({ cmd: 'Post_config_Bucket' })
  setDirectory(@Payload() directoryPath: string) {
    this.configService.set('storage.targetDir', directoryPath);
  }

  @MessagePattern({ cmd: 'Get_config_rabbitmq_urls' })
  getRMQURL() {
    return this.configService.getOrThrow<string[]>('rabbitmq.urls');
  }
}
