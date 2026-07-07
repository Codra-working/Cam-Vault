import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RecordingService } from 'src/recording/recording.service';
import { CronJob } from 'cron';
import { ChildProcessWithoutNullStreams } from 'child_process';

@Injectable()
export class CronService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private recordingService: RecordingService,
    private configService: ConfigService,
  ) {}

  addRecordingJob() {
    const streams = this.configService.get('streams');
    const videoLen = this.configService.get('videoLen');
    const targetDirectory = this.configService.get('targetDirectory');
    const job = new CronJob(this.configService.get('duration')!, () => {
      this.recordingService.record(streams, videoLen, targetDirectory);
    });

    this.schedulerRegistry.addCronJob('recording_service', job);
    job.start();
  }
}
