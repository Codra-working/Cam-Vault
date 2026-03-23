import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { CreateVideoRequest } from './dto/createVideoRequest.dto';
import { lastValueFrom } from 'rxjs';
import { UUID } from 'crypto';

@Injectable()
export class VideoMetadataServiceService {
    constructor(private httpService:HttpService){}

    async postVideos( createVideoRequest:CreateVideoRequest){
        const respond= await lastValueFrom(this.httpService.post('http://localhost:8080/api/v1/videos',createVideoRequest))
        return respond.data
    }

    async getVideos(){
        const respond= await lastValueFrom(this.httpService.get('http://localhost:8080/api/v1/videos'))
        return respond.data
    }

    async getVideo(videoUuid:UUID){
        const respond = await lastValueFrom(this.httpService.get(`http://localhost:8080/api/v1/videos/${videoUuid}`))
        return respond.data
    }

    async getEncodingStatus(videoUuid:UUID){
        const respond = await lastValueFrom(this.httpService.get(`http://localhost:8080/api/v1/videos/${videoUuid}/encoding-status`))
        return respond.data
    }

    async delVideo(videoUuid:UUID){
        await lastValueFrom(this.httpService.delete(`http://localhost:8080/api/v1/videos/${videoUuid}`))
    }
}
