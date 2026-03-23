import { Test, TestingModule } from '@nestjs/testing';
import { EncodingService } from './encoding.service';

describe('EncodingService', () => {
  let service: EncodingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncodingService],
    }).compile();

    service = module.get<EncodingService>(EncodingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
