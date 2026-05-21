import { Test, TestingModule } from '@nestjs/testing';
import { RecordingController } from './recording.controller';
import { ConfigService } from '@nestjs/config';

describe('RecordingController', () => {
  let recordingController: RecordingController;
  let configService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordingController],
      providers:[ConfigService]
    }).compile();

    configService=module.get(ConfigService)
    recordingController = module.get(RecordingController);
  });

  it('should be defined', () => {
    expect(recordingController).toBeDefined();
  });
});
