import { ArgumentsHost, Controller,Get, Query } from '@nestjs/common';
import {getDate} from '../utils/dateUtils'
import { VideoService } from './video.service';
import { Public } from 'src/auth/public.decorator';


@Controller('video')
export class VideoController {
    constructor(private videoService: VideoService ){}

    @Get()
    async find(@Query('date') date:string){
        //if date is valid
        //date is the name of the file
        //getDate(date)
        return this.videoService.play(date)
    }

    @Get('list')
    async getList(){
        return await this.videoService.list()
    }
}
