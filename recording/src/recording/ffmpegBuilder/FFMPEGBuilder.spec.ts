import { spawn } from 'child_process';
import { EventEmitter } from 'node:events';
import { RTSPURLSample } from 'src/common/types/types';
import {
  EncodingContext,
  FFMPEGProcessBuilder,
  Options,
} from './FFMPEGBuilder';
import { EncodingProcessBuilderStrategy } from './FFMPEGBuilderStrategy';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

const spawnMock = spawn as unknown as jest.Mock;

function createMockProcess() {
  return Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
}

function createOptions(entries: [string, string][]): Options {
  return new Map(entries);
}

describe('FFMPEGBuilder', () => {
  beforeEach(() => {
    spawnMock.mockReturnValue(createMockProcess());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('option registration methods should be chainable', () => {
    const builder = new FFMPEGProcessBuilder();

    expect(builder.addGlobalOption('-loglevel', 'error')).toBe(builder);
    expect(
      builder.addFilterOption('-filter_complex', '[0:v]scale=1280:720'),
    ).toBe(builder);
    expect(builder.inStream(RTSPURLSample)).toBe(builder);
    expect(builder.outStream('camera0.ts')).toBe(builder);
  });

  test('build() should spawn ffmpeg with registered options and video sources', () => {
    const process = createMockProcess();
    spawnMock.mockReturnValue(process);

    const builder = new FFMPEGProcessBuilder()
      .addGlobalOption('-loglevel', 'error')
      .inputOption('-rtsp_transport', 'tcp')
      .timeout(5000000)
      .inStream(RTSPURLSample)
      .addFilterOption('-filter_complex', '[0:v]scale=1280:720')
      .map(0)
      .codec('copy')
      .outputOption('-t', '10')
      .outStream('camera0.ts')
      .commit();

    expect(builder.build()).toBe(process);
    expect(spawnMock).toHaveBeenCalledTimes(1);

    const [command, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(command).toBe('ffmpeg');
    expect(args).toEqual([
      '-y',
      '-loglevel',
      'error',
      '-rtsp_transport',
      'tcp',
      '-timeout',
      '5000000',
      '-i',
      RTSPURLSample,
      '-filter_complex',
      '[0:v]scale=1280:720',
      '-map',
      '0',
      '-c',
      'copy',
      '-t',
      '10',
      'camera0.ts',
    ]);
    // expect(args.indexOf('-rtsp_transport')).toBeLessThan(args.indexOf('-i'));
    expect(args[args.indexOf('-i') + 1]).toBe(RTSPURLSample);
  });

  test('build() should add -i only to input sources', () => {
    const builder = new FFMPEGProcessBuilder()
      .inStream(RTSPURLSample)
      .inputOption('-rtsp_transport', 'tcp')
      .outStream('camera0.ts')
      .codec('copy')
      .commit();

    builder.build();

    const [, args] = spawnMock.mock.calls[0] as [string, string[]];
    expect(args).toEqual([
      '-y',
      '-rtsp_transport',
      'tcp',
      '-i',
      RTSPURLSample,
      '-c',
      'copy',
      'camera0.ts',
    ]);
    expect(args[args.indexOf('camera0.ts') - 1]).not.toBe('-i');
  });

  test('build() should keep input prefixes when called more than once', () => {
    const builder = new FFMPEGProcessBuilder()
      .inStream(RTSPURLSample)
      .inputOption('-rtsp_transport', 'tcp')
      .outStream('camera0.ts')
      .codec('copy')
      .commit()
      .build();
    console.log(spawnMock.mock.calls[0]);
    const [, secondBuildArgs] = spawnMock.mock.calls[0];
    expect(secondBuildArgs).toEqual([
      '-y',
      '-rtsp_transport',
      'tcp',
      '-i',
      RTSPURLSample,
      '-c',
      'copy',
      'camera0.ts',
    ]);
  });

  test('applyStrategy() should call the provided strategy with builder and context', () => {
    const builder = new FFMPEGProcessBuilder();
    const context: EncodingContext = {
      inputs: [RTSPURLSample],
      outputs: ['camera0.ts'],
      segmentLen: 10,
      codec: 'copy',
    };
    const strategy: jest.MockedFunction<
      EncodingProcessBuilderStrategy<FFMPEGProcessBuilder>
    > = jest.fn((builder, _context) => builder);

    expect(builder.applyStrategy(strategy, context)).toBe(builder);
    expect(strategy).toHaveBeenCalledTimes(1);
    expect(strategy).toHaveBeenCalledWith(builder, context);
  });
});
