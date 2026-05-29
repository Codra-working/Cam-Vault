import { Inject, Injectable, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config';
import { spawn, ExecException } from 'child_process'
import * as path from 'node:path'
import { firstValueFrom } from 'rxjs';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';


@Injectable()
export class RecordingService {
    constructor(
        @Inject('RMQ_SERVICE')
        private producer: ClientProxy,
    ) { }

    //절대경로만 받음
    record(streams: string[], videoLen: number, parsedTargetPath: path.ParsedPath): Promise<string> {
        const start = new Date()
        const end = new Date(start.getTime() + videoLen * 1000)
        const fileName = createRecordingFileName(start, end)
        const fileList: path.ParsedPath[] = []

        let inputOption: string[] = []
        inputOption.push('-y')
        streams.forEach((streamURL, i) => {
            const absFilePath = path.join(parsedTargetPath.dir ?? process.cwd(), `camera${i}_${fileName}.ts`) //targetDir==undefind 검토 process 
            inputOption = inputOption.concat(['-rtsp_transport', 'tcp', '-timeout', '5000000', '-i', streamURL, '-map', i.toString(10), '-c', 'copy', '-t', videoLen.toString(10), absFilePath])
            fileList.push(path.parse(absFilePath))
        })

        return new Promise((resolve, reject) => {
            const logs: string[] = []
            const ffmpeg = spawn('ffmpeg', inputOption)
            const collect = (data: any) => logs.push(data.toString())

            ffmpeg.stderr.on("data", collect)
            ffmpeg.stdout.on("data", collect)

            ffmpeg.on('close', async (code) => {
                const result = logs.join('\n')
                if (code === 0) {
                    //create EncodingRequestPayload
                    const encodingJob = this.createEncodingRequestPayload(fileList, 'libx264')
                    //emit DTO to RMQ
                    this.emit<EncodingRequestDTO>('encoding_request', encodingJob)
                    resolve(result)
                } else {
                    reject(new Error(code?.toString()))
                }
            })

            ffmpeg.on("error", async (err:Error) => {
                reject(err)
            });
        })
    }

    /**
     * function where turns filePaths in to an array of EncodingRequest
     * @param filePaths 
     * @param videoCodec 
     */
    createEncodingRequestPayload(filePaths: path.ParsedPath[], videoCodec: string): EncodingRequestDTO[] {
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
     * emit event to producer
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
