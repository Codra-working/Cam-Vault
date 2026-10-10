import { readFileSync } from 'node:fs';
import path, { join } from 'node:path';
import {
  Details,
  H264Transport,
} from 'yellowstone';
import * as sdpTransform from 'sdp-transform';
import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import parseRtpDump from './utils/parseRTPDump';
import RTPStream from './utils/RTPStream';
import WritableBuffer from './utils/WritableConsole';
import AU2Segment from './AU2Segment';

describe('ssss', () => {
  beforeEach(() => {
    let firstAUHead;
    const workerPool = new Map();
    const streamIndex = 0;
    const options = { firstAUHead, workerPool, streamIndex };
  });
  afterEach(() => {});
  test('', async () => {
    // we need h264stream for testing
    // read sdp file
    const sdp = readFileSync(join(__dirname, 'sample', 'h264-baseline-640x360-25fps-10s.sdp'));
    const sdpStr = sdp.toString();
    // parse sdp buffer
    const sdpObj:sdpTransform.SessionDescription = sdpTransform.parse(sdpStr);
    const mockedMediaSource: sdpTransform.MediaDescription = {
      type: sdpObj.media[0].type,
      port: sdpObj.media[0].port,
      protocol: sdpObj.media[0].protocol,
      rtp: sdpObj.media[0].rtp,
      fmtp: sdpObj.media[0].fmtp,
    };
    const mockedDetails:Details = {
      codec: 'sdpObj',
      mediaSource: mockedMediaSource,
      rtpChannel: 0,
      rtcpChannel: 0,
    };

    const _rtpDump = readFileSync(join(__dirname, 'sample', 'h264-baseline-640x360-25fps-10s.rtpdump'));
    const rtpDump = parseRtpDump(_rtpDump);
    // connect and run
    let i = 0;
    const run = async () => {
      const rtpStream = new RTPStream({}, rtpDump);
      const h264Transport:H264Transport = new H264Transport(rtpStream, mockedDetails);

      // body에서 dest로 쓰기

      const au2Segment = new AU2Segment({
        firstAUHead: h264Transport.firstAUHead, segmentDuration: 1, streamIndex: 0,
      });
      pipeline(h264Transport, au2Segment);

      for await (const readable of au2Segment.readableQueue) {
        await fs.writeFile(path.join(__dirname, 'testResult', `output${i}.ts`), readable);
        i++;
      }
    };
    await run();

    const analyze = async (j) => {
      const filePath = path.join(__dirname, 'testResult', `output${j}.ts`);
      const process = spawn('ffmpeg', `-v error -xerror -i ${filePath} -map 0:v:0 -f null -`.split(' '));

      const promise = new Promise((res, rej) => {
        process.on('close', (code) => {
          if (typeof code === 'number')res(code);
          else rej();
        });
      });

      const process2 = spawn('ffprobe', `-v warning -select_streams v:0 -count_frames -show_entries stream=nb_read_frames:format=duration -of json ${filePath}`.split(' '));

      const promise2 = new Promise((res, rej) => {
        process2.stderr.on('data', (data) => {
          console.log(data.toString());
        });
        process2.on('close', (code) => {
          if (typeof code === 'number')res(code);
          else rej();
        });
      });
      const promise3 = await Promise.all([promise, promise2]);
      return promise3[0];
    };

    for (let j = 0; j < i; j++) {
      const exitcode = await analyze(j);
      expect(exitcode).toBe(0);
    }
  }, 10000);
});
