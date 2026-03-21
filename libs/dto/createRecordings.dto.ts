export class CreateRecordingDTO{
    readonly streams:string[]
    readonly time:cronTime
    readonly recordingLen:number
}

interface cronTime{
    second: string,
    minute: string,
    hour:string,
    day:string,
    month:string,
    week:string
}

interface TimeRange{
    start:Date,
    end:Date
}