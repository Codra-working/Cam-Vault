import { Inject, Injectable, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config';
import { spawn, ExecException } from 'child_process'
import * as path from 'node:path'
import { firstValueFrom } from 'rxjs';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { DBService } from 'src/DB/DB.service';


@Injectable()
export class RecordingService {
    constructor(
        @Inject('RMQ_SERVICE')
        private client: ClientProxy,
        private videoRecord:DBService
    ) { }

    //절대경로만 받음
    record(streams: string[], videoLen: number, targetDir: string): Promise<string> {
        const start = new Date()
        const end = new Date(start.getTime() + videoLen * 1000)
        const fileName = createRecordingFileName(start, end)
        const fileList: string[] = []

        let inputOption: string[] = []
        inputOption.push('-y')
        streams.forEach((streamURL, i) => {
            const absFilePath = path.join(targetDir ?? process.cwd(), `camera${i}_${fileName}.ts`)
            inputOption=inputOption.concat(['-rtsp_transport', 'tcp','-timeout', '5000000','-i', streamURL,'-map', i.toString(10), '-c', 'copy','-t', videoLen.toString(10),absFilePath])
            fileList.push(absFilePath)
        })

        return new Promise( (resolve, reject) => {
            const logs: string[] = []
            const ffmpeg = spawn('ffmpeg', inputOption)

            const collect = (data: any) => logs.push(data.toString())
            ffmpeg.stderr.on("data", collect)
            ffmpeg.stdout.on("data", collect)
            ffmpeg.on("error", async(err) => {
                reject(err.message)});
            ffmpeg.on('close', async (code) => {
                const result = logs.join('\n')
                if (code === 0) {
                    for (const val of fileList) {
                        const payload: EncodingRequestDTO = {
                            absFilePath: val,
                            fileFormat: 'ts',
                            codec: 'libx264'
                        }
                        this.client.emit<any,EncodingRequestDTO>('encoding_request', payload)
                    }
                    resolve(result)
                } else {

                    reject(result)
                }
            })
        })
    }
}

export function createRecordingFileName(start: Date, end: Date) {
    const startLocale = start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + start.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
    const endLocale = end.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + end.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
    return startLocale + '-' + endLocale
}
