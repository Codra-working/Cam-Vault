import { isFormatInputPathObject, isRTSPURL, Type } from "./types"

describe('Type.toRtspUrl', () => {
    const valid = [
        "rtsp://user:pass@example.com:8554/path",
        "rtsp://192.168.0.10:554/live/stream1",
        "rtsp://admin:1234@192.168.1.20:8554/camera",
        "rtsp://user:password@203.0.113.15:554/h264/ch1/main/av_stream",
        "rtsp://192.168.10.50:554/streaming/channel/2",
        "rtsp://viewer:viewer123@10.0.0.5:8554/live.sdp",
        "rtsp://camera01.local:554/rtsp/video",
        "rtsp://192.168.100.25:554/ch0_0.h264",
        "rtsp://admin:admin@172.16.0.30:554/axis-media/media.amp",
        "rtsp://10.1.1.40:8554/stream=0",
        "rtsp://user:pass@198.51.100.22:554/live/ch00_0",
    ]
    const invalid: any[] = [
        "",
        null,
        undefined,
        NaN,
        123,
        true,
        {},
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_VALUE,
        Number.MIN_VALUE
    ]
    test.each(valid)('should accept valid RTSP URL: %s', (valid) => {
        expect(() => { Type.toRtspUrl(valid) }).not.toThrow()
    })
    test.each(invalid)('should throw for invalid RTSP URL input: %p', (invalid) => {
        expect(() => { Type.toRtspUrl(invalid) }).toThrow("invalid RTSP URL")
    })
})

describe('isRTSPURL', () => {
    const valid = [
        "rtsp://user:pass@example.com:8554/path",
        "rtsp://192.168.0.10:554/live/stream1",
    ]
    const invalid = [
        "",
        "http://example.com/video",
        null,
        undefined,
        123,
        true,
        {},
    ]

    test.each(valid)('should accept valid RTSP URL: %s', (value) => {
        expect(isRTSPURL(value)).toBe(true)
    })

    test.each(invalid)('should reject invalid RTSP URL input: %p', (value) => {
        expect(isRTSPURL(value)).toBe(false)
    })
})

describe('isFormatInputPathObject', () => {
    const valid = [
        { dir: 'videos' },
        { base: 'recording.ts' },
        { root: 'C:\\', dir: 'C:\\videos', name: 'camera1', ext: '.ts' },
        { dir: undefined, name: 'camera1' },
    ]
    const invalid = [
        '',
        null,
        undefined,
        123,
        true,
        [],
        {},
        { dir: 123 },
        { base: null },
        { foo: 'bar' },
        { dir: 'videos', foo: 'bar' },
    ]

    test.each(valid)('should accept path format input object: %p', (value) => {
        expect(isFormatInputPathObject(value)).toBe(true)
    })

    test.each(invalid)('should reject non path format input object: %p', (value) => {
        expect(isFormatInputPathObject(value)).toBe(false)
    })
})
