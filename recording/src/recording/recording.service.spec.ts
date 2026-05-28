import { Test, TestingModule } from '@nestjs/testing';
import { RecordingService } from './recording.service';
import { ClientsModule, ClientProxy, Transport } from '@nestjs/microservices';
import { ModuleMocker, MockMetadata, MockedObject } from 'jest-mock';
import * as path from 'node:path'
import { ChildProcess, spawn } from 'node:child_process';
import { Readable } from 'node:stream';
const moduleMocker = new ModuleMocker(global);
jest.mock('node:child_process')
const mockedChildProcess: Partial<ChildProcess> = {
  stdout: {
    on: jest.fn((event, cb) => {
      if (event === 'data') cb('mocked spawn called callback')
    })
  } as any,
  stderr: {
    on: jest.fn((event, cb) => {
      if (event === 'data') cb('mocked spawn called callback')
    })
  } as any,
  on: jest.fn((event, cb) => {
    cb(`mocked spawn received ${event} event`)
  }) as any,
}
describe('RecordingService', () => {
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
    (spawn as jest.Mock).mockReturnValue(mockedChildProcess)
    RMQ = module.get('RMQ_SERVICE')
    recordingService = module.get(RecordingService);
  });

  test('should be defined', () => {
    expect(RMQ).toBeDefined()
    expect(recordingService).toBeDefined();
  });

  test('record', async () => {
    const testStreamArr: string[] = ['testStream1']
    const testVideoLen: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    const testTargetPath: path.ParsedPath = {
      root: 'testRoot',
      dir: 'testDir',
      base: 'testBase',
      ext: 'testExt',
      name: 'testName',
    }
    try{
      await recordingService.record(testStreamArr, testVideoLen, testTargetPath)
    }catch(e){

    }
    expect(spawn).toHaveBeenCalledWith('ffmpeg')
  })
});
