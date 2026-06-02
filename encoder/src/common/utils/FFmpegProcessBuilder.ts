import { ProcessBuilder } from "./ProcessBuilder"
import { ChildProcessWithoutNullStreams } from "child_process"
import { ParsedPath } from "path"
import * as path from 'path'
import { Url } from "url"


type output ={
    options: Map<string, string>
    location: ParsedPath|URL
}
type input=output
export class FFMpegBuilder extends ProcessBuilder {
    private globalOptions = this.args
    private filterOptions: Map<string, string> = new Map()
    private input: input={options: new Map(),location:path.parse('')}
    private inputs: input[]=[]
    private output: output = { options: new Map(), location: path.parse('') }
    private outputs: output[] = []


    addGlobalOption = super.addOption

    addInputOption(key:string,value:string):FFMpegBuilder{
        this.input.options.set(key,value)
        return this
    }

    addInputSrc(source:ParsedPath|URL){
        this.input.location =source
        this.inputs.push(this.input)
        this.input = { options: new Map(), location:path.parse('') }
        return this
    }

    addFilterOption(key: string, value: string): FFMpegBuilder {
        this.filterOptions.set(key, value)
        return this
    }

    addOutputOption(key: string, value: string): FFMpegBuilder {
        this.output.options.set(key, value)
        return this
    }

    addOutputSrc(target: ParsedPath|URL): FFMpegBuilder {
        this.output.location = target
        this.outputs.push(this.output)
        this.output = { options: new Map(), location:path.parse('') }
        return this
    }
    private flattenInput(){
        for (const input of this.inputs) {
            if(isParsedPath)
            path.format
            const temp = Array.from(input.options).flat(1).concat(['-i',path.format(input.location)])
            this.flattenedArgs.concat(temp)
        }
    }
    private flattenOutput(){
        for (const output of this.outputs) {
            const temp = Array.from(output.options).flat(1).concat([path.format(output.location)])
            this.flattenedArgs.concat(temp)
        }
    }
    protected flatten() {
        this.flattenInput()
        this.flattenedArgs.concat(Array.from(this.globalOptions).flat(1))
        this.flattenedArgs.concat(Array.from(this.filterOptions).flat(1))
        this.flattenOutput()
    }

}