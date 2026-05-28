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
    providers: [CronService],
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

function getMockedProviders(module: TestingModule): [MockedObject<ConfigService>, MockedObject<RecordingService>, CronService, MockedObject<SchedulerRegistry>] {
  const configService: MockedObject<ConfigService> = module.get(ConfigService)
  const recordingService: MockedObject<RecordingService> = module.get(RecordingService)
  const cronService: CronService = module.get(CronService);
  const schedulerRegistry: MockedObject<SchedulerRegistry> = module.get(SchedulerRegistry)
  return [configService, recordingService, cronService, schedulerRegistry]
}

describe('add recording job', () => {
  let configService: MockedObject<ConfigService>
  let recordingService: MockedObject<RecordingService>
  let cronService: CronService
  let schedulerRegistry: MockedObject<SchedulerRegistry>

  beforeEach(async () => {
    const module: TestingModule = await buildTestModule();
    [configService, recordingService, cronService, schedulerRegistry] = getMockedProviders(module);
    configService.get.mockImplementation((val) => val === 'duration' ? CronExpression.EVERY_SECOND : 'test')
    jest.spyOn(CronJob.prototype, 'start').mockImplementation(() => { });
  });

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('reads config values from configService',()=>{
    cronService.addRecordingJob()
    expect(configService.get.mock.calls.map(([val])=>val)).toStrictEqual(['streams','videoLen','parsedTargetPath','duration'])
    expect(configService.get.mock.results.map(object=>object.value)).toStrictEqual(['test','test','test',CronExpression.EVERY_SECOND])
  })

  test('adds a recordingJob to schedulerRegistry',()=>{
    cronService.addRecordingJob()
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('recording_service',expect.any(CronJob))
    expect(CronJob.prototype.start).toHaveBeenCalled()
  })
});
