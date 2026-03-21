import { CronExpression } from "@nestjs/schedule"
import { RecordingConfigDTO } from "./dto/recordingConfig.DTO"
export default ()=>recordingConfig
const recordingConfig:RecordingConfigDTO={
    streams:["rtsp://admin:123456@1.248.116.46:5540/stream0","rtsp://admin:123456@1.248.116.46:5541/stream0","rtsp://admin:123456@1.248.116.46:5542/stream0"],
    targetDir:'C:/Users/dongdong/Documents/GitHub/Cam-Vault/storage/recordings',
    duration:CronExpression.EVERY_MINUTE,
    videoLen:10,
}