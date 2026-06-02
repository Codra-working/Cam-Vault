import { ChildProcessWithoutNullStreams } from "child_process"
import { spawn } from "child_process"

export class ProcessBuilder {
    protected command: string = ""
    protected args: Map<string, string> = new Map()
    protected flattenedArgs:string[]=[]
    setCommand(command: string) {
        this.command = command
        return this
    }
    addOption(key: string, value: string) {
        this.args.set(key, value)
        return this
    }
    protected flatten(){
        this.flattenedArgs=Array.from(this.args).flat(2)
    }
    build(): ChildProcessWithoutNullStreams {
        this.flatten()
        console.log(`running ${this.command} ${this.flattenedArgs}`)
        return spawn(this.command, this.flattenedArgs)
    }
}