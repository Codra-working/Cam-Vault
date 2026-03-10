import { exec, ExecException } from 'child_process'


//테스트
const now= new Date()
const response={
    streams:["rtsp://210.99.70.120:1935/live/cctv001.stream","rtsp://210.99.70.120:1935/live/cctv002.stream","rtsp://210.99.70.120:1935/live/cctv003.stream","rtsp://210.99.70.120:1935/live/cctv004.stream"],
    time:{
        start:now.toISOString().replace(/[:.TZ]/g, "-"),
        end:now.toISOString().replace(/[:.TZ]/g, "-"),
    }
}
function record(response) {
    const streams: Array<string> = response.streams
    const start = response.time.start
    const end = response.time.end
    let inputString: string = ''
    let outputString: string = ''

    streams.forEach((streamURL, i) => {
        inputString += (`-rtsp_transport tcp -i ${streamURL} `)
        outputString += (`-map ${i} -c copy -t 20 video${i}${start}${end}.ts `)
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
    }
    )
}
record(response)