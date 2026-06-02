import { Inject, Injectable, OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config';
import { spawn, ExecException } from 'child_process'
import * as path from 'node:path'
import { firstValueFrom } from 'rxjs';
import { ClientProxy, Transport } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { FFMPEGBuilder } from 'src/common/utils/processBuilder/FFmpegProcessBuilder';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { isParsedPath, VideoURL } from 'src/common/types/types';

@Injectable()
export class RecordingService {
    constructor(
        @Inject('RMQ_SERVICE')
        private producer: ClientProxy,
        @Inject('FFMPEGBuilderFactory')
        private createFFMPEGBuilder
    ) { }

    record(inputStreams: VideoURL[], videoLen: number, targetDir: path.ParsedPath) {
        const start = new Date()
        const end = new Date(start.getTime() + videoLen * 1000)
        const fileName = createRecordingFileName(start, end)
        const fileList: path.ParsedPath[] = []
        const target: path.ParsedPath = targetDir
        const ffmpegBuilder = this.createFFMPEGBuilder()
        //팩토리 사용하면 좋음
        inputStreams.forEach((stream, i) => {
            //set input and output
            target.name = `camera${i}_${fileName}`
            target.ext = '.ts'
            
            //set options
            ffmpegBuilder.addGlobalOption('-rtsp_transport', 'tcp')
            ffmpegBuilder.addInputOption('-timeout', '5000000')
            ffmpegBuilder.addInputSrc(stream)

            ffmpegBuilder.addOutputOption('-map', i.toString(10))
            ffmpegBuilder.addOutputOption('-c', 'copy')
            ffmpegBuilder.addOutputOption('-t', videoLen.toString(10))
            ffmpegBuilder.addOutputSrc(target)
        })
        const outPutFileList: path.ParsedPath[] = ffmpegBuilder.getOutputSrcList().filter((src) => isParsedPath(src))
        //create FFMPEG process
        const ffmpeg = ffmpegBuilder.buildAndStart()


        ffmpeg.stderr.on("data", (data)=>console.log(data.toString()))
        ffmpeg.stdout.on("data", (data)=>console.log(data.toString()))
        ffmpeg.on("close", (code) => {
            if (code === 0)//emit
            {   //create encodingRequest payload
                const encodingJob = this.createEncodingRequestPayload(outPutFileList, 'libx264')
                //emit DTO to broaker
                this.producer.emit<EncodingRequestDTO>('encoding_request', encodingJob)
                console.log("recording succeed")
            } else throw new Error(`process exited with code: ${code}`)
        })
        ffmpeg.on("error",(err)=>{throw err})
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
