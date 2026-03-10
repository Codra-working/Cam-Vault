import { Injectable } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { Path } from '@nestjs/config';



@Injectable()
export class VideoService {
    constructor(private fileService: FileService){}
    play(path:string){
        return this.fileService.getFile(path)
    }
    async list(){
        return await this.fileService.getLn()
    }
}
