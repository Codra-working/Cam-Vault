import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
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
        
        const exitCode=await new Promise((resolve,reject)=>{
            ffmpeg.on('error', reject)
            ffmpeg.on('close', resolve)
        }) 
        
        if(exitCode!=0) throw new Error(`Error: ${logs.join('')}`)
        return "Encoding Suceed"
    }
}
class FFMpegBuilder {
    private optionMap = new Map();
    private sourcePath: string = "";
    private codec: string = "";
    private targetPath: string = "";

    setSource(sourcePath: string): FFMpegBuilder {
        this.sourcePath = sourcePath;
        this.optionMap.set("-i", sourcePath);
        return this;
    }
    setCodec(codec: string): FFMpegBuilder {
        this.codec = "-c " + codec;
        this.optionMap.set("-c", codec);
        return this;
    }
    setTarget(targetPath: string): FFMpegBuilder {
        this.targetPath = targetPath;
        return this;
    }

    build(): ChildProcessWithoutNullStreams {
        console.log(`running ffmpeg ${Array.from(this.optionMap).flat(2).concat(this.targetPath)}`)
        const FFmpeg = spawn('ffmpeg', Array.from(this.optionMap).flat(2).concat(this.targetPath));
        return FFmpeg;
    }
}
