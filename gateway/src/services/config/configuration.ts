import { TcpClientOptions, Transport } from "@nestjs/microservices"

const parseNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isNaN(parsed) ? fallback : parsed
}

const tcpClientOptions: TcpClientOptions = {
    transport: Transport.TCP,
    options: {
        host: process.env.RECORDING_SERVICE_HOST ?? 'localhost',
        port: parseNumber(process.env.RECORDING_SERVICE_PORT, 3001)
    }
}

export default () => ({
    db: {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseNumber(process.env.DB_PORT, 3306),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? 'root',
        database: process.env.DB_NAME ?? 'test',
        synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
    },
    recordingSvcOptions: tcpClientOptions,
    videoMetadataService: {
        baseUrl: process.env.VIDEO_METADATA_SERVICE_BASE_URL ?? 'http://localhost:8080/api/v1',
    }
})
