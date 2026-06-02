import { Test, TestingModule } from '@nestjs/testing';
import { createRecordingFileName, RecordingService } from './recording.service';
import { ClientsModule, ClientProxy, Transport } from '@nestjs/microservices';
import { ModuleMocker, MockMetadata, MockedObject, MockedClass, mocked } from 'jest-mock';
import * as path from 'node:path'
import { ChildProcess, spawn } from 'node:child_process';
import { EventEmitter, Readable } from 'node:stream';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { RTSPURL, RTSPURLSample } from 'src/common/types/types';
import { FFMPEGBuilder, FFMPEGBuilderFactory } from 'src/common/utils/processBuilder/FFmpegProcessBuilder';
jest.mock('node:child_process')
jest.mock('src/common/utils/processBuilder/FFmpegProcessBuilder')

const moduleMocker = new ModuleMocker(global);

interface MockProcess extends EventEmitter {
  stdout: EventEmitter,
  stderr: EventEmitter
}
describe('RecordingService:', () => {
  let RMQ: MockedObject<ClientProxy>
  let recordingService: RecordingService;
  let mockedFFmpeg: FFMPEGBuilder
  let mockProcess: MockProcess
  let testEncodingJobs:EncodingRequestDTO[]
  beforeEach(async () => {
    mockProcess = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter(), });
    (spawn as jest.Mock).mockReturnValue(mockProcess)

    const Mock = moduleMocker.generateFromMetadata(moduleMocker.getMetadata(FFMPEGBuilder)!)
    const testParsedPath={dir:"c:/users"}
    mockedFFmpeg = new Mock()
    mockedFFmpeg.addGlobalOption=jest.fn()
    mockedFFmpeg.getOutputSrcList=jest.fn().mockReturnValue([testParsedPath])
    mockedFFmpeg.buildAndStart=jest.fn().mockReturnValue(spawn('test'))


    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RecordingService,
        {
          provide: 'RMQ_SERVICE',
          useValue: {
            emit: jest.fn()
          },
        },
        {
          provide: 'FFMPEGBuilderFactory',
          useValue: () => mockedFFmpeg
        }
      ],
    })
      .compile();
    testEncodingJobs = [{ filePath: {dir:"c:/users"} as path.ParsedPath, codec: 'libx264' }];
    
    RMQ = moduleRef.get('RMQ_SERVICE')
    recordingService = moduleRef.get(RecordingService);
    recordingService.createEncodingRequestPayload=jest.fn().mockReturnValue(testEncodingJobs)
    
  });

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should be defined', () => {
    expect(RMQ).toBeDefined()
    expect(recordingService).toBeDefined();
    expect(mockedFFmpeg).toBeDefined();
  });
  //로직이 반복됨
  test('record(ffmpeg sucess)', async () => {
    const testStreamArr: RTSPURL[] = [RTSPURLSample]
    const testVideoLen: number = 10
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'

    mockProcess.emit('close', 0)//ffmpeg response: recording success
    expect(RMQ.emit).toHaveBeenNthCalledWith(1,'encoding_request',testEncodingJobs)
  })

  test('record(ffmpeg fail1)', () => {
    const testStreamArr: RTSPURL[] = [RTSPURLSample]
    const testVideoLen: number = 10
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'
    const ffmpegCode = 1

    expect(()=>mockProcess.emit('close', ffmpegCode)).toThrow(`process exited with code: ${ffmpegCode}`)

  })

  test('record(ffmpeg fail2)', () => {
    const testStreamArr: RTSPURL[] = [RTSPURLSample]
    const testVideoLen: number = 10
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'
    const testErr = new Error('fail')

    expect(()=>mockProcess.emit('error', testErr)).toThrow(testErr)
  })
});
