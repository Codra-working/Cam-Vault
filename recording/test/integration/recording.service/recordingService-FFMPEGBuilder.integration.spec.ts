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
import { EncodingProcessBuilderScheduler } from 'src/recording/ffmpegBuilder/FFMPEGBuilderStrategy';
import { RecordingProcessFactory } from 'src/recording/ffmpegBuilder/recordingProcessFactory';
import { RecordingService } from 'src/recording/recording.service';
import { FFMPEGProcessBuildStrategy } from 'src/recording/ffmpegBuilder/FFMPEGBuilderStrategy';
import { StorageModule } from 'src/storage/storage.module';
jest.mock('src/recording/ffmpegBuilder/FFMPEGBuilderStrategy');

const testFFMPEGProcessBuildStrategy: EncodingProcessBuilderScheduler<FFMPEGProcessBuilder> =
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
        .outputOption(
          context.segmentLen ? '-segment_time' : '',
          context.segmentLen ? context.segmentLen.toString(10) : '',
        )
        .outputOption('-reset_timestamps', '1')
        .outputOption(
          context.segmentInfoFile ? '-segment_list' : '',
          context.segmentInfoFile ? context.segmentInfoFile : '',
        )
        .outputOption('-segment_list_type', 'csv')
        .outputOption('-segment_list_flags', '+live')
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
    const mockedFFMPEGProcessBuildStrategy = jest.mocked(
      FFMPEGProcessBuildStrategy,
    );
    mockedFFMPEGProcessBuildStrategy.mockImplementation(
      testFFMPEGProcessBuildStrategy,
    );
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
    const moduleRef_ = await Test.createTestingModule({
      imports: [FFMPEGBuilderModule, StorageModule],
      providers: [RecordingService, DBProvider, RMQProvider],
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
    const testTargetDir = './test'; //fixture
    const createSpy = jest.spyOn(recordingProcessFactory, 'create');

    await recordingService.record(testInputStream, testVideolen, testTargetDir);
    const encodingProcess = createSpy.mock.results[0].value;
    expect(encodingProcess).toBeInstanceOf(ChildProcess);
  });

  test('should register the child process built by FFMPEGBuilder', async () => {
    const testInputStream = 'testsrc=size=128x128:rate=1';

    const testVideolen = 10;
    const testTargetDir = './test';
    const createSpy = jest.spyOn(recordingProcessFactory, 'create');

    await recordingService.record(testInputStream, testVideolen, testTargetDir);
    const encodingProcess = createSpy.mock.results[0].value;
    expect(encodingProcess).toBeInstanceOf(ChildProcess);

    //이제 프로세스 종료 분기만 구별하면됨
  });
});
