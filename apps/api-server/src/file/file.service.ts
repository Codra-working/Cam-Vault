import { Injectable, StreamableFile } from '@nestjs/common';
import {createReadStream} from 'fs'
import * as path from 'path'

const fs = require('fs')
const storagePath = require(path.join(__dirname,'..','config','storage.json'))
@Injectable()
export class FileService {
    //경로 검사 필요
    getFile(loc:string):StreamableFile{
        const file =createReadStream(path.join(storagePath.videoPath,loc))
        return new StreamableFile(file,{
            type:'video/mp4'
        })//정확한 MIME 타입을지정해야됨 ex) video/mp4
    }

    getLn(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(storagePath.videoPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });
    }
}
