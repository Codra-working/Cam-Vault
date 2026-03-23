import { Test, TestingModule } from '@nestjs/testing';
import { VideoMetadataServiceService } from './video-metadata-service.service';

describe('VideoMetadataServiceService', () => {
  let service: VideoMetadataServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoMetadataServiceService],
    }).compile();

    service = module.get<VideoMetadataServiceService>(VideoMetadataServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
