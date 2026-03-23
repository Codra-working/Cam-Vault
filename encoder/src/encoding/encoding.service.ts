import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import path from 'path';


@Injectable()
export class EncodingService {
    encode(fileName: string, codec: string, fileFormat: string, targetDir: string): Promise<string> {
        let ffmpeg;
        const args = ['-i',  fileName, '-map', '0:v', '-c:v', codec, path.join(targetDir, `${path.basename(fileName).split('.')[0]}.${fileFormat}`)]
        ffmpeg = spawn('ffmpeg', args)
        console.log("Running command",['ffmpeg'].concat(args).join(' '))

        const logs: string[] = []
        const collect = (data: any) => logs.push(data.toString())
        return new Promise((resolve, reject) => {
            ffmpeg.stderr.on("data", collect)
            ffmpeg.stdout.on("data", collect)
            ffmpeg.on('error', (err) => {
                console.log('Encoding failed')
                console.log('Encoding error: ',err)
                reject(err.message)
            })
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log("Encoding Succeed")
                    resolve(logs.join(''))
                } else {
                    console.log('Encoding failed')
                    reject(`Encoding error: ${code}`)
                }
            })
        })
    }
}
