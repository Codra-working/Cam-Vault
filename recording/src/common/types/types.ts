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
export const RTSPURLSample: RTSPURL = Type.toRtspUrl(
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
