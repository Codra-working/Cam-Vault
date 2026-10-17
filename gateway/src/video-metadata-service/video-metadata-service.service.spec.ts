import { Test, TestingModule } from '@nestjs/testing';
import { VideoMetadataServiceService } from './video-metadata-service.service';
import { HttpService } from '@nestjs/axios';
import { ValueProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('VideoMetadataServiceService', () => {
  let service: VideoMetadataServiceService;

  beforeEach(async () => {
    const httpServiceProvider: ValueProvider = {
      provide: HttpService,
      useValue: {
        post: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoMetadataServiceService,
        ConfigService,
        httpServiceProvider,
      ],
    }).compile();

    service = module.get<VideoMetadataServiceService>(
      VideoMetadataServiceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
