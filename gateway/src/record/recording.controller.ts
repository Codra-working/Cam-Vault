import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import RouteGenerator, { type autoGenerateRoutHandlerOptions, type VideoMeta } from '../utils/routeGenerator.js';

@Controller('recording')
export default class RecordingController extends RouteGenerator {
  constructor(
    @Inject('RECORDING_SERVICE') client: ClientProxy,
    private configService: ConfigService,
  ) {
    super(client);
    // 선언할때 추가해야됨
    // route handler auto generation templets
    const templits: autoGenerateRoutHandlerOptions[] = [
      // get post delete config/rtspurls
      { HttpMethod: Get, path: 'config/rtsp/urls', toPayload: () => ({}) },
      { HttpMethod: Get, path: 'healthz', toPayload: () => ({}) },
      {
        HttpMethod: Get,
        path: 'config/rtsp/urls',
        routeParameter: 'id',
        toPayload: ({ routeParameter }) => ({
          id: routeParameter,
        }),
      },

      {
        HttpMethod: Post,
        path: 'config/rtsp/urls',
        bodyKeys: ['url'],
        toPayload: ({ body }) => ({ url: body.url }),
      },
      {
        HttpMethod: Delete,
        path: 'config/rtsp/urls',
        routeParameter: 'id',
        toPayload: ({ routeParameter }) => ({ id: routeParameter }),
      },

      // get post config/segment Length
      { HttpMethod: Get, path: 'config/segmentLength', toPayload: () => ({}) },
      {
        HttpMethod: Post,
        path: 'config/segmentLength',
        toPayload: ({ body }) => ({ segmentLength: body.segmentLength }),
      },

      // rest apis for admin
      // get post config/directory||Bucket
      { HttpMethod: Get, path: 'config/Bucket', toPayload: () => ({}) },
      {
        HttpMethod: Post,
        path: 'config/Bucket',
        toPayload: ({ body }) => ({ Bucket: body.Bucket }),
      },

      // get config/rabbitmqurl
      { HttpMethod: Get, path: 'config/rabbitmq/urls', toPayload: () => ({}) },

    ];

    // generates route handler automatically
    templits.forEach((templit) => this.addRoutHandler(templit));
  }

  @Get('video-catalog/:streamID')
  @Header('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8')
  @Header('Cache-Control', 'no-cache')
  async getVideoCatalog(
    @Param('streamID') streamID: string,
    @Query() query,
    @Req() request: Request,
  ): Promise<string> {
    const start = query.start !== '0'
      ? new Date(query.start).getTime().toString()
      : new Date(Date.now() - 60 * 1000).getTime().toString();

    const end = query.end !== '0'
      ? new Date(query.end).getTime().toString()
      : new Date(Date.now() + 60 * 1000).getTime().toString();

    const [playlist, segmentLength] = await Promise.all([
      lastValueFrom(
        this.client.send<VideoMeta[]>(
          { cmd: 'Get_video-catalog_:streamID' },
          {
            streamID,
            start: start.toString(),
            end: end.toString(),
          },
        ),
      ),
      lastValueFrom(
        this.client.send<number>({ cmd: 'Get_config_segmentLength' }, {}),
      ),
    ]);

    const requestHost = request.get('host');

    if (!requestHost) {
      throw new BadRequestException('Host header is missing');
    }

    // 요청 주소의 IP/호스트명을 그대로 사용
    const storageBaseUrl = new URL(`http://${requestHost}`);

    const storagePublicPort = this.configService.getOrThrow<number>('storage.port');

    storageBaseUrl.port = storagePublicPort.toString();
    storageBaseUrl.pathname = '/';

    const lines: string[] = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      `#EXT-X-TARGETDURATION:${Math.ceil(segmentLength + 2)}`,
      `#EXT-X-MEDIA-SEQUENCE:${playlist[0]?.segmentNumber ?? 0}`,
      '#EXT-X-PLAYLIST-TYPE:EVENT',
    ];

    for (const metadata of playlist) {
      const bucket = metadata.Bucket;
      const key = metadata.Key;
      const segmentUrl = new URL(`${bucket}/${key}`, storageBaseUrl);

      lines.push(`#EXTINF:${segmentLength},`);
      lines.push(segmentUrl.toString());
    }
    return lines.join('\n');
  }

  // get config
  @Get('config')
  async getConfig() {
    const streams: string[] = await lastValueFrom(
      this.client.send({ cmd: 'Get_config_rtsp_urls' }, {}),
    );
    const targetDir: string = await lastValueFrom(
      this.client.send({ cmd: 'Get_config_Bucket' }, {}),
    );
    const segmentLength: string = await lastValueFrom(
      this.client.send({ cmd: 'Get_config_segmentLength' }, {}),
    );

    return { streams, targetDir, segmentLength };
  }

  @Get('videos/:id')
  getHTML(@Param('id') id: number, @Query('start') start_:string, @Query('end') end_:string) {
    let start = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    let end = new Date(Date.now() + 60 * 1000).toISOString();

    if (start_ && end_) {
      start = start_;
      end = end_;
    }

    return this.createVideoStreamingPage(id, start, end);
  }

  createVideoStreamingPage(id:number, start:string, end:string) {
    const htmlPage = `
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
    <video id="video" controls></video>

    <script>
      const video = document.getElementById('video');
      const url ='/recording/video-catalog/${id}' + '?start=${start}&end=${end}';
      if (Hls.isSupported()) {
        const hls=new Hls({
                            initialLiveManifestSize: 1,
                            maxBufferLength: 90,
                            maxMaxBufferLength: 180,
                            startOnSegmentBoundary: true,});
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      }
    </script>`;
    return htmlPage;
  }
}
