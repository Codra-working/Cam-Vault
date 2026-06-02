import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { FFMpegBuilder } from 'src/common/utils/FFmpegProcessBuilder';
import path from 'path';


@Injectable()
export class EncodingService {
    async encode(fileName: string, codec: string, fileFormat: string, targetDir: string): Promise<string> {
        const ffmpegBuilder = new FFMpegBuilder();
        const ffmpeg = ffmpegBuilder.setSource(fileName)
            .setCodec(codec)
            .setTarget(path.join(targetDir, `${path.basename(fileName).split('.')[0]}.${fileFormat}`))
            .build()

        console.log("Encoding started")

        const logs: string[] = []
        const collect = (data: any) => logs.push(data.toString())
        ffmpeg.on('data', collect)

        const exitCode = await new Promise((resolve, reject) => {
            ffmpeg.on('error', reject)
            ffmpeg.on('close', resolve)
        })

        if (exitCode != 0) throw new Error(`Error: ${logs.join('')}`)
        return "Encoding Suceed"
    }
}


