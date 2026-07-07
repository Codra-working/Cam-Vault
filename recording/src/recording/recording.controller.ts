import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RecordingConfigDTO } from 'src/config/dto/recordingConfig.DTO';
import { ConfigService } from '@nestjs/config';
import { CronExpression } from '@nestjs/schedule';

@Controller()
export class RecordingController {
    constructor(private readonly configService:ConfigService){}

    //RTSP URLS
    @MessagePattern({cmd:'get_RTSP_URLs'})
    getUrls(){
        return this.configService.get('streams')
    }

    @MessagePattern({cmd:'set_RTSP_URLs'})
    setUrls(RTSPURLs:string[]){
        this.configService.set('streams',RTSPURLs)
    }

    //Storage Directory
    @MessagePattern({cmd:'get_storage_directory'})
    getDirectory(){
        return this.configService.get('targetDir')
    }
    
    @MessagePattern({cmd:'set_storage_directory'})
    setDirectory(directoryPath:string){
        this.configService.set('targetDir',directoryPath)
    }

    //Recording Duration
    @MessagePattern({cmd:'get_recording_duration'})
    getRecordingDuration(){
        return this.configService.get('duration')
    }

    @MessagePattern({cmd:'set_recording_duration'})
    setRecordingDuration(duration:CronExpression){
        this.configService.set('duration',duration)
    }

    //Video Length
    @MessagePattern({cmd:'get_video_length'})
    getVideoLen(){
        return this.configService.get('videoLen')
    }

    @MessagePattern({cmd:'set_video_length'})
    setVideoLen(videoLen:Number){
        this.configService.set('videoLen',videoLen.toString())
        return {status:'ok',videoLen}
    }
}
