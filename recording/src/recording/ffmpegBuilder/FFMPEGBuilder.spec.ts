import { spawn } from "child_process"
import { EventEmitter } from "node:events"
import { RTSPURLSample } from "src/common/types/types"
import { FFMPEGBuilder, Options } from "./FFMPEGBuilder"
import { FFMPEGBuildContext, FFMPEGBuildStrategy } from "./FFMPEGBuilderStrategy"

jest.mock("child_process", () => ({
    spawn: jest.fn(),
}))

const spawnMock = spawn as unknown as jest.Mock

function createMockProcess() {
    return Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
    })
}

function createOptions(entries: [string, string][]): Options {
    return new Map(entries)
}

describe("FFMPEGBuilder", () => {
    beforeEach(() => {
        spawnMock.mockReturnValue(createMockProcess())
    })

    afterEach(() => {
        jest.resetAllMocks()
    })

    test("option registration methods should be chainable", () => {
        const builder = new FFMPEGBuilder()
        const options = createOptions([["-c", "copy"]])

        expect(builder.addGlobalOption("-loglevel", "error")).toBe(builder)
        expect(builder.addFilterOption("-filter_complex", "[0:v]scale=1280:720")).toBe(builder)
        expect(builder.addInputSpec(RTSPURLSample, options)).toBe(builder)
        expect(builder.addOutputSpec({ base: "camera0.ts" }, options)).toBe(builder)
    })

    test("build() should spawn ffmpeg with registered options and video sources", () => {
        const process = createMockProcess()
        spawnMock.mockReturnValue(process)

        const builder = new FFMPEGBuilder()
            .addGlobalOption("-loglevel", "error")
            .addInputSpec(
                RTSPURLSample,
                createOptions([
                    ["-rtsp_transport", "tcp"],
                    ["-timeout", "5000000"],
                ]),
            )
            .addFilterOption("-filter_complex", "[0:v]scale=1280:720")
            .addOutputSpec(
                { base: "camera0.ts" },
                createOptions([
                    ["-map", "0"],
                    ["-c", "copy"],
                    ["-t", "10"],
                ]),
            )

        expect(builder.build()).toBe(process)
        expect(spawnMock).toHaveBeenCalledTimes(1)

        const [command, args] = spawnMock.mock.calls[0] as [string, string[]]
        expect(command).toBe("ffmpeg")
        expect(args).toEqual([
            "-loglevel",
            "error",
            "-rtsp_transport",
            "tcp",
            "-timeout",
            "5000000",
            "-i",
            RTSPURLSample,
            "-filter_complex",
            "[0:v]scale=1280:720",
            "-map",
            "0",
            "-c",
            "copy",
            "-t",
            "10",
            "camera0.ts",
        ])
        expect(args.indexOf("-rtsp_transport")).toBeLessThan(args.indexOf("-i"))
        expect(args[args.indexOf("-i") + 1]).toBe(RTSPURLSample)
    })

    test("build() should add -i only to input sources", () => {
        const builder = new FFMPEGBuilder()
            .addInputSpec(RTSPURLSample, createOptions([["-rtsp_transport", "tcp"]]))
            .addOutputSpec({ base: "camera0.ts" }, createOptions([["-c", "copy"]]))

        builder.build()

        const [, args] = spawnMock.mock.calls[0] as [string, string[]]
        expect(args).toEqual([
            "-rtsp_transport",
            "tcp",
            "-i",
            RTSPURLSample,
            "-c",
            "copy",
            "camera0.ts",
        ])
        expect(args[args.indexOf("camera0.ts") - 1]).not.toBe("-i")
    })

    test("build() should keep input prefixes when called more than once", () => {
        const builder = new FFMPEGBuilder()
            .addInputSpec(RTSPURLSample, createOptions([["-rtsp_transport", "tcp"]]))
            .addOutputSpec({ base: "camera0.ts" }, createOptions([["-c", "copy"]]))

        builder.build()
        builder.build()

        const [, secondBuildArgs] = spawnMock.mock.calls[1] as [string, string[]]
        expect(secondBuildArgs).toEqual([
            "-rtsp_transport",
            "tcp",
            "-i",
            RTSPURLSample,
            "-c",
            "copy",
            "camera0.ts",
        ])
    })

    test("applyStrategy() should call the provided strategy with builder and context", () => {
        const builder = new FFMPEGBuilder()
        const context: FFMPEGBuildContext = {
            inputs: [RTSPURLSample],
            outputs: [{ base: "camera0.ts" }],
            videoLen: 10,
            codec: "copy",
        }
        const strategy: jest.MockedFunction<FFMPEGBuildStrategy> = jest.fn((builder, _context) => builder)

        expect(builder.applyStrategy(strategy, context)).toBe(builder)
        expect(strategy).toHaveBeenCalledTimes(1)
        expect(strategy).toHaveBeenCalledWith(builder, context)
    })
})
