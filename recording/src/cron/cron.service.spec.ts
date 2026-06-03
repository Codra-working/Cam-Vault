import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { RecordingService } from '../recording/recording.service';
import { ConfigService } from '@nestjs/config';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ModuleMocker, MockedObject } from 'jest-mock';
import { CronJob } from 'cron';



const moduleMocker = new ModuleMocker(global);
type Constructor = new (...args: any[]) => any;

function isConstructor(value: unknown): value is Constructor {
  if (typeof value !== 'function') {
    return false
  }
  try {
    Reflect.construct(String, [], value)
    return true
  } catch (e) {
    return false
  }
}

async function buildTestModule() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [CronService, SchedulerRegistry],
  })
    .useMocker((token) => {//auto mocking
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata<Function>(token);
        if (mockMetadata === null) fail("automocking failed: no metadata")
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);

        if (isConstructor(Mock)) return new Mock();
        else fail("automocking failed: token is not constructable")
      }
    })
    .compile();
  return module
}

function getMockedProviders(module: TestingModule): [MockedObject<ConfigService>, MockedObject<RecordingService>, CronService, SchedulerRegistry] {
  const configService: MockedObject<ConfigService> = module.get(ConfigService)
  const recordingService: MockedObject<RecordingService> = module.get(RecordingService)
  const cronService: CronService = module.get(CronService);
  const schedulerRegistry: SchedulerRegistry = module.get(SchedulerRegistry)
  return [configService, recordingService, cronService, schedulerRegistry]
}

describe('CronService.addRecordingJob', () => {
  let configService: MockedObject<ConfigService>
  let recordingService: MockedObject<RecordingService>
  let cronService: CronService
  let schedulerRegistry: SchedulerRegistry

  beforeEach(async () => {
    const module: TestingModule = await buildTestModule();
    [configService, recordingService, cronService, schedulerRegistry] = getMockedProviders(module);
    configService.get.mockImplementation((key) => {
      const ret = {
        streams: "test stream",
        videoLen: 10,
        targetDirectory: 'test target',
        duration: CronExpression.EVERY_SECOND
      }
      return ret[key]
    })
    jest.spyOn(schedulerRegistry, 'addCronJob')
    jest.spyOn(CronJob.prototype, 'start').mockImplementation(() => { });
  });

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should read recording job config values from configService', () => {
    cronService.addRecordingJob()
    expect(configService.get.mock.calls.map(([val]) => val)).toStrictEqual(['streams', 'videoLen', 'targetDirectory', 'duration'])
  })

  test('should register and start the recording cron job', () => {
    cronService.addRecordingJob()
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('recording_service', expect.any(CronJob))
    expect(CronJob.prototype.start).toHaveBeenCalled()
  })

  test('registered cron job should call recordingService.record with configured values', async () => {
    cronService.addRecordingJob()
    const recordingJob = schedulerRegistry.getCronJob('recording_service') as CronJob
    await recordingJob.fireOnTick()
    expect(recordingService.record).toHaveBeenNthCalledWith(1, 'test stream', 10, 'test target')
  })
});
