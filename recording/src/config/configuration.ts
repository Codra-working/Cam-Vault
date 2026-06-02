import { CronExpression } from "@nestjs/schedule"
import { RecordingConfigDTO } from "./dto/recordingConfig.DTO"
import { DatabaseInfoDto } from "./dto/databaseInfo.dto"
import { RmqInfoDTO } from "./dto/rmqInfo.dto"
import path from "path"
import {parseToInteger,parseStreams} from "../common/utils/parse"



//나중에 디폴트값 분리

const recordingConfig: RecordingConfigDTO & { db: DatabaseInfoDto } & { rabbitmq: RmqInfoDTO } = {
    streams: parseStreams(process.env.RECORDING_STREAMS ?? "rtsp://210.99.70.120:1935/live/cctv001.stream"),//url 검사
    targetDirectory: {dir:(process.env.TARGET_DIR?? path.join(process.cwd(),'storage'))},//path 검사
    duration: CronExpression.EVERY_MINUTE,
    videoLen: parseToInteger(process.env.VIDEO_LENGTH??"10"),
    db: {
        host: process.env.DB_HOST ?? 'localhost',//url 검사
        port: parseToInteger(process.env.DB_PORT??"0"),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? 'root',
        database: process.env.DB_NAME ?? 'test',
        synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
        queue: process.env.ENCODING_QUEUE ?? 'encoding_queue',
    }
}

export default () => recordingConfig
