import { Type } from "../types/types"

/**
 * similar to Number.parseNum() but thorows an error when Non-Integer number or NaN is injected  
 * @param value a string which is going to parsed
 * @returns parsed integer
 */
export const parseToInteger = (value: string) => {
    const parsed = Number.parseFloat(value)
    if (Number.isNaN(parsed)) throw new Error("not a number")
    if (parsed !== Math.floor(parsed)) throw new Error("not an integer")
    return parsed
}

/**
 * takes RTSPURLs in string and returns array of parsed RTSPURLs  
 * @param value Serialized RTSP urls
 * @returns array of parsd RTSP urls
 */
export function parseStreams(value: string): string[] {
    try {
        return value
            .split(",")
            .map((stream) => stream.trim())
            .filter((stream) => (stream.length > 0))
            .map(stream => Type.toRtspUrl(stream))
    }
    catch (e) {
        throw e
    }
}
