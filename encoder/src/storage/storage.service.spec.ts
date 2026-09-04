import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class UseValue {
  send;
  config;
  endpointValue = 'test endpoint';
  constructor() {
    this.send = jest.fn().mockResolvedValue({
      Body: {
        transformToByteArray: jest
          .fn()
          .mockResolvedValue(textEncoder.encode('test ByteArray')),
      },
    });
    this.config = {
      endpoint: jest.fn().mockResolvedValue(this.endpointValue),
      serviceConfiguredEndpoint: jest.fn().mockResolvedValue('test value'),
      bucketEndpoint: true,
    };
  }
}

let storageService: StorageService;
let s3Client: UseValue;
let testingModule: TestingModule;
const init = async () => {
  const S3ClientProvider = {
    provide: S3Client,
    useValue: new UseValue(),
  };
  testingModule = await Test.createTestingModule({
    providers: [StorageService, S3ClientProvider],
  }).compile();
  s3Client = testingModule.get<S3Client, typeof S3ClientProvider.useValue>(
    S3Client,
  );
  storageService = testingModule.get<StorageService>(StorageService);
};

const close = async () => {
  await testingModule.close();
  jest.resetAllMocks();
};

describe('StorageService readMutipleObjectsFromBucket', () => {
  beforeEach(init);
  afterEach(close);
  it('should be configured with S3API', async () => {
    await storageService.readMutipleObjectsFromBucket('test Bucket', [
      'test Key 0',
    ]);

    expect(GetObjectCommand).toHaveBeenCalled();
    expect(s3Client.send).toHaveBeenCalled();
  });

  //input validation
  test.each([0, 1, 3, 5])('should support multiple key input', async (N) => {
    const testKeys: string[] = [];
    for (let i = 0; i < N; i++) {
      testKeys.push(`test Key ${i.toString()}`);
    }
    await storageService.readMutipleObjectsFromBucket('test Bucket', testKeys);
    expect(s3Client.send).toHaveBeenCalledTimes(N);
  });

  //output validation
  test('shuld return byteArray Buffer', async () => {
    const returnValue = await storageService.readMutipleObjectsFromBucket(
      'test Bucket',
      ['test Key 0'],
    );
    expect(returnValue).toBeInstanceOf(Buffer);
    expect(textDecoder.decode(returnValue)).toEqual('test ByteArray');
  });
  //faluty case
  test('should log an error if the endpoint is not accesable', async () => {
    s3Client.config.endpoint.mockRejectedValue('test error');
    await storageService.readMutipleObjectsFromBucket('test Bucket', [
      'test Key 0',
    ]);
  });
  test('should log an error if the endpoint is not accesable', async () => {
    s3Client.config.serviceConfiguredEndpoint.mockRejectedValue('test error');
    await storageService.readMutipleObjectsFromBucket('test Bucket', [
      'test Key 0',
    ]);
  });

  //위에 두개는 의미가 없음 객체 생성할때 검사해야됨
  test('should return unknown error if S3client.send fails', async () => {
    s3Client.send.mockRejectedValue('test error');
    await expect(
      storageService.readMutipleObjectsFromBucket('test Bucket', [
        'test Key 0',
      ]),
    ).rejects.toThrow('unknown error');
  });

  test('should return unknown error if S3client decoding fails', async () => {
    s3Client.send.mockResolvedValue({
      Body: { transformToByteArray: jest.fn().mockRejectedValue('test error') },
    });
    await expect(
      storageService.readMutipleObjectsFromBucket('test Bucket', [
        'test Key 0',
      ]),
    ).rejects.toThrow('unknown error');
  });
});

describe('StorageService printBucketPolicy', () => {
  beforeEach(init);
  afterEach(close);

  it('should print S3 BucketEndPoint', () => {
    const logSpy = jest.spyOn(console, 'log');
    storageService.printBucketPolicy('test Bucket');
    expect(logSpy).toHaveBeenCalledWith(true);
  });
});

describe('StorageService onModuleInit', () => {
  beforeEach(init);
  afterEach(close);

  it('should throw when S3Client init fails', async () => {
    const testError = new Error('test Error');
    s3Client.send.mockRejectedValueOnce(testError);

    await expect(storageService.onModuleInit()).rejects.toThrow(testError);
    //expect(testingModule.)
  });
});
