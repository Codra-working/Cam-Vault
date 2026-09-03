import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';

type configServiceAcceptedType = string | boolean;

const requiredEnv = (env: string | undefined): string => {
  if (env === undefined) throw new Error('runtime type check failed.');

  return env;
};
const trueOrFalse = (val: string) => (val === 'true' ? true : false);

const envs: string[] = [
  'endpoint',
  'region',
  'forcePathStyle',
  'useDualstackEndpoint',
  'responseChecksumValidation',
  'requestChecksumCalculation',
];

const createCredential = (configService: ConfigService) => ({
  credentials: {
    accessKeyId: requiredEnv(
      configService.getOrThrow(`storage.credentialsAccessKeyID`),
    ),
    secretAccessKey: requiredEnv(
      configService.getOrThrow(`storage.credentialSecretAccessKey`),
    ),
  },
});

const createS3ClientInput = (envs: string[], configService: ConfigService) => {
  const result = {};
  const transform = (key: string) => {
    let value: configServiceAcceptedType = requiredEnv(
      configService.getOrThrow(`storage.${key}`),
    );
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
  Object.assign(result, createCredential(configService));

  envs.map(transform);
  Object.assign(result, { maxAttemps: 100 });
  return result;
};

@Global()
@Module({
  providers: [
    {
      provide: S3Client,
      useFactory: (configService: ConfigService) => {
        return new S3Client(createS3ClientInput(envs, configService));
      },
      inject: [ConfigService],
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
