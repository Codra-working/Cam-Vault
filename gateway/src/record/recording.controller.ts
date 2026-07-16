import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import type { Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Controller('recording')
export class RecordingController {
  constructor(
    @Inject('RECORDING_SERVICE') private client: ClientProxy,
    private configService: ConfigService,
  ) {
    //route handler auto generation templets
    const templits: autoGenerateRoutHandlerOptions[] = [
      //get post delete config/rtspurls
      { HttpMethod: Get, path: 'config/rtsp/urls', toPayload: () => ({}) },
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

      //get post config/segment Length
      { HttpMethod: Get, path: 'config/segmentLength', toPayload: () => ({}) },
      {
        HttpMethod: Post,
        path: 'config/segmentLength',
        toPayload: ({ body }) => ({ segmentLength: body.segmentLength }),
      },

      //rest apis for admin
      //get post config/directory||Bucket
      { HttpMethod: Get, path: 'config/Bucket', toPayload: () => ({}) },
      {
        HttpMethod: Post,
        path: 'config/Bucket',
        toPayload: ({ body }) => ({ Bucket: body.Bucket }),
      },

      //get config/rabbitmqurl
      { HttpMethod: Get, path: 'config/rabbitmq/urls', toPayload: () => ({}) },

      //get videos of a stream
      {
        HttpMethod: Get,
        path: 'video-catalog',
        routeParameter: 'streamID',
        queryKeys: ['start', 'end'],
        headers: [
          {
            key: 'Content-Type',
            value: 'application/vnd.apple.mpegurl; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
        toPayload: ({ routeParameter, query }) => ({
          streamID: routeParameter,
          start:
            query.start !== '0'
              ? new Date(query.start).getTime().toString()
              : new Date(Date.now() - 60 * 1000).getTime().toString(),
          end:
            query.end !== '0'
              ? new Date(query.end).getTime().toString()
              : new Date(Date.now() + 60 * 1000).getTime().toString(),
        }),
        toResponse: async (playlist) => {
          const playlistDiscription: string[] = [];
          const segmentLength: number = await lastValueFrom(
            this.client.send<number, any>(
              { cmd: 'Get_config_segmentLength' },
              {},
            ),
          );
          playlist = await lastValueFrom(playlist);
          playlistDiscription.push('#EXTM3U');
          playlistDiscription.push('#EXT-X-VERSION:3');
          playlistDiscription.push(
            `#EXT-X-TARGETDURATION:${segmentLength + 2}`,
          );
          playlistDiscription.push(`#EXT-X-MEDIA-SEQUENCE:${playlist[0].segmentNumber}`);
          playlistDiscription.push('#EXT-X-PLAYLIST-TYPE:EVENT');
          for (const metaData of playlist) {
            const storageHost =
              this.configService.getOrThrow<string>('storage.host');
            const storagePort =
              this.configService.getOrThrow<string>('storage.port');
            
            playlistDiscription.push(`#EXTINF:${segmentLength},`);
            playlistDiscription.push(
              //서버 이름을 바꿔야됨
              `http://${storageHost}:${storagePort}/${metaData.Bucket}/${metaData.Key}`,
            );
            playlistDiscription.push('#EXT-X-DISCONTINUITY');
          }
          return playlistDiscription.join('\n');
        },
      },
    ];

    //generates route handler automatically
    templits.forEach((templit) => this.addRoutHandler(templit));
  }

  //get config
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
  getHTML(@Param('id') id: number) {
    const start = new Date(Date.now() - 3*60 * 1000).toISOString();
    const end = new Date(Date.now() + 2*60 * 1000).toISOString();
    return `<script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>

<video id="video" controls></video>

<script>
  const video = document.getElementById('video');
  const url =
    '/recording/video-catalog/${id}' +
    '?start=${start}&end=${end}';

  if (Hls.isSupported()) {
    const hls=new Hls({
      initialLiveManifestSize: 3,
      maxBufferLength: 90,
      maxMaxBufferLength: 180,
      startOnSegmentBoundary: true,
  });
    hls.loadSource(url);
    hls.attachMedia(video);
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
  }
</script>`;
  }

  addRoutHandler({
    HttpMethod,
    path,
    routeParameter,
    headers,
    bodyKeys,
    queryKeys,
    toPayload,
    toResponse = (val) => val,
  }: autoGenerateRoutHandlerOptions) {
    const init = () => {
      Object.assign(Get, { myNameIs: 'Get' });
      Object.assign(Post, { myNameIs: 'Post' });
      Object.assign(Delete, { myNameIs: 'Delete' });
    };

    const cleanUp = () => {
      if (Object.getOwnPropertyNames(Get).includes('myNameIs'))
        delete (Get as NamedRouteHandlerDecorator).myNameIs;
      if (Object.getOwnPropertyNames(Post).includes('myNameIs'))
        delete (Post as NamedRouteHandlerDecorator).myNameIs;
      if (Object.getOwnPropertyNames(Delete).includes('myNameIs'))
        delete (Delete as NamedRouteHandlerDecorator).myNameIs;
    };
    init();

    if (routeParameter) {
      path = `${path}/:${routeParameter}`;
    }
    const propertyName = `${(HttpMethod as NamedRouteHandlerDecorator).myNameIs}_${path.replaceAll('/', '_')}`;

    const handler = (...values: string[]) => {
      const param = routeParameter ? values[0] : '';
      const bodyMap = new Map<string, string>();
      const queryMap = new Map<string, string>();
      let argsCnt = routeParameter ? 1 : 0;

      bodyKeys?.forEach((key) => {
        bodyMap.set(key, values[argsCnt]);
        argsCnt++;
      });
      queryKeys?.forEach((key) => {
        queryMap.set(key, values[argsCnt]);
        argsCnt++;
      });

      const body = Object.fromEntries(bodyMap);
      const query = Object.fromEntries(queryMap);
      const payload = toPayload({
        routeParameter: param,
        body,
        query,
      });
      const response = this.client.send<
        string[] | string | VideoMeta[],
        Record<string, string>
      >({ cmd: propertyName }, payload);

      return toResponse(response);
    };

    const handlerDiscriptor = {
      value: handler,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    HttpMethod(path)(
      RecordingController.prototype,
      propertyName,
      handlerDiscriptor,
    );
    headers?.forEach((header) => {
      Header(header.key, header.value)(
        RecordingController.prototype,
        propertyName,
        handlerDiscriptor,
      );
    });

    let argsCounter: number = 0;
    if (routeParameter) {
      Param(routeParameter)(
        RecordingController.prototype,
        propertyName,
        argsCounter,
      );
      argsCounter++;
    }
    bodyKeys?.forEach((key) => {
      Body(key)(RecordingController.prototype, propertyName, argsCounter);
      argsCounter++;
    });
    queryKeys?.forEach((key) => {
      Query(key)(RecordingController.prototype, propertyName, argsCounter);
      argsCounter++;
    });

    Object.defineProperty(
      RecordingController.prototype,
      propertyName,
      handlerDiscriptor,
    );

    cleanUp();
  }
}

export const convertToNumOrStr = (
  val: unknown,
): number | string | undefined => {
  let num: number;
  let str: string;
  if (val !== undefined) {
    try {
      num = Number(val);
      str = String(val);
    } catch (error) {
      console.log(`convertToNumOrStr failed: ${error}`);
      console.log(`${val}`);
      return undefined;
    }
  } else return undefined;
  return !isNaN(num) ? num : str;
};
export type NamedRouteHandlerDecorator = RouteHandlerDecorator & {
  myNameIs?: string;
};
export type RouteHandlerDecorator = (
  path?: string | string[],
) => MethodDecorator;
export type autoGenerateRoutHandlerOptions = {
  HttpMethod: RouteHandlerDecorator;
  path: string;
  headers?: Head[];
  routeParameter?: string;
  bodyKeys?: string[];
  queryKeys?: string[];
  toPayload: (reqBody: {
    routeParameter: string;
    body: Record<string, string>;
    query: Record<string, string>;
  }) => Record<string, string>;
  toResponse?: (recBody: any) => any;
};
export type VideoMeta = { Bucket: string; Key: string };
export type Head = { key: string; value: string };
