import { FormatInputPathObject } from 'node:path';

export type VideoURL = RTSPURL;
export type RTSPURL = string & { __brand: RTSPURL };
export class Type {
  private static RTSP_REGREX =
    /^rtsp:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:/]+)(?::(\d+))?(\/.*)?$/;
  constructor() {}
  /**
   * checks if provided url is valid and convert url type to RtspUrl throw an Error if its not valid
   * @param url RTSPURL in string type
   * @returns RTSPURL in RtspUrl type
   */
  static toRtspUrl(url: string) {
    if (!this.RTSP_REGREX.test(url)) {
      throw new Error('invalid RTSP URL');
    }
    return url as RTSPURL;
  }
}
export const RTSPURLSample = Type.toRtspUrl(
  'rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0',
);

export function isRTSPURL(v: unknown): v is RTSPURL {
  if (typeof v !== 'string') return false;

  try {
    Type.toRtspUrl(v);
    return true;
  } catch {
    return false;
  }
}

const FORMAT_INPUT_PATH_OBJECT_KEYS = [
  'root',
  'dir',
  'base',
  'ext',
  'name',
] as const;
type FormatInputPathObjectKey = (typeof FORMAT_INPUT_PATH_OBJECT_KEYS)[number];

function isFormatInputPathObjectKey(
  key: string,
): key is FormatInputPathObjectKey {
  return (FORMAT_INPUT_PATH_OBJECT_KEYS as readonly string[]).includes(key);
}

export function isFormatInputPathObject(
  v: unknown,
): v is FormatInputPathObject {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;

  const entries = Object.entries(v as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, value]) =>
        isFormatInputPathObjectKey(key) &&
        (value === undefined || typeof value === 'string'),
    )
  );
}
export type Constructor = new (...args: any[]) => any;
export function isConstructor(value: unknown): value is Constructor {
  if (typeof value !== 'function') {
    return false;
  }
  try {
    Reflect.construct(String, [], value);
    return true;
  } catch (e) {
    return false;
  }
}
