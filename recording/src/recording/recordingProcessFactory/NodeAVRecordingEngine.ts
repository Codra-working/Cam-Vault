import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RTSPClient } from 'yellowstone';
import RecordingProcessFactory from './RecordingProcessFactory';
import { EncodingContext } from '../ffmpegBuilder/FFMPEGBuilder';
import RTSPClientManager from '../rtspClient/RTSP';

@Injectable()
export default class NodeAVRecordingEngine extends RecordingProcessFactory {
  constructor(private configService: ConfigService) {
    super();
  }

  async create(context: EncodingContext): Promise<RTSPClient> {
    const rtsp = new RTSPClientManager();
    await rtsp.connect(
      context.inputs[0],
      this.configService.getOrThrow('recording.username'),
      this.configService.getOrThrow('recording.password'),
    );
    await rtsp.play();
    return rtsp.client;
  }
}
