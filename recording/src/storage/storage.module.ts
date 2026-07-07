import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

type configServiceAcceptedType = string | boolean;

const requiredEnv = (env: string | undefined): string => {
  if (env === undefined) throw new Error('runtime type check failed.');

  return env;
};
const trueOrFalse = (val: string) => (val === 'true' ? true : false);

const envs: string[] = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_FORCE_PATH_STYLE',
  'S3_USE_DUALSTACK_ENDPOINT',
  'S3_RESPONSE_CHECKSUM_VALIDATION',
  'S3_REQUEST_CHECKSUM_CALCULATION',
];

const createCredential = () => ({
  credentials: {
    accessKeyId: requiredEnv(process.env['S3_CREDENTIALS_ACESS_KEY_ID']),
    secretAccessKey: requiredEnv(
      process.env['S3_CREDENTIALS_SECRET_ACESS_KEY'],
    ),
  },
});

const createS3ClientInput = (envs: string[]) => {
  const result = {};
  const transform = (key: string) => {
    let value: configServiceAcceptedType = requiredEnv(process.env[key]);
    if (value === 'true' || value === 'false') {
      console.log(
        `warning ${value} is automatically transformed in to boolean`,
      );
      value = trueOrFalse(value);
    }
    const obj = { [key]: value };
    Object.assign(result, obj);
  };
  //accessKeyId, secretAccessKey manual assign
  Object.assign(result, createCredential());

  envs.map(transform);
  return result;
};

@Global()
@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: () => new S3Client(createS3ClientInput(envs)),
    },
    StorageService,
  ],
  exports: [S3Client, StorageService],
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
    if (
      error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 400
    ) {
      const command = new CreateBucketCommand({ Bucket: BucketName });
      await s3Client.send(command);
      console.log('StorageModule: new Bucket created');
    }
  }
}
