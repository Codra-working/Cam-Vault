import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  constructor(private s3Client: S3Client) {
    if (s3Client.config.endpoint)
      s3Client.config.endpoint().then(console.log).catch(console.log);

    if (s3Client.config.serviceConfiguredEndpoint)
      s3Client.config
        .serviceConfiguredEndpoint()
        .then(console.log)
        .catch(console.log);
  }
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
