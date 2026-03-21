import { exec, ExecException } from 'child_process'
import * as path from 'node:path'

export class RecordingUnit{
    //절대경로만 받음
    record(streams:string[],fileName:string,length:number,targetDir?:string):void {
        let inputString: string = ''
        let outputString: string = ''
        streams.forEach((streamURL, i) => {
            inputString += (`-rtsp_transport tcp -i ${streamURL} `)
            outputString += (`-map ${i} -c copy -t ${length} ${path.join(targetDir ?? __dirname,`camera${i}_${fileName}.ts`)} `)
        })

        exec(`ffmpeg -y ${inputString} ${outputString}`, (error: ExecException, stdout: string, stderr: string): void => {
            if (error) {
                console.log("error: %s", error)
                return
            }
            if (stderr) {
                console.log("log: %s", stderr)
            }
            console.log("encoding succeed: %s", stdout)
        })
    }
}

export function createRecordingFileName(start:Date,end:Date){
    const startLocale=start.toLocaleDateString("ko-KR",{timeZone: "Asia/Seoul"}).replace(/[ :.]/g,'')+start.toLocaleTimeString("ko-KR",{timeZone: "Asia/Seoul"}).replace(/[ :.]/g,'')
    const endLocale=end.toLocaleDateString("ko-KR",{timeZone: "Asia/Seoul"}).replace(/[ :.]/g,'')+end.toLocaleTimeString("ko-KR",{timeZone: "Asia/Seoul"}).replace(/[ :.]/g,'')
    return startLocale+'-'+endLocale
}
