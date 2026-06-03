import { Inject, Injectable } from "@nestjs/common"
import { ProcessBuilder } from "./ProcessBuilder"
import { ChildProcessWithoutNullStreams } from "child_process"
import { ParsedPath } from "path"
import * as path from 'path'
import { RTSPURL } from "src/common/types/types"
import { URL } from "url"
import { FFMPEGBuilderFactory } from "./FFMPEGBuilderFactory"


export type VideoSource = path.FormatInputPathObject | URL | RTSPURL
export type output = {
    options: Map<string, string>
    source: VideoSource
}
export type input = output


@Injectable()
export class FFMPEGBuilder extends ProcessBuilder {
    private globalOptions = this.args
    private filterOptions: Map<string, string> = new Map()
    private input: input = { options: new Map(), source: path.parse('') }
    private inputs: input[] = []
    private output: output = { options: new Map(), source: path.parse('') }
    private outputs: output[] = []
    protected factory: FFMPEGBuilderFactory | undefined = undefined
    protected FFMMPEGMetadata
    protected inputStreams: VideoSource[]
    protected outputStreams: VideoSource[]
    protected videoLen: number


    constructor() {
        super()
        this.setCommand('ffmpeg')

    }
    addRecordingMetadata(inputStreams, outputStreams, videoLen) {
        this.inputStreams = inputStreams
        this.outputStreams = outputStreams
        this.videoLen = videoLen
        return this
    }


    useFactory(factory: FFMPEGBuilderFactory) {//interface를 정해야됨
        this.factory = factory
        return this
    }

    getOutputSrcList(): VideoSource[] {
        const ret: VideoSource[] = []
        for (const output of this.outputs) ret.push(output.source)
        return ret
    }

    addGlobalOption = super.addOption

    addInputOption(key: string, value: string): FFMPEGBuilder {
        this.input.options.set(key, value)
        return this
    }

    addInputSrc(source: VideoSource) {
        this.input.source = cloneVideoSource(source)
        this.inputs.push(this.input)
        this.input = { options: new Map(), source: path.parse('') }
        return this
    }

    addFilterOption(key: string, value: string): FFMPEGBuilder {
        this.filterOptions.set(key, value)
        return this
    }

    addOutputOption(key: string, value: string): FFMPEGBuilder {
        this.output.options.set(key, value)
        return this
    }

    addOutputSrc(target: VideoSource): FFMPEGBuilder {
        this.output.source = cloneVideoSource(target)
        this.outputs.push(this.output)
        this.output = { options: new Map(), source: path.parse('') }
        return this
    }

    private flattenInput() {
        for (const input of this.inputs) {
            let temp: string[] = []
            // if (isParsedPath(input.source)) {
            //     temp = Array.from(input.options).flat(1).concat(['-i', path.format(input.source)])
            // } else {
            temp = Array.from(input.options).flat(1).concat(['-i', input.source.toString()])
            // }
            this.flattenedArgs = this.flattenedArgs.concat(temp)
        }
    }

    private flattenOutput() {
        for (const output of this.outputs) {
            let temp: string[] = []
            if (output.source instanceof URL) {
                temp = Array.from(output.options).flat(1).concat([output.source.toString()])
            }
            else {
                temp = Array.from(output.options).flat(1).concat([path.format(output.source as ParsedPath)])
            }
            this.flattenedArgs = this.flattenedArgs.concat(temp)
        }
    }

    protected flatten() {
        this.flattenedArgs.push('-y')
        this.flattenInput()
        this.flattenedArgs=this.flattenedArgs.concat(Array.from(this.globalOptions).flat(1))
        this.flattenedArgs=this.flattenedArgs.concat(Array.from(this.filterOptions).flat(1))
        this.flattenOutput()
    }

    build() {
        if (this.factory !== undefined) return this.factory(this, this.inputStreams, this.outputStreams, this.videoLen).build()
    }


}

function cloneVideoSource(src: VideoSource): VideoSource {
    if (typeof src === 'string') {
        return src
    } else if (src instanceof URL) {
        return new URL(src.toString())
    } else {//src===parsedPath
        return { ...src }
    }
}
