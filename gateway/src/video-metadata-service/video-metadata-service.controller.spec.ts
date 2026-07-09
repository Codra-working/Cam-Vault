import { Test, TestingModule } from '@nestjs/testing';
import { VideoMetadataServiceController } from './video-metadata-service.controller';
import { ValueProvider } from '@nestjs/common';
import { VideoMetadataServiceService } from './video-metadata-service.service';

describe('VideoMetadataServiceController', () => {
  let controller: VideoMetadataServiceController;

  beforeEach(async () => {
    const videoMetadataProvider: ValueProvider = {
      provide: VideoMetadataServiceService,
      useValue: {
        postVideos: jest.fn(),
        getVideos: jest.fn(),
        getVideo: jest.fn(),
        getEncodingStatus: jest.fn(),
        delVideo: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoMetadataServiceController],
      providers: [videoMetadataProvider],
    }).compile();

    controller = module.get<VideoMetadataServiceController>(
      VideoMetadataServiceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
