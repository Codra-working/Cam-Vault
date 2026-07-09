import { Injectable } from '@nestjs/common';
import { FFMPEGBuilder } from './ffmpegBuilder/FFMPEGBuilder.service';
import path from 'path';
import type { Codec } from './ffmpegBuilder/FFMPEGBuilderStrategy';
import { linearRecordingBuildStrategy } from './ffmpegBuilder/FFMPEGBuilderStrategy';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncodingService {
  constructor(
    private configSerivce: ConfigService,
    private encodingProcessBuilder: FFMPEGBuilder,
  ) {}
  encode(
    inStream: path.FormatInputPathObject,
    codec: Codec,
    fileFormat: string,
  ): Promise<string | Error> {
    const outputFile = {
      dir: this.configSerivce.get<string>('targetDirectory'), //설정 바꿔야됨
      base: inStream.name + '.' + fileFormat,
    };

    const ffmpeg = this.encodingProcessBuilder
      .applyStrategy(linearRecordingBuildStrategy, {
        inputs: [inStream],
        outputs: [outputFile],
        videoLen: -1,
        codec: codec,
      })
      .build();

    const collect = (data: any) => console.log((data as string).toString());
    ffmpeg.stdout.on('data', collect);
    ffmpeg.stderr.on('data', collect);

    return new Promise<string | Error>((resolve, reject) => {
      ffmpeg.on('close', (code, signal) => {
        if (signal !== null || code === null || code !== 0)
          reject(
            new Error(`ffmpeg closed with signal:${signal}, code:${code}`),
          );
        else resolve(`encoding success, ffmpeg closed with code:${code}`);
      });
      ffmpeg.on('error', reject);
    });
  }
}
