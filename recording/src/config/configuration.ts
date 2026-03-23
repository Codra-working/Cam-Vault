import { CronExpression } from "@nestjs/schedule"
import { RecordingConfigDTO } from "./dto/recordingConfig.DTO"

const parseNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isNaN(parsed) ? fallback : parsed
}

const parseStreams = (value: string | undefined) => {
    if (!value) {
        return ["rtsp://210.99.70.120:1935/live/cctv001.stream"]
    }

    return value
        .split(",")
        .map((stream) => stream.trim())
        .filter((stream) => stream.length > 0)
}

const recordingConfig: RecordingConfigDTO & {
    db: {
        host: string
        port: number
        username: string
        password: string
        database: string
        synchronize: boolean
    }
    rabbitmq: {
        url: string
        queue: string
    }
} = {
    streams: parseStreams(process.env.RECORDING_STREAMS),
    targetDir: process.env.TARGET_DIR ?? 'C:/Users/dongdong/Documents/GitHub/Cam-Vault/storage/recordings',
    duration: (process.env.RECORDING_CRON as CronExpression | undefined) ?? CronExpression.EVERY_MINUTE,
    videoLen: parseNumber(process.env.VIDEO_LENGTH, 10),
    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseNumber(process.env.DB_PORT, 3306),
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
