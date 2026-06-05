import { Inject, Injectable } from '@nestjs/common';
import * as path from 'node:path'
import { ClientProxy } from '@nestjs/microservices';
import { EncodingRequestDTO } from 'src/config/dto/encodingRequest.dto';
import { isFormatInputPathObject, VideoURL } from 'src/common/types/types';
import { FFMPEGBuilder } from './ffmpegBuilder/FFMPEGBuilder';
import { FFMPEGBuildSpec, linearRecordingBuildStrategy } from './ffmpegBuilder/FFMPEGBuilderStrategy';
import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { SignalConstants } from 'node:os';
import { DBService } from 'src/DB/DB.service';

type RecordingStatus = 'recording' | 'completed' | 'failed' | 'stopped'
type VideoFileExt = '.ts' | '.mp4' | '.mkv' | '.mov' | '.avi' | '.webm' | '.flv' | '.m3u8'
type RecordingSession = {
    id: string
    process: ChildProcessWithoutNullStreams
    buildSpec: FFMPEGBuildSpec
    startedAt: Date
    endedAt?: Date
    status: RecordingStatus
    exitCode?: number
    error?: Error
}

@Injectable()
export class RecordingService {
    private recordingSessions: Map<string, RecordingSession> = new Map()
    constructor(
        @Inject('RMQ_SERVICE')
        private producer: ClientProxy,
        private ffmpegBuilder: FFMPEGBuilder,
        private dbService:DBService
    ) { }



    createRecordingFileName(start: Date, end: Date) {
        const startLocale = start.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + start.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
        const endLocale = end.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '') + end.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" }).replace(/[ :.]/g, '')
        return startLocale + '-' + endLocale
    }



    createVideoOutputPaths(inputStreams: VideoURL[], targetDir: path.FormatInputPathObject, ext: VideoFileExt = '.ts', videoLen: number = 10): path.FormatInputPathObject[] {
        const length = inputStreams.length
        const start = new Date()
        const end = new Date(start.getTime() + videoLen * 1000)
        const VideoOutputPaths: path.FormatInputPathObject[] = Array(length).fill(null).map(() => ({ ...targetDir }))
        VideoOutputPaths.filter(x=>isFormatInputPathObject(x)).map((VideoOutputPath, i) => {
            VideoOutputPath.name = `camera${i}_${this.createRecordingFileName(start, end)}`
            VideoOutputPath.ext = ext
        })
        return VideoOutputPaths
    }



    registerRecordingSession(sessionID: string, process: ChildProcessWithoutNullStreams, ffmpegBuildSpec: FFMPEGBuildSpec) {
        const session: RecordingSession = {
            id: sessionID,
            process: process,
            buildSpec: ffmpegBuildSpec,
            startedAt: new Date(),
            status: 'recording'
        }
        this.recordingSessions.set(sessionID, session)
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

    getRecordingSession(sessionID: string) {
        return this.recordingSessions.get(sessionID)
    }


    record(inputStreams: VideoURL[], videoLen: number, targetDir: path.FormatInputPathObject) {
        const VideoOutputs = this.createVideoOutputPaths(inputStreams, targetDir, '.ts', videoLen)//create recording output file name
        const ffmpegBuildSpec: FFMPEGBuildSpec = {
            strategy: linearRecordingBuildStrategy,
            context: {
                inputs: inputStreams,
                outputs: VideoOutputs,
                videoLen: videoLen,
                codec: 'copy'
            },
        }


        //create seperate FFMPEG process and register a new recording session
        const ffmpeg = this.ffmpegBuilder
            .applyStrategy(ffmpegBuildSpec.strategy, ffmpegBuildSpec.context)
            .build()
        const sessionID = randomUUID()
        this.registerRecordingSession(sessionID, ffmpeg, ffmpegBuildSpec)


        //register event listner on ffmpeg
        ffmpeg.stderr.on("data", (data) => console.log(data.toString()))
        ffmpeg.stdout.on("data", (data) => console.log(data.toString()))
        ffmpeg.on("error", (err) => { throw err })
        ffmpeg.on("close", (code, signal) => {
            const session = this.getRecordingSession(sessionID)
            if (session === undefined) { console.log(`warning: session is missing: ${sessionID}`); return }
            session.endedAt = new Date()
            if (signal !== null) { session.error = new Error(`process terminated by: ${signal}`); session.status = 'failed'; return }
            if (code === null) { session.error = new Error("unknown error"); session.status = 'failed'; return }
            session.exitCode = code
            if (code !== 0) { session.error = new Error(`process exited with code: ${code}`); session.status = 'failed'; return }
            else {
                //recording success
                console.log("recording succeed")
                session.status = 'completed'
                //save video metadata to DB
                const videoFiles=session.buildSpec.context.outputs.filter((videoSource)=>isFormatInputPathObject(videoSource))
                videoFiles.forEach((file)=>this.dbService.save(path.format(file)))
                //emit DTO to broaker
                const encodingJobs = this.createEncodingRequestPayloads(VideoOutputs, 'libx264')//create encodingRequest payload
                this.emit('encoding_request', encodingJobs)
            }
        })
    }
}

