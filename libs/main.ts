import {CreateRecordingDTO} from './dto/createRecordings.dto'
import { RecordingUnit,createRecordingFileName } from './recording'
import cron from 'node-cron'
import * as path from 'node:path'
const t1:Date= new Date()
const t2:Date= new Date(t1.getTime())
t2.setSeconds(t1.getSeconds()+10)
const testRequest:CreateRecordingDTO={
    streams:["rtsp://210.99.70.120:1935/live/cctv001.stream","rtsp://210.99.70.120:1935/live/cctv002.stream","rtsp://210.99.70.120:1935/live/cctv003.stream","rtsp://210.99.70.120:1935/live/cctv004.stream"],
    time:{
            second: '0',
            minute: '*',
            hour:'*',
            day:'*',
            month:'*',
            week:'*'
        },
    recordingLen:10
    }


const expression=`${testRequest.time.second} ${testRequest.time.minute} ${testRequest.time.hour} ${testRequest.time.day} ${testRequest.time.month} ${testRequest.time.week}`
let recorder:RecordingUnit

cron.schedule(expression,function(){
    const start:Date = new Date()
    const end:Date = new Date(start.getTime()+testRequest.recordingLen*1000)
    
    recorder= new RecordingUnit()
    recorder.record(testRequest.streams,createRecordingFileName(start,end),testRequest.recordingLen,'C:/Users/dongdong/Documents/GitHub/Cam-Vault/apps/storage-server/recordings')
})