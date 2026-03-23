import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { AxiosResponse } from 'axios';
import { VideoMetadataServiceService } from './video-metadata-service.service';
import { CreateVideoRequest } from './dto/createVideoRequest.dto';
import type { UUID } from 'crypto';

@Controller('videos')
export class VideoMetadataServiceController {
    constructor( private videoMetadataService:VideoMetadataServiceService){}

    @Post()
     postVideos(fileName:string,fileDir:string): Promise<AxiosResponse>{
        const requestBody:CreateVideoRequest={
            fileName:fileName,
            fileDir:fileDir
        }
        return  this.videoMetadataService.postVideos(requestBody)

    }
    
    @Get()
     getVideos(): Promise<AxiosResponse>{
        return  this.videoMetadataService.getVideos()
    }

    @Get(':uuid')
     getVideo(@Param('uuid') videoUuid:UUID): Promise<AxiosResponse>{
        return  this.videoMetadataService.getVideo(videoUuid)
    }

    @Get(':uuid/encoding-status')
     getEncodingStatus(@Param('uuid')videoUuid:UUID): Promise<AxiosResponse>{
        return  this.videoMetadataService.getEncodingStatus(videoUuid)
    }
    @Delete(':uuid')
     delVideo(@Param('uuid')videoUuid:UUID): Promise<void>{
        return  this.videoMetadataService.delVideo(videoUuid)
    }

}
