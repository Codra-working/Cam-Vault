import { CronExpression } from "@nestjs/schedule";
export class RecordingConfigDTO{
    streams: string[];
    targetDir: string;
    duration: CronExpression;
    videoLen: number;
}