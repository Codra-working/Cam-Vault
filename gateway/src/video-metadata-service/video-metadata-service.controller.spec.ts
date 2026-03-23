import { Test, TestingModule } from '@nestjs/testing';
import { VideoMetadataServiceController } from './video-metadata-service.controller';

describe('VideoMetadataServiceController', () => {
  let controller: VideoMetadataServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoMetadataServiceController],
    }).compile();

    controller = module.get<VideoMetadataServiceController>(VideoMetadataServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
