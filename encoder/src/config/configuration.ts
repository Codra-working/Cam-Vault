const parseNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10)
    return Number.isNaN(parsed) ? fallback : parsed
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
    rabbitmq: {
        url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
        queue: process.env.ENCODING_QUEUE ?? 'encoding_queue',
    },
    targetDirectory: process.env.TARGET_DIRECTORY ?? 'C:/recordings/encoded',
})
