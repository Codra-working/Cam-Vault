import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RecordingService } from 'src/recording/recording.service';
import { CronJob } from 'cron';


@Injectable()
export class CronService implements OnApplicationBootstrap{
    constructor(private schedulerRegistry: SchedulerRegistry,
                private recordingService:RecordingService,
                private configService:ConfigService){}
    
    addRecordingJob(){
        const streams=this.configService.get('streams')
        const videoLen=this.configService.get('videoLen')
        const parsedTargetPath=this.configService.get('parsedTargetPath')
        const job = new CronJob(this.configService.get('duration')!,async ()=>{
            try{
                const result = await this.recordingService.record(streams,videoLen,parsedTargetPath)
                console.log(result)
            }catch(err){
                console.error(err)
            }
        })
        this.schedulerRegistry.addCronJob('recording_service',job)
        job.start()
    }

    onApplicationBootstrap() {
        return this.addRecordingJob()
    }
}
