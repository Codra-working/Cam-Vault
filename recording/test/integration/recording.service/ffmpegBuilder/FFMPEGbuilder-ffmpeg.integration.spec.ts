import { Test, TestingModule } from '@nestjs/testing';
import { ChildProcess } from 'node:child_process';
import { FFMPEGProcessBuilder } from 'src/recording/ffmpegBuilder/FFMPEGBuilder';

describe('FFMPEGBuilder integration test', () => {
  let moduleRef: TestingModule;
  let ffmpegBuilder: FFMPEGProcessBuilder;
  beforeEach(async () => {
    const moduleRef_ = await Test.createTestingModule({
      providers: [FFMPEGProcessBuilder],
    }).compile();
    moduleRef = moduleRef_;
    ffmpegBuilder = moduleRef.get(FFMPEGProcessBuilder);
  });

  afterEach(async () => {
    await moduleRef.close();
    jest.clearAllMocks();
  });
  test('should spawn ffmpeg process successfully', async () => {
    const ffmpeg = ffmpegBuilder
      .inputOption('-f', 'lavfi')
      .inStream('testsrc=duration=0.1:size=16x16:rate=1')
      .outputOption('-frames:v', '1')
      .outputOption('-f', 'null')
      .outStream('-')
      .commit()
      .build();
    ffmpeg.stderr.resume();
    ffmpeg.stdout.resume();

    const promise = new Promise((resolve, reject) => {
      ffmpeg.once('close', (code, signal) => {
        if (code == 0 && signal == null) {
          resolve(`suceed code:${code}, signal:${signal}`);
          return;
        }

        reject(new Error(`close: code:${code}, signal:${signal}`));
      });
      ffmpeg.once('error', reject);
    });
    expect(ffmpeg).toBeInstanceOf(ChildProcess);
    await expect(promise).resolves.toBeDefined();
  });
});
