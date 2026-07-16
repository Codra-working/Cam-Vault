// import { Test, TestingModule } from '@nestjs/testing';
// import { RecordingController } from './recording.controller';
// import { ValueProvider } from '@nestjs/common';
// import { ClientProxy } from '@nestjs/microservices';
// import { Observable, throwError } from 'rxjs';
// import { RecordingConfigDTO } from './recordingConfig.DTO';
// function makeObservable<T>(testvalue: T) {
//   return new Observable<T>((subscriber) => {
//     subscriber.next(testvalue);
//     subscriber.complete();
//   });
// }

// function makeObservableError<T>(testvalue: T) {
//   return new Observable<T>((subscriber) => {
//     subscriber.error(testvalue);
//   });
// }
// const setup: () => Promise<[TestingModule, RecordingConfigDTO]> = async () => {
//   const testRecordingConfig_: RecordingConfigDTO = {
//     streams: ['test stream1', 'test stream2'],
//     targetDir: 'c:\\test\\targetDir',
//     duration: '10',
//     videoLen: 10,
//   };

//   const nestNoMatchingHandlerError = {
//     status: 'error',
//     err: 'There is no matching message handler defined in the remote service.',
//   };
//   const clientProvider: ValueProvider = {
//     provide: 'RECORDING_SERVICE',
//     useValue: {
//       send: jest.fn((head, _) => {
//         if (head.cmd === 'get_RTSP_URLs') {
//           return makeObservable<string[]>(testRecordingConfig_.streams);
//         } else if (head.cmd === 'get_storage_directory') {
//           return makeObservable<string>(testRecordingConfig_.targetDir);
//         } else if (head.cmd === 'get_recording_duration') {
//           return makeObservable<string>(testRecordingConfig_.duration);
//         } else if (head.cmd === 'get_video_length') {
//           return makeObservable<number>(testRecordingConfig_.videoLen);
//         } else if (head.cmd === 'update_recording_config') {
//           return undefined;
//         } else {
//           return makeObservableError<typeof nestNoMatchingHandlerError>(
//             nestNoMatchingHandlerError,
//           );
//         }
//       }),
//     },
//   };

//   const moduleRef_ = await Test.createTestingModule({
//     controllers: [RecordingController],
//     providers: [clientProvider],
//   }).compile();
//   return [moduleRef_, testRecordingConfig_];
// };

// describe('getRecordingConfig()', () => {
//   let moduleRef: TestingModule;
//   let mockClient: jest.Mocked<ClientProxy>;
//   let recordingController: RecordingController;
//   let testRecordingConfig: RecordingConfigDTO;

//   beforeEach(async () => {
//     [moduleRef, testRecordingConfig] = await setup();

//     mockClient = moduleRef.get<jest.Mocked<ClientProxy>>('RECORDING_SERVICE');
//     recordingController =
//       moduleRef.get<RecordingController>(RecordingController);
//   });
//   afterEach(async () => {
//     jest.clearAllMocks();
//     await moduleRef.close();
//   });

//   test('shuld be defined', () => {
//     expect(moduleRef).toBeDefined();
//     expect(mockClient).toBeDefined();
//     expect(recordingController).toBeDefined();
//   });

//   test('should request recording config and return merged dto', async () => {
//     const spy = jest.spyOn(mockClient, 'send');
//     const result = await recordingController.getConfig();

//     expect(spy).toHaveBeenCalledTimes(4);
//     expect(spy).toHaveBeenCalledWith({ cmd: 'get_RTSP_URLs' }, {});
//     expect(spy).toHaveBeenCalledWith({ cmd: 'get_storage_directory' }, {});
//     expect(spy).toHaveBeenCalledWith({ cmd: 'get_recording_duration' }, {});
//     expect(spy).toHaveBeenCalledWith({ cmd: 'get_video_length' }, {});
//     expect(result).toStrictEqual<RecordingConfigDTO>(testRecordingConfig);
//   });

//   test('should be rejected when server error occurs', async () => {
//     const spy = jest.spyOn(mockClient, 'send');
//     const nestRPCError = { status: 'error', message: 'Internal server error' };
//     spy.mockReturnValueOnce(throwError(() => nestRPCError));
//     await expect(recordingController.getConfig()).rejects.toBe(nestRPCError);
//   });
// });

// // describe('updateRecordingConfig()', () => {
// //   let moduleRef: TestingModule;
// //   let mockClient: jest.Mocked<ClientProxy>;
// //   let recordingController: RecordingController;
// //   let testRecordingConfig: RecordingConfigDTO;
// //   beforeEach(async () => {
// //     const testRecordingConfig_: RecordingConfigDTO = {
// //       streams: ['test stream1', 'test stream2'],
// //       targetDir: 'c:\\test\\targetDir',
// //       duration: '10',
// //       videoLen: 10,
// //     };

// //     const clientProvider: ValueProvider = {
// //       provide: 'RECORDING_SERVICE',
// //       useValue: {
// //         send: jest.fn(),
// //       },
// //     };

// //     const moduleRef_ = await Test.createTestingModule({
// //       controllers: [RecordingController],
// //       providers: [clientProvider],
// //     }).compile();
// //     moduleRef = moduleRef_;
// //     mockClient = moduleRef_.get<jest.Mocked<ClientProxy>>('RECORDING_SERVICE');
// //     recordingController =
// //       moduleRef_.get<RecordingController>(RecordingController);
// //     testRecordingConfig = testRecordingConfig_;
// //   });
// //   afterEach(async () => {
// //     jest.clearAllMocks();
// //     await moduleRef.close();
// //   });

// //   test('should update recordingConfig', () => {
// //     const spy = jest.spyOn(mockClient, 'send');
// //     const ret = makeObservable<any>(undefined);
// //     mockClient.send.mockReturnValueOnce(ret);
// //     const pattern = { cmd: 'update_recording_config' };
// //     const res = recordingController.updateConfig(testRecordingConfig);

// //     expect(spy).toHaveBeenCalledTimes(1);
// //     expect(spy).toHaveBeenCalledWith(pattern, testRecordingConfig);
// //     expect(res).toBe(ret);
// //   });
// // });
