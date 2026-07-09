import { parseToInteger, parseStreams } from './parse';
import { Type, RTSPURLSample } from '../types/types';

// configuring testcase
const integer: number[] = [
  -1000,
  -1,
  0,
  1,
  42,
  1000,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
];
const realNumber: number[] = [Number.MIN_VALUE, 0.1, -1.5];

// running actual test
describe('parseToInteger', () => {
  test.each(integer)(
    'should return an integer for integer input: %p',
    (valid) => {
      expect(parseToInteger(valid.toString())).toBe(valid);
    },
  );
  test.each(realNumber)(
    'should throw for non-integer numeric input: %p',
    (valid) => {
      expect(() => {
        parseToInteger(valid.toString());
      }).toThrow('not an integer');
    },
  );
  test('should throw when input is NaN', () => {
    expect(() => {
      parseToInteger(NaN.toString());
    }).toThrow('not a number');
  });
});

describe('parseStreams', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should return RTSP URL array when input is valid', () => {
    jest.spyOn(Type, 'toRtspUrl').mockImplementation(() => {
      return RTSPURLSample;
    });
    expect(
      parseStreams(
        'rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0',
      ),
    ).toEqual([RTSPURLSample]);
  });

  test('should throw when RTSP URL is invalid', () => {
    jest.spyOn(Type, 'toRtspUrl').mockImplementation(() => {
      throw new Error('invalid RTSP URL');
    });
    expect(() => {
      parseStreams(
        'rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0',
      );
    }).toThrow('invalid RTSP URL');
  });
});
