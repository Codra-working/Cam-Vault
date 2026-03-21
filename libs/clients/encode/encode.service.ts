import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as amqp from 'amqplib'
import {Connection,Channel} from 'amqplib'
@Injectable()
export class EncodeService {
    async encode(fileName:string){
        const connection:Connection= await amqp.connect('amqp://localhost')
        const channel:Channel= await connection.createChannel()
        const queueName:string='encoding_queue'
        await channel.assertQueue(queueName, {
            durable:false
        })
        const result:boolean=channel.sendToQueue(queueName,Buffer.from(fileName))
        console.log("encoding request sended: $s", fileName)
        return result
    }
}