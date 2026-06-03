import { Inject, Injectable } from '@nestjs/common';
import * as path from 'node:path'
import { ClientProxy } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { VideoURL } from 'src/common/types/types';
import { FFMPEGBuilder } from './process-builder/FFmpegProcessBuilder';
import { linearMapping } from './process-builder/FFMPEGBuilderFactory';

@Injectable()
export class RecordingService {
    constructor(
        @Inject('RMQ_SERVICE')
        private producer: ClientProxy,
        private ffmpegBuilder: FFMPEGBuilder
    ) { }

    record(inputStreams: VideoURL[], videoLen: number, targetDir: path.FormatInputPathObject) {
        const start = new Date()
        const end = new Date(start.getTime() + videoLen * 1000)
        const fileName = createRecordingFileName(start, end)
        const length = inputStreams.length
        const targets: path.FormatInputPathObject[] = Array(length).fill(null).map(() => ({ ...targetDir }))


        //create recording output file name
        targets.map((target, i) => {
            target.name = `camera${i}_${fileName}`
            targets[i].ext = '.ts'
        })


        //create seperate FFMPEG process
        const ffmpeg = this.ffmpegBuilder
            .addRecordingMetadata(inputStreams, targets, videoLen)
            .useFactory(linearMapping)
            .build()



        //register event listner on ffmpeg
        ffmpeg.stderr.on("data", (data) => console.log(data.toString()))
        ffmpeg.stdout.on("data", (data) => console.log(data.toString()))
        ffmpeg.on("close", (code) => {
            if (code === 0)//emit
            {
                const encodingJobs = this.createEncodingRequestPayloads(targets, 'libx264')//create encodingRequest payload
                this.emit('encoding_request', encodingJobs)//emit DTO to broaker

                console.log("recording succeed")
            } else throw new Error(`process exited with code: ${code}`)
        })
        ffmpeg.on("error", (err) => { throw err })
    }

    /**
     * function where turns filePaths in to an array of EncodingRequest
     * @param filePaths 
     * @param videoCodec 
     */
    createEncodingRequestPayloads(filePaths: path.FormatInputPathObject[], videoCodec: string): EncodingRequestDTO[] {
        const ret: EncodingRequestDTO[] = []
        for (const filePath of filePaths) {
            ret.push({
                filePath: filePath,
                codec: videoCodec
            })
        }
        return ret
    }

    /**
     * emit event to broker
     * @param eventName Name of event to emit
     * @param jobs payloads that you want to send with this event
     */
    emit<DTO = EncodingRequestDTO>(eventName: string, jobs: DTO[]) {
        [...jobs].forEach((job) => this.producer.emit<DTO>(eventName, job))
    }

}

export function createRecordingFileName(start: Date, end: Date) {
    const startLocale = start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + start.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
    const endLocale = end.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + end.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
    return startLocale + '-' + endLocale
}
