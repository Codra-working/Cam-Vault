import { CronExpression } from "@nestjs/schedule";
import { ParsedPath } from "path";
export class RecordingConfigDTO{
    streams: string[];
    targetDir: ParsedPath;
    duration: CronExpression|undefined;
    videoLen: number;
}