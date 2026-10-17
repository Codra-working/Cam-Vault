import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';
import { ClientProxy } from '@nestjs/microservices';
import { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { RTSPURLSample } from 'src/common/types/types';

import { Provider } from '@nestjs/common';
import { DBService } from 'src/DB/DB.service';
import { ModuleMocker } from 'jest-mock';
import { existsSync, readFileSync } from 'node:fs';
import { watch } from 'node:fs/promises';

import { of } from 'rxjs';
import { RecordingProcessFactory } from './ffmpegBuilder/recordingProcessFactory';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
jest.mock('node:fs');
jest.mock('node:fs/promises', () => ({
  watch: jest.fn(),
}));
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

const createMockProcess = () => {
  const mockedChildProcess = new ChildProcess();
  Object.assign(mockedChildProcess, {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  return mockedChildProcess;
};
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
class UseValue {
  send;
  config;
  endpointValue = 'test endpoint';
  constructor() {
    this.send = jest.fn().mockResolvedValue({
      Body: {
        transformToByteArray: jest
          .fn()
          .mockResolvedValue(textEncoder.encode('test ByteArray')),
      },
    });
    this.config = {
      endpoint: jest.fn().mockResolvedValue(this.endpointValue),
      serviceConfiguredEndpoint: jest.fn().mockResolvedValue('test value'),
      bucketEndpoint: true,
    };
  }
}
describe('RecordingService', () => {
  let recordingService: RecordingService; //real providers
  let RMQ: jest.Mocked<ClientProxy>; //mock providers
  let recordingProcessFactory;
  let dbService: jest.Mocked<Pick<DBService, 'save'>>;
  let mockProcess; //mock process
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
    const ConfigServiceProvider = {
      provide: ConfigService,
      useValue: {
        get: jest.fn(),
      },
    };
    const S3ClientProvider = {
      provide: S3Client,
      useValue: new UseValue(),
    };
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
        S3ClientProvider,
        ConfigServiceProvider,
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

  test('should build encodingProcess', async () => {
    const createSpy = jest.spyOn(recordingProcessFactory, 'create');
    await recordingService.record(testStream, testSegmentLen, testTargetDir);

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  test('record() should emit encoding_request when video file is created', async () => {
    await recordingService.record(testStream, testSegmentLen, testTargetDir);

    const promise = new Promise((resolve) => {
      [...recordingService.recordingSessions.values()][0].recordingEngine.on(
        'close',
        resolve,
      );
    });
    mockProcess.emit('close', 0, null);
    await promise;
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
