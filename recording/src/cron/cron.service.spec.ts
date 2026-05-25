import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { RecordingService } from '../recording/recording.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ModuleMocker, MockMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CronService', () => {
  let configService: ConfigService;
  let cronService: CronService;
  let schedulerRegistry: SchedulerRegistry;
  let recordingService: RecordingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CronService],
    }).useMocker((token) => {
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockMetadata<any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    cronService = module.get(CronService);
  });

  it('should be defined', () => {
    expect(cronService).toBeDefined();
  });
});
