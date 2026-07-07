import { Injectable } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';


@Injectable()
export class EncodingService {
    encode(fileName: string, codec: string, fileFormat: string, targetDir: string): Promise<string> {
        const ffmpegBuilder = new FFMpegBuilder();
        const ffmpeg = ffmpegBuilder.setSource(fileName).setCodec(codec).setTarget(path.join(targetDir, `${path.basename(fileName).split('.')[0]}.${fileFormat}`)).build()
        console.log("Encoding started")
        const logs: string[] = []
        const collect = (data: any) => logs.push(data.toString())
        return new Promise((resolve, reject) => {
            ffmpeg.stderr.on("data", collect)
            ffmpeg.stdout.on("data", collect)
            ffmpeg.on('error', (err) => {
                reject(err.message)
            })
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve("Encoding Succeed")
                } else {
                    reject(`Encoding error: ${code}\n${logs.join('')}`)
                }
            })
        })
    }
}
class FFMpegBuilder {
    private optionMap=new Map();
    private sourcePath: string = "";
    private codec: string = "";
    private targetPath: string = "";

    setSource(sourcePath: string): FFMpegBuilder {
        this.sourcePath =sourcePath;
        this.optionMap.set("-i",sourcePath);
        return this;
    }
    setCodec(codec: string): FFMpegBuilder {
        this.codec = "-c " + codec;
        this.optionMap.set("-c",codec);
        return this;
    }
    setTarget(targetPath: string): FFMpegBuilder {
        this.targetPath =targetPath;
        return this;
    }

    build(): ChildProcessWithoutNullStreams {
        const FFmpeg = spawn('ffmpeg', Array.from(this.optionMap).flat(2).concat(this.targetPath));
        return FFmpeg;
    }
}
