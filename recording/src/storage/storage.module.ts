import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: () => {
        return new S3Client({
          // specify endpoint with http://hostname:port
          endpoint: process.env.S3_ENDPOINT ?? `http://localhost:8333`,
          // specify region since it is mandatory, but it will be ignored by seaweedfs
          region: `us-east-1`,
          // force path style for compatibility reasons
          forcePathStyle: true,
          // dual stack endpoint is not supported by seaweed
          useDualstackEndpoint: false,
          // checksum validation should be disabled, overwise `x-amz-checksum` will be injected directly into files
          responseChecksumValidation: `WHEN_REQUIRED`,
          requestChecksumCalculation: 'WHEN_REQUIRED',
          // credentials is mandatory and s3 authorization should be enabled with `s3.configure`
          credentials: {
            accessKeyId: `admin`,
            secretAccessKey: `secret`,
          },
        });
      },
    },
  ],
  exports: [S3Client],
})
export class StorageModule {}

export async function checkIfThereAreBucket(
  s3Client: S3Client,
  BucketName: string,
) {
  const command = new HeadBucketCommand({ Bucket: BucketName });
  try {
    await s3Client.send(command);
  } catch (error) {
    if ((error as S3ServiceException).$metadata.httpStatusCode === 400) {
      const command = new CreateBucketCommand({ Bucket: BucketName });
      await s3Client.send(command);
      console.log('StorageModule: new Bucket created');
    }
  }
}
