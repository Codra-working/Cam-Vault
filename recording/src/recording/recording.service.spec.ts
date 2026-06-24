import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';
import { ClientProxy } from '@nestjs/microservices';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { RTSPURLSample } from 'src/common/types/types';
import { FFMPEGProcessBuilder } from 'src/recording/ffmpegBuilder/FFMPEGBuilder';
import { Provider } from '@nestjs/common';
import { DBService } from 'src/DB/DB.service';
import { ModuleMocker } from 'jest-mock';
import { existsSync, readFileSync } from 'node:fs';
import { watch } from 'node:fs/promises';
import path from 'node:path';
import { VideoMetadata } from 'src/DB/videoMetadata.entity';
import { of } from 'rxjs';
import { RecordingProcessFactory } from './ffmpegBuilder/recordingProcessFactory';
jest.mock('node:fs');
jest.mock('node:fs/promises', () => ({
  watch: jest.fn(),
}));
const moduleMocker = new ModuleMocker(global);
interface MockProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

function createRecordParams(
  overrides?: Partial<{
    inputStreams: string;
    videoLen: number;
    targetDir: string;
  }>,
): {
  inputStream: string;
  videoLen: number;
  targetDir: string;
} {
  return {
    inputStream: RTSPURLSample,
    videoLen: 10,
    targetDir: 'testDir/testBase',
    ...overrides,
  };
}

function createEncodingJob() {
  return { filePath: 'testDir/testBase', codec: 'libx264' };
}

const createMockProcess = () =>
  Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
type Constructor = new (...args: any[]) => any;
function isConstructor(value: unknown): value is Constructor {
  if (typeof value !== 'function') {
    return false;
  }
  try {
    Reflect.construct(String, [], value);
    return true;
  } catch (e) {
    return false;
  }
}
describe('RecordingService', () => {
  let recordingService: RecordingService; //real providers
  let RMQ: jest.Mocked<ClientProxy>; //mock providers
  let recordingProcessFactory;
  let dbService: jest.Mocked<Pick<DBService, 'save'>>;
  let mockProcess: MockProcess; //mock process
  let testStream: string;
  let testSegmentLen: number;
  let testTargetDir: string;

  function mockWatchEvents(
    events: { eventType: 'change'; filename: string }[],
  ) {
    jest.mocked(watch).mockReturnValue(
      (async function* (): AsyncGenerator<
        { eventType: 'change'; filename: string },
        undefined
      > {
        for (const event of events) {
          yield event;
        }
      })(),
    );
  }

  beforeEach(async () => {
    ({
      inputStream: testStream,
      videoLen: testSegmentLen,
      targetDir: testTargetDir,
    } = createRecordParams({}));
    jest.mocked(existsSync).mockReturnValue(true);
    mockWatchEvents([]);
    jest
      .mocked(readFileSync)
      .mockReturnValue(Buffer.from('34234\n42323424\n23423424\n'));

    //mock dependency is not a part of nestJS provider. Since dependency is not a responsibility, they will be tested in seperate test suites
    mockProcess = createMockProcess();

    //create mock providers and then create nestJS testing module
    const mockRMQ: Provider = {
      provide: 'RMQ_SERVICE',
      useValue: {
        emit: jest.fn().mockReturnValue(of(undefined)),
      },
    };

    const mockRecordingProcessFactory: Provider = {
      provide: RecordingProcessFactory,
      useValue: {
        create: jest.fn().mockReturnValue(mockProcess),
      },
    };

    const mockDBService: Provider = {
      provide: DBService,
      useValue: {
        save: jest.fn().mockResolvedValue({
          id: 'video-metadata-id',
          filePath: 'testDir/testBase',
          isEncoded: false,
        }),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RecordingService,
        mockRMQ,
        mockRecordingProcessFactory,
        mockDBService,
      ],
    }).compile();

    //get reference of a service from module
    recordingService = moduleRef.get(RecordingService);
    RMQ = moduleRef.get('RMQ_SERVICE');
    recordingProcessFactory = moduleRef.get(RecordingProcessFactory);
    dbService = moduleRef.get(DBService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should initialize service and dependencies', () => {
    expect(recordingService).toBeDefined();
    expect(RMQ).toBeDefined();
  });

  test('should build encodingProcess', () => {
    const createSpy = jest.spyOn(recordingProcessFactory, 'create');
    recordingService.record(testStream, testSegmentLen, testTargetDir);

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  test('record() should emit encoding_request when video segment file is created', async () => {
    const emitDone = new Promise<void>((resolve) => {
      RMQ.emit.mockImplementation((() => {
        resolve();
        return of(undefined);
      }) as ClientProxy['emit']);
    });
    mockWatchEvents([
      {
        eventType: 'change',
        filename: path.join(testTargetDir, `${testStream}.csv`),
      },
    ]);

    recordingService.record(testStream, testSegmentLen, testTargetDir);
    await emitDone;

    mockProcess.emit('close', 0, null);
    expect(dbService.save).toHaveBeenCalledTimes(1);
    expect(RMQ.emit).toHaveBeenCalledTimes(1);
    //ffmpeg response: recording success
  });

  test('record() should mark the session as failed when ffmpeg exits with a non-zero code', () => {
    recordingService.record(testStream, testSegmentLen, testTargetDir);

    const ffmpegCode = 1;
    mockProcess.emit('close', ffmpegCode, null);
    expect(RMQ.emit).not.toHaveBeenCalled();
    expect(dbService.save).not.toHaveBeenCalled();
  });

  test('record() should not emit encoding jobs when ffmpeg process emit errors', () => {
    recordingService.record(testStream, testSegmentLen, testTargetDir);

    expect(RMQ.emit).not.toHaveBeenCalled();
  });
});
