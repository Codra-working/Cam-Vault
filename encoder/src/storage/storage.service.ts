import {
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class StorageService implements OnModuleInit {
  constructor(private s3Client: S3Client) {}

  async onModuleInit() {
    const s3Client = this.s3Client;
    const checks: Promise<unknown>[] = [];
    if (s3Client.config.endpoint) checks.push(s3Client.config.endpoint());

    if (s3Client.config.serviceConfiguredEndpoint)
      checks.push(s3Client.config.serviceConfiguredEndpoint());
    checks.push(this.isBucketAvailable());
    return Promise.all(checks);
  }

  async isBucketAvailable() {
    await this.s3Client.send(new ListBucketsCommand({}), {
      abortSignal: AbortSignal.timeout(5000),
    });
  }
  //S3 API
  async readMutipleObjectsFromBucket(
    Bucket: string,
    Keys: string[],
  ): Promise<Buffer> {
    const N = Keys.length;
    const responses = new Array<Promise<void>>(N);
    const result = new Array<Buffer>(N);

    for (let i = 0; i < N; i++) {
      const Key = Keys[i];
      responses[i] = this.s3Client
        .send(new GetObjectCommand({ Bucket, Key }))
        .then(async (response) => {
          if (response.Body === undefined) {
            console.log('readMutipleObjectsFromBucket');
            console.log(`Error: Object ${Key} is lost`);
          } else {
            const bytes = await response.Body.transformToByteArray();
            result[i] = Buffer.from(bytes);
          }
        })
        .catch(() => {
          throw new Error('unknown error');
        });
    }
    await Promise.all(responses);
    return Buffer.concat(result);
  }

  printBucketPolicy(Bucket: string) {
    console.log(this.s3Client.config.bucketEndpoint);
  }
}
