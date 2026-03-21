import { TcpClientOptions, Transport } from "@nestjs/microservices"

export default ()=>({
    recordingSvcOptions:tcpClientOptions
})

const tcpClientOptions :TcpClientOptions={
    transport:Transport.TCP,
    options:{
        host:'localhost',
        port: 3001
    }
}