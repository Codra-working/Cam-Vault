import {Body, Controller,Get, Inject, Put} from "@nestjs/common";
import type { RecordingConfigDTO } from "./recordingConfig.DTO";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";

@Controller('recording')
export class RecordingController{
    constructor(@Inject('RECORDING_SERVICE') private client:ClientProxy,
){}
    @Get('config')
    async getRecordingConfig(){
        const recordingConfig:RecordingConfigDTO={
            streams:await lastValueFrom(this.client.send({cmd:'get_RTSP_URLs'},{})),
            targetDir:await lastValueFrom(this.client.send({cmd:'get_storage_directory'},{})),
            duration:await lastValueFrom(this.client.send({cmd:'get_recording_duration'},{})),
            videoLen:await lastValueFrom(this.client.send({cmd:'get_video_length'},{}))
        }
        return recordingConfig
    }
    //아직 활성화 안됨
    @Put('config')
    updateRecordingConfig(@Body() recording_config_dto:RecordingConfigDTO){
        const pattern={cmd:'update_recording_config'}
        const payload=recording_config_dto
        return this.client.send(pattern,payload)
    }
    @Get()
    getVideoList(){
        return 
    }
}