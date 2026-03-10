import {exec, ExecException} from 'child_process'

//인풋스트림을 ffmpeg에서 나누어서 넣어야됨
const inputFile:string='test.mp4'
const outputFile:string='test.mkv'
exec(`ffmpeg -y -i ${inputFile} -c copy ${outputFile}`,(error:ExecException,stdout:string,stderr:string):void=>{
    if(error){
        console.log("error: %s",error)
        return
    }
    if(stderr){
        console.log("log: %s",stderr)
    }
    console.log("encoding succeed: %s",stdout)
})