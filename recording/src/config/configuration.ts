import { CronExpression } from "@nestjs/schedule"
import { RecordingConfigDTO } from "./dto/recordingConfig.DTO"
export default ()=>recordingConfig
const recordingConfig:RecordingConfigDTO={
    streams:["rtsp://210.99.70.120:1935/live/cctv001.stream"],
    targetDir:'C:/Users/dongdong/Documents/GitHub/Cam-Vault/storage/recordings',
    duration:CronExpression.EVERY_MINUTE,
    videoLen:10,
}