export type VideoURL = RTSPURL
export type RTSPURL = string & { __brand: RTSPURL };
export class Type { 
    private static RTSP_REGREX = /^rtsp:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:/]+)(?::(\d+))?(\/.*)?$/;
    constructor(){}
    /**
     * checks if provided url is valid and convert url type to RtspUrl throw an Error if its not valid
     * @param url RTSPURL in string type
     * @returns RTSPURL in RtspUrl type
     */
    static toRtspUrl(url: string) {
        if (!this.RTSP_REGREX.test(url)) {
            throw new Error("invalid RTSP URL")
        }
        return url as RTSPURL
    }
}
export const RTSPURLSample=Type.toRtspUrl("rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0")

import { FormatInputPathObject } from "node:path";


const FORMAT_INPUT_PATH_OBJECT_KEYS = ['root', 'dir', 'base', 'ext', 'name'] as const

export function isFormatInputPathObject(v: unknown): v is FormatInputPathObject {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false

  const candidate = v as Record<string, unknown>
  return (
    FORMAT_INPUT_PATH_OBJECT_KEYS.some((key) => candidate[key] !== undefined) &&
    FORMAT_INPUT_PATH_OBJECT_KEYS.every(
      (key) => candidate[key] === undefined || typeof candidate[key] === "string"
    )
  )
}
