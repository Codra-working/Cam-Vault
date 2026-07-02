import { Test, TestingModule } from '@nestjs/testing';
import { EncodingService } from './encoding.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'src/config/configuration';
import {
  FFMPEGBuilder,
  videoSourceToString,
} from './ffmpegBuilder/FFMPEGBuilder.service';
import { Provider } from '@nestjs/common';
import { EventEmitter } from 'stream';
import path from 'path';
import { ChildProcessWithoutNullStreams } from 'child_process';
import type {
  Codec,
  FFMPEGBuildContext,
} from './ffmpegBuilder/FFMPEGBuilderStrategy';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('encode()', () => {
  let moduleRef: TestingModule;
  let ffmpegBuilder: jest.Mocked<Partial<FFMPEGBuilder>>;
  let configService: ConfigService;
  let encodingService: EncodingService;
  let mockProcess: jest.Mocked<Partial<ChildProcessWithoutNullStreams>>;
  let inStream: path.FormatInputPathObject;
  let codec: Codec;
  let fileFormat: string;
  beforeEach(async () => {
    mockProcess = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    }) as jest.Mocked<Partial<ChildProcessWithoutNullStreams>>;

    const mockEncodingProcessBuilder: jest.Mocked<Partial<FFMPEGBuilder>> = {
      applyStrategy: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockProcess),
    };

    const EncodingProcessBuilder: Provider = {
      provide: FFMPEGBuilder,
      useValue: mockEncodingProcessBuilder,
    };

    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
      providers: [EncodingService, EncodingProcessBuilder],
    }).compile();

    moduleRef = testingModule;
    ffmpegBuilder =
      moduleRef.get<jest.Mocked<Partial<FFMPEGBuilder>>>(FFMPEGBuilder);
    configService = moduleRef.get<ConfigService>(ConfigService);
    encodingService = moduleRef.get<EncodingService>(EncodingService);

    inStream = {
      dir: 'c:\\test\\targetDirectory',
      name: 'testFileName',
      ext: 'testExt',
    };
    codec = 'copy';
    fileFormat = 'testFormat';
  });

  afterEach(async () => {
    await moduleRef.close();
    jest.resetAllMocks();
  });

  test('should be defined', () => {
    expect(configService).toBeDefined();
    expect(encodingService).toBeDefined();
    expect(ffmpegBuilder).toBeDefined();
  });

  test('should create encoding process', async () => {
    const configSpy = jest.spyOn(configService, 'get');
    const applyStrategySpy = jest.spyOn(ffmpegBuilder, 'applyStrategy');
    const buildSpy = jest.spyOn(ffmpegBuilder, 'build');
    const promise = encodingService.encode(inStream, codec, fileFormat);
    mockProcess.emit!('close', 0, null);
    await promise;

    expect(configSpy).toHaveBeenNthCalledWith(1, 'targetDirectory');
    expect(applyStrategySpy).toHaveBeenCalledTimes(1);
    const context: FFMPEGBuildContext = applyStrategySpy.mock.calls[0][1];
    expect(context.inputs).toEqual([inStream]);
    expect(context.codec).toBe(codec);
    expect(context.outputs.length).toBeGreaterThanOrEqual(1);
    for (const output of context.outputs) {
      expect(videoSourceToString(output)).toMatch(
        new RegExp(
          `(^|[\\\\/])${escapeRegExp(String(inStream.name))}\\.${escapeRegExp(fileFormat)}$`,
        ),
      );
    }
    expect(buildSpy).toHaveBeenCalledTimes(1);
  });

  test('should resolve when the process closes with code 0', async () => {
    const code: number | null = 0;
    const signal: NodeJS.Signals | null = null;
    const promise = encodingService.encode(inStream, codec, fileFormat);
    mockProcess.emit!('close', code, signal);
    await expect(promise).resolves.toMatch(new RegExp(`code:${code}`));
  });

  test('should reject when the process closes with non-zero code', async () => {
    const code: number | null = 1;
    const signal: NodeJS.Signals | null = null;
    const promise = encodingService.encode(inStream, codec, fileFormat);
    mockProcess.emit!('close', code, signal);
    await expect(promise).rejects.toThrow(
      new RegExp(`signal:${signal}.*code:${code}`),
    );
  });

  test('should reject when the process closes with signal', async () => {
    const code: number | null = null;
    const signal: NodeJS.Signals | null = 'SIGTERM';
    const promise = encodingService.encode(inStream, codec, fileFormat);
    mockProcess.emit!('close', code, signal);
    await expect(promise).rejects.toThrow(
      new RegExp(`signal:${signal}.*code:${code}`),
    );
  });

  test('should reject when the process emit error event', async () => {
    const testError = new Error('test');
    const promise = encodingService.encode(inStream, codec, fileFormat);
    mockProcess.emit!('error', testError);

    await expect(promise).rejects.toBe(testError);
  });
});
