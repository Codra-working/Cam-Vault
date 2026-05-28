import { CronExpression } from "@nestjs/schedule";
import { ParsedPath } from "path";
export class RecordingConfigDTO{
    streams: string[];
    parsedTargetPath: ParsedPath;
    duration: CronExpression|undefined;
    videoLen: number;
}