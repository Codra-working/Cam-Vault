import { Test, TestingModule } from '@nestjs/testing';
import { createRecordingFileName, RecordingService } from './recording.service';
import { ClientsModule, ClientProxy, Transport } from '@nestjs/microservices';
import { ModuleMocker, MockMetadata, MockedObject } from 'jest-mock';
import * as path from 'node:path'
import { ChildProcess, spawn } from 'node:child_process';
import { EventEmitter, Readable } from 'node:stream';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';

jest.mock('node:child_process')
const moduleMocker = new ModuleMocker(global);

interface MockProcess extends EventEmitter {
  stdout: EventEmitter,
  stderr: EventEmitter
}
const mockProcess: MockProcess = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter(), })

describe('RecordingService:', () => {
  let RMQ: MockedObject<ClientProxy>
  let recordingService: RecordingService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecordingService,
        {
          provide: 'RMQ_SERVICE',
          useValue: {
            emit: jest.fn()
          },
        }
      ],
    }).useMocker((token) => {
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockMetadata<any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();
    (spawn as jest.Mock).mockReturnValue(mockProcess)
    RMQ = module.get('RMQ_SERVICE')
    recordingService = module.get(RecordingService);
  });

  test('should be defined', () => {
    expect(RMQ).toBeDefined()
    expect(recordingService).toBeDefined();
  });
  //로직이 반복됨
  test('record(ffmpeg sucess)', async () => {
    const testStreamArr: string[] = ['testStream1']
    const testVideoLen: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    const promise = recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'
    mockProcess.stderr.emit('data', Buffer.from(stderrEmit))
    mockProcess.stdout.emit('data', Buffer.from(stdoutEmit))
    mockProcess.emit('close', 0)//ffmpeg response: recording success

    promise.then(result => {
      //안에 들어가는값 까지 확인하는 로직 추가해야됨
      expect(RMQ.emit).toHaveBeenCalled()
      expect(result).toBe(stderrEmit + '\n' + stdoutEmit)
    })
    //expect(RMQ.emit<any, EncodingRequestDTO>).toHaveBeenNthCalledWith(1,)
  })

  test('record(ffmpeg fail1)', async () => {
    const testStreamArr: string[] = ['testStream1']
    const testVideoLen: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    const promise = recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'
    const ffmpegCode=1
    mockProcess.stderr.emit('data', Buffer.from(stderrEmit))
    mockProcess.stdout.emit('data', Buffer.from(stdoutEmit))
    mockProcess.emit('close', ffmpegCode)//ffmpeg response: recording fail
    await expect(promise).rejects.toThrow(ffmpegCode.toString())
  })

  test('record(ffmpeg fail2)', async () => {
    const testStreamArr: string[] = ['testStream1']
    const testVideoLen: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    const promise = recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    const stderrEmit = 'stderr test data'
    const stdoutEmit = 'stdout test data'
    mockProcess.stderr.emit('data', Buffer.from(stderrEmit))
    mockProcess.stdout.emit('data', Buffer.from(stdoutEmit))
    mockProcess.emit('error', new Error('fail'))//ffmpeg response: recording fail

    await expect(promise).rejects.toThrow('fail')
  })
});
