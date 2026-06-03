import {InternalServerErrorException} from '@nestjs/common'
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { RecordingController } from './recording.controller';
import { ConfigService } from '@nestjs/config';
import { ModuleMocker, MockMetadata, Mocked, MockedClass, MockedObject } from 'jest-mock';
TestingModuleBuilder
const moduleMocker = new ModuleMocker(global);

describe('RecordingController', () => {
  let recordingController: RecordingController;
  let configService:MockedObject<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordingController],
    }).useMocker((token) => {
      if (typeof token === 'function') {
        const mockMetadata = moduleMocker.getMetadata(
          token,
        ) as MockMetadata<any>;
        const Mock = moduleMocker.generateFromMetadata(mockMetadata);
        return new Mock();
      }
    }).compile();

    recordingController = module.get(RecordingController);
    configService = module.get(ConfigService)
  });

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('should initialize controller and config service', () => {
    expect(recordingController).toBeDefined();
    expect(configService).toBeDefined();
  });

  test('getUrls() should read streams from config service', () => {
    recordingController.getUrls()
    expect(configService.get).toHaveBeenNthCalledWith(1, 'streams')
  });

  test('setUrls() should persist streams to config service', () => {
    const testRTSPURLS:string[]=['testUrl1','testUrl2']
    recordingController.setUrls(testRTSPURLS)
    expect(configService.set).toHaveBeenNthCalledWith(1, 'streams',testRTSPURLS)
  });

  test('setVideoLen() should persist videoLen as a string',()=>{
    const testVideoLen=10
    recordingController.setVideoLen(testVideoLen)
    expect(configService.set).toHaveBeenNthCalledWith(1,'videoLen',testVideoLen.toString())
  })

  test('setVideoLen() should throw InternalServerErrorException when configService.set fails',()=>{
    const testVideoLen=10
    configService.set.mockImplementationOnce(()=>{throw new Error('test')})
    // expect(configService.set).toHaveBeenNthCalledWith(1,'videoLen',testVideoLen.toString())
    expect(()=>{recordingController.setVideoLen(testVideoLen)}).toThrow(InternalServerErrorException)
  })
});
