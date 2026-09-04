import { Injectable } from '@nestjs/common';
import { FFMPEGProcessBuildStrategy } from './ffmpegBuilder/FFMPEGBuilderStrategy';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';
import { Upload } from '@aws-sdk/lib-storage';
import { Codec, FFMPEGBuilderFactory } from './ffmpegBuilder/FFMPEGBuilder';

@Injectable()
export class EncodingService {
  constructor(
    private configSerivce: ConfigService,
    private ffmpegBuilderFactory: FFMPEGBuilderFactory,
    private s3Client: S3Client,
  ) {}
  async encode(Bucket: string, Key: string, codec: Codec) {
    const tempFile = `${process.cwd()}/${Key}`;

    const obj = await this.s3Client.send(
      new GetObjectCommand({ Bucket: Bucket, Key: Key }),
    );
    fs.writeFileSync(tempFile, await obj.Body!.transformToByteArray());

    const ffmpeg = this.ffmpegBuilderFactory
      .create()
      .applyStrategy(FFMPEGProcessBuildStrategy, {
        inputs: [tempFile],
        outputs: ['pipe:1'],
        codec,
      })
      .build();
    //ffmpeg를 받는 스트림이 따로 필요한듯
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: Bucket,
        Key: Key,
        Body: ffmpeg.stdout,
      },
    });

    await upload.done().then(() => {
      fs.rmSync(tempFile);
      //remove source
      console.log(`${tempFile} deleted successfully`);
    });
  }
}
