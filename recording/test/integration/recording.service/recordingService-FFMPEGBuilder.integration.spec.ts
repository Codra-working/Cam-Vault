import { Provider } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { ChildProcess } from 'child_process';
import { DBService } from 'src/DB/DB.service';
import {
  EncodingContext,
  FFMPEGProcessBuilder,
} from 'src/recording/ffmpegBuilder/FFMPEGBuilder';
import { FFMPEGBuilderModule } from 'src/recording/ffmpegBuilder/FFMPEGbuilder.module';
import { EncodingProcessBuilderStrategy } from 'src/recording/ffmpegBuilder/FFMPEGBuilderStrategy';
import {
  FFMPEGRecordingProcessFactory,
  RecordingProcessFactory,
} from 'src/recording/ffmpegBuilder/recordingProcessFactory';
import { RecordingService } from 'src/recording/recording.service';
import { StorageModule } from 'src/storage/storage.module';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
jest.mock('@aws-sdk/client-s3');

jest.mock('@aws-sdk/lib-storage', () => {
  const origin = jest.requireActual<typeof import('@aws-sdk/lib-storage')>(
    '@aws-sdk/lib-storage',
  );
  return {
    __esModule: true,
    ...origin,
    Upload: jest.fn().mockReturnValue({
      done: jest.fn().mockResolvedValue(undefined),
    }),
  };
});
jest.mock('rxjs');
const testFFMPEGProcessBuildStrategy: EncodingProcessBuilderStrategy<FFMPEGProcessBuilder> =
  function (
    builder: FFMPEGProcessBuilder,
    context: EncodingContext,
  ): FFMPEGProcessBuilder {
    if (context.inputs.length !== context.outputs.length)
      throw Error(
        'The length of the input stream cannout be mapped on to the output stream',
      );
    const length = context.inputs.length;
    for (let i = 0; i < length; i++) {
      builder
        .inputOption('-f', 'lavfi')
        .inputOption('-t', '10')
        .inStream(context.inputs[i])
        .codec(context.codec)
        .outputOption('-reset_timestamps', '1')
        .outputOption('-f', 'mpegts')
        .outStream(context.outputs[i])
        .commit();
    }
    return builder;
  };

describe('recordingServie-FFMPEGBuilder integration test, record()', () => {
  let moduleRef: TestingModule;
  let dbService: jest.Mocked<DBService>;
  let recordingService: RecordingService;
  let recordingProcessFactory: RecordingProcessFactory;
  let rmqService: jest.Mocked<ClientProxy>;
  beforeEach(async () => {
    const RMQProvider: Provider = {
      provide: 'RMQ_SERVICE',
      useValue: {
        emit: jest.fn(),
      },
    };
    const DBProvider: Provider = {
      provide: DBService,
      useValue: {
        save: jest.fn(),
      },
    };
    const ffmpegRecordingProcessFactory = {
      provide: RecordingProcessFactory,
      useValue: new FFMPEGRecordingProcessFactory(
        testFFMPEGProcessBuildStrategy,
      ),
    };
    const moduleRef_ = await Test.createTestingModule({
      imports: [
        StorageModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      providers: [
        RecordingService,
        DBProvider,
        RMQProvider,
        ffmpegRecordingProcessFactory,
      ],
    }).compile();
    moduleRef = moduleRef_;
    dbService = moduleRef_.get(DBService);
    recordingService = moduleRef_.get(RecordingService);
    recordingProcessFactory = moduleRef_.get(RecordingProcessFactory);
    rmqService = moduleRef_.get('RMQ_SERVICE');
  });
  afterEach(async () => {
    await moduleRef.close();
    jest.clearAllMocks();
  });
  test('should receive the real child process built by FFMPEGBuilder', async () => {
    const testInputStream = 'testsrc=size=128x128:rate=1';
    const testVideolen = 10;
    const testTargetDir = 'pipe:1'; //fixture

    await recordingService.record(testInputStream, testVideolen, testTargetDir);
    const session = [...recordingService.recordingSessions.values()][0];
    const process = session.recordingEngine;
    await new Promise((res, rej) => {
      process.on('close', res);
    });

    expect(process).toBeInstanceOf(ChildProcess);
  });

  test('should register the child process built by FFMPEGBuilder', async () => {
    const testInputStream = 'testsrc=size=128x128:rate=1';

    const testVideolen = 10;
    const testTargetDir = 'pipe:1';

    await recordingService.record(testInputStream, testVideolen, testTargetDir);
    const session = [...recordingService.recordingSessions.values()][0];
    const process = session.recordingEngine;
    await new Promise((res, rej) => {
      process.on('close', res);
    });
    expect(process).toBeInstanceOf(ChildProcess);

    //이제 프로세스 종료 분기만 구별하면됨
  });
});
