import { Test, TestingModule } from '@nestjs/testing';
import { RecordingController } from './recording.controller';
import { ConfigService } from '@nestjs/config';
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('RecordingController', () => {
  let recordingController: RecordingController;
  let configService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordingController],
    }).useMocker((token) => {
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockMetadata<any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    recordingController = module.get(RecordingController);
  });

  it('should be defined', () => {
    expect(recordingController).toBeDefined();
  });

});
