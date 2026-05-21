import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';

describe('RecordingService', () => {
  let recordingService: RecordingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordingService],
    }).compile();

    recordingService = module.get(RecordingService);
  });

  it('should be defined', () => {
    expect(recordingService).toBeDefined();
  });
});
