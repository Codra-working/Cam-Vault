import { CronExpression } from "@nestjs/schedule";
import { ParsedPath } from "path";
export class RecordingConfigDTO{
    streams: string[];
    targetDirectory: Partial<ParsedPath>;
    duration: CronExpression|undefined;
    videoLen: number;
}