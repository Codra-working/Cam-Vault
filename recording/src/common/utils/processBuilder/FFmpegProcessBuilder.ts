import { ProcessBuilder } from "./ProcessBuilder"
import { ChildProcessWithoutNullStreams } from "child_process"
import { ParsedPath } from "path"
import * as path from 'path'
import { isParsedPath, RTSPURL } from "src/common/types/types"
import { URL } from "url"

type VideoSource = ParsedPath | URL |RTSPURL
type output = {
    options: Map<string, string>
    source: VideoSource
}
type input = output
export const FFMPEGBuilderFactory=function(){return new FFMPEGBuilder()}

export class FFMPEGBuilder extends ProcessBuilder {
    private globalOptions = this.args
    private filterOptions: Map<string, string> = new Map()
    private input: input = { options: new Map(), source: path.parse('') }
    private inputs: input[] = []
    private output: output = { options: new Map(), source: path.parse('') }
    private outputs: output[] = []


    constructor(){
        super()
        this.setCommand('ffmpeg')
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
        this.input.source = source
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
        this.output.source = target
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
            this.flattenedArgs=this.flattenedArgs.concat(temp)
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
            this.flattenedArgs=this.flattenedArgs.concat(temp)
        }
    }

    protected flatten() {
        this.flattenedArgs.push('-y')
        this.flattenInput()
        this.flattenedArgs.concat(Array.from(this.globalOptions).flat(1))
        this.flattenedArgs.concat(Array.from(this.filterOptions).flat(1))
        this.flattenOutput()
    }

}