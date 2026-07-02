import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ValueProvider } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';

const s3Client: ValueProvider = {
  provide: S3Client,
  useValue: {
    send: jest.fn(),
    config: {
      endpoint: jest.fn().mockResolvedValue('somthing is resolved'),
    },
  },
};
describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, s3Client],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
