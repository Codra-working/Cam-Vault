import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('config')
export default class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // RTSP URLS config
  @MessagePattern(
    [{ cmd: 'Get_config_rtsp_urls' },
      { cmd: 'Get_config_rtsp_urls_:id' }],
  )
  getUrl(@Payload('id') id:number) {
    if (id !== undefined) {
      return this.configService.getOrThrow<string[]>('recording.streams')[
        id];
    }
    return this.configService.getOrThrow<string[]>('recording.streams');
  }

  @MessagePattern({ cmd: 'Post_config_rtsp_urls' })
  setUrls(@Payload() RTSPURL: string) {
    const inStream = String(RTSPURL);
    const streams: string[] = this.configService.getOrThrow('recording.streams');
    streams.push(inStream);
    this.configService.set('streams', streams);
    return inStream;
  }

  @MessagePattern({ cmd: 'Delete_config_rtsp_urls_:id' })
  delURL(@Payload('id') RTSPURL: string) {
    if (!isNaN(Number(RTSPURL))) {
      const index = Number(RTSPURL);
      const streams: string[] = this.configService.getOrThrow('recording.streams');
      const target: string = streams.splice(index, 1)[0];
      this.configService.set('streams', streams);
      return target;
    }
    const target = String(RTSPURL);
    const streams: string[] = this.configService.getOrThrow('recording.streams');
    const index = streams.indexOf(target);
    if (index !== -1) {
      streams.splice(index, 1);
      this.configService.set('recording.streams', streams);
      return target;
    }
  }

  // config
  @MessagePattern({ cmd: 'Get_config_segmentLength' })
  getRecordingDuration() {
    return this.configService.getOrThrow<number>('recording.segmentLength');
  }

  // config
  @MessagePattern({ cmd: 'Post_config_segmentLength' })
  setRecordingDuration(@Payload('segmentLength') segmentLength: string):boolean {
    try {
      this.configService.set('recording.segmentLength', segmentLength);
    } catch (error) {
      return false;
    }
    return true;
  }

  // instructions bellow are authentication required
  // Storage Directory config
  @MessagePattern({ cmd: 'Get_config_Bucket' })
  getDirectory() {
    return this.configService.getOrThrow('storage.targetDir');
  }

  @MessagePattern({ cmd: 'Post_config_Bucket' })
  setDirectory(@Payload('Bucket') Bucket: string):boolean {
    this.configService.set('storage.targetDir', Bucket);
    if (this.configService.getOrThrow<string>('storage.targetDir') === 'Bucket') {
      return false;
    } return true;
  }

  @MessagePattern({ cmd: 'Get_config_rabbitmq_urls' })
  getRMQURL() {
    return this.configService.getOrThrow<string[]>('rabbitmq.urls');
  }
}
