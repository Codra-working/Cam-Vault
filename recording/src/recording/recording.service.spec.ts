import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';
import { ClientProxy, } from '@nestjs/microservices';
import { ModuleMocker } from 'jest-mock';
import * as path from 'node:path'
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { EventEmitter } from 'node:stream';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { isFormatInputPathObject, RTSPURL, RTSPURLSample } from 'src/common/types/types';
import { FFMPEGBuilder } from 'src/recording/process-builder/FFmpegProcessBuilder';
import { Provider } from '@nestjs/common';
import { ProcessBuilderModule } from './process-builder/process-builder.module';
jest.mock('node:child_process')
jest.mock('src/recording/process-builder/FFmpegProcessBuilder')

const moduleMocker = new ModuleMocker(global);


interface MockProcess extends EventEmitter {
  stdout: EventEmitter,
  stderr: EventEmitter
}


function createTargetPath(overrides?: path.FormatInputPathObject) {
  return {
    dir: 'testDir',
    base: 'testBase',
    ...overrides,
  }
}

function createRecordParams(overrides?: Partial<{
  inputStreams: RTSPURL[],
  videoLen: number,
  targetDir: path.FormatInputPathObject
}>, N: number = 1): {
  inputStreams: RTSPURL[],
  videoLen: number,
  targetDir: path.FormatInputPathObject
} {
  return {
    inputStreams: Array(N).fill(RTSPURLSample),
    videoLen: 10,
    targetDir: createTargetPath(),
    ...overrides
  }
}

function createEncodingJob() {
  return { filePath: createTargetPath(), codec: 'libx264' }
}

const createMockProcess = () => Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter(), });
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


describe('RecordingService', () => {
  let recordingService: RecordingService;//real providers
  let RMQ: jest.Mocked<ClientProxy>//mock providers
  let ffmpegBuilder: jest.Mocked<FFMPEGBuilder>;
  let mockProcess: MockProcess//mock process
  let testStreamArrs: RTSPURL[]
  let testVideoLen: number
  let testTargetDir: path.FormatInputPathObject
  beforeEach(async () => {

    //mock dependency which is not a part of nestJS provider. Since dependency is not a responsibility, they will be tested in seperate test suites

    mockProcess = createMockProcess();

    //create mock providers and then create nestJS testing module
    const MockRMQService: Provider = {
      provide: 'RMQ_SERVICE',
      useValue: {
        emit: jest.fn()
      },
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RecordingService,
        MockRMQService],
    }).useMocker((token)=>{
      if(typeof token === 'function'){
        const metadata=moduleMocker.getMetadata(token)
        const Mock=moduleMocker.generateFromMetadata(metadata!)
        if(isConstructor(Mock)) return new Mock()
        else return undefined
      }
    })
      .compile();

    //get reference of a service from module
    recordingService = moduleRef.get(RecordingService);
    RMQ = moduleRef.get('RMQ_SERVICE');
    ffmpegBuilder=moduleRef.get(FFMPEGBuilder);
    ffmpegBuilder.addRecordingMetadata.mockReturnThis()
    ffmpegBuilder.useFactory.mockReturnThis()
    ffmpegBuilder.build.mockReturnValue(mockProcess);
      //create test constance
      ({ inputStreams: testStreamArrs, videoLen: testVideoLen, targetDir: testTargetDir } = createRecordParams({}, 4))
  });



  afterEach(() => {
    jest.resetAllMocks()
  })



  test('should initialize service and dependencies', () => {
    expect(recordingService).toBeDefined();
    expect(RMQ).toBeDefined()
  });



  test('record() should emit encoding_request when ffmpeg exits with code 0', async () => {
    recordingService.record(testStreamArrs, testVideoLen, testTargetDir);

    expect(RMQ.emit).not.toHaveBeenCalled()
    mockProcess.emit('close', 0);//ffmpeg response: recording success
    expect(RMQ.emit).toHaveBeenCalledTimes(4)
  })



  test('record() should throw when ffmpeg exits with a non-zero code', () => {
    recordingService.record(testStreamArrs, testVideoLen, testTargetDir)

    const ffmpegCode = 1
    expect(() => mockProcess.emit('close', ffmpegCode)).toThrow(new RegExp(ffmpegCode.toString()))
    expect(RMQ.emit).not.toHaveBeenCalled()
  })



  test('record() should rethrow ffmpeg process errors', () => {
    recordingService.record(testStreamArrs, testVideoLen, testTargetDir)

    const testErr = new Error('fail')
    expect(() => mockProcess.emit('error', testErr)).toThrow(testErr)
    expect(RMQ.emit).not.toHaveBeenCalled()
  })
});
