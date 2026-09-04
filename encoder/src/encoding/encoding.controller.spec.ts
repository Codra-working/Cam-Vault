import { Test, TestingModule } from '@nestjs/testing';
import { EncodingController } from './encoding.controller';
import { EncodingService } from './encoding.service';
import { Provider } from '@nestjs/common';
import { DBService } from 'src/DB/DB.service';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { RmqContext } from '@nestjs/microservices';
import { Channel } from 'amqplib';
import path from 'node:path';
import * as fsPromise from 'node:fs/promises';
jest.mock('node:fs/promises', () => ({
  rm: jest.fn(),
}));

describe('consumeEncodingRequest()', () => {
  let module: TestingModule;
  let encodingController: EncodingController;
  let encodingService: jest.Mocked<EncodingService>;
  let dbSerivce: jest.Mocked<DBService>;
  let mockPayload: EncodingRequestDTO;
  let mockContext: Partial<RmqContext>;
  let mockRm: jest.MockedFunction<typeof fsPromise.rm>;

  beforeEach(async () => {
    const mockFsPromise = jest.mocked(fsPromise);
    const mockRm_ = mockFsPromise.rm.mockResolvedValue(undefined);
    const mockEncodingService: jest.Mocked<Partial<EncodingService>> = {
      encode: jest.fn(),
    };
    const encodingServiceProvider: Provider = {
      provide: EncodingService,
      useValue: mockEncodingService,
    };
    const mockDBService: jest.Mocked<Partial<DBService>> = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    const dbServiceProvider: Provider = {
      provide: DBService,
      useValue: mockDBService,
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [EncodingController],
      providers: [encodingServiceProvider, dbServiceProvider],
    }).compile();

    const mockPayload_: EncodingRequestDTO = {
      Bucket: 'testBucket',
      Key: 'testKey',
      codec: 'libx264',
    };

    const mockChannel: jest.Mocked<Partial<Channel>> = {
      ack: jest.fn(),
      reject: jest.fn(),
    };

    const mockContext_ = {
      getChannelRef: jest
        .fn<jest.Mocked<Partial<Channel>>, []>()
        .mockReturnValue(mockChannel),
      getMessage: jest.fn().mockReturnValue('test message'),
    };
    module = testingModule;
    mockRm = mockRm_;
    encodingController =
      testingModule.get<EncodingController>(EncodingController);
    encodingService =
      testingModule.get<jest.Mocked<EncodingService>>(EncodingService);
    dbSerivce = testingModule.get<jest.Mocked<DBService>>(DBService);
    mockPayload = mockPayload_;
    mockContext = mockContext_;
  });

  afterEach(async () => {
    await module.close();
    jest.resetAllMocks();
  });

  test('should be defined before every test', () => {
    expect(encodingController).toBeDefined();
    expect(encodingService).toBeDefined();
    expect(dbSerivce).toBeDefined();
    expect(mockPayload).toBeDefined();
    expect(mockContext).toBeDefined();
  });

  test('should call encodingSerive.encode() with corrct argument', async () => {
    const spy = jest.spyOn(encodingService, 'encode');
    await encodingController.consumeEncodingRequest(
      mockPayload,
      mockContext as RmqContext,
    );
    expect(spy).toHaveBeenNthCalledWith(
      1,
      mockPayload.Bucket,
      mockPayload.Key,
      mockPayload.codec,
    );
  });

  // test('should remove original file when encoding successes', async () => {
  //   await encodingController.consumeEncodingRequest(
  //     mockPayload,
  //     mockContext as RmqContext,
  //   );
  //   expect(mockRm).toHaveBeenNthCalledWith(1, mockPayload.absFilePath);
  // });

  test('should not remove original file when encoding fails', async () => {
    encodingService.encode.mockRejectedValue('');
    const channel = mockContext.getChannelRef!() as Channel;
    const rejectSpy = jest.spyOn(channel, 'reject');
    await encodingController.consumeEncodingRequest(
      mockPayload,
      mockContext as RmqContext,
    );

    expect(mockRm).not.toHaveBeenCalled();
    expect(rejectSpy).toHaveBeenCalledTimes(1);
  });

  // test('should save videoFile to DB when encoding success', async () => {
  //   const spy = jest.spyOn(dbSerivce, 'save');
  //   await encodingController.consumeEncodingRequest(
  //     mockPayload,
  //     mockContext as RmqContext,
  //   );
  //   const parsedPath = path.parse(mockPayload.);
  //   expect(spy).toHaveBeenNthCalledWith(1, parsedPath.name, parsedPath.dir);
  // });

  test('should not save videoFile to DB when encoding fails', async () => {
    encodingService.encode.mockRejectedValue('');
    const spy = jest.spyOn(dbSerivce, 'save');
    const channel = mockContext.getChannelRef!() as Channel;
    const rejectSpy = jest.spyOn(channel, 'reject');
    await encodingController.consumeEncodingRequest(
      mockPayload,
      mockContext as RmqContext,
    );

    expect(spy).not.toHaveBeenCalled();
    expect(rejectSpy).toHaveBeenCalledTimes(1);
  });

  test('should send ack to broker when encoding successes', async () => {
    const channel = mockContext.getChannelRef!() as Channel;
    const ackSpy = jest.spyOn(channel, 'ack');
    const rejectSpy = jest.spyOn(channel, 'reject');
    const testMessage: Record<string, any> = {
      body: 'test message',
    };
    jest.spyOn(mockContext, 'getMessage').mockReturnValueOnce(testMessage);
    await encodingController.consumeEncodingRequest(
      mockPayload,
      mockContext as RmqContext,
    );

    expect(ackSpy).toHaveBeenNthCalledWith(1, testMessage);
    expect(rejectSpy).not.toHaveBeenCalled();
  });

  test('should send reject to broker when encoding fails', async () => {
    const channel = mockContext.getChannelRef!() as Channel;
    const ackSpy = jest.spyOn(channel, 'ack');
    const rejectSpy = jest.spyOn(channel, 'reject');
    const testMessage: Record<string, any> = {
      body: 'test message',
    };
    jest.spyOn(mockContext, 'getMessage').mockReturnValueOnce(testMessage);
    encodingService.encode.mockRejectedValue('');
    await encodingController.consumeEncodingRequest(
      mockPayload,
      mockContext as RmqContext,
    );
    expect(ackSpy).not.toHaveBeenCalled();
    expect(rejectSpy).toHaveBeenNthCalledWith(1, testMessage);
  });
});
