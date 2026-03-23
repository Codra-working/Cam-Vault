import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateVideoRequest } from './dto/createVideoRequest.dto';
import { lastValueFrom } from 'rxjs';
import { UUID } from 'crypto';

@Injectable()
export class VideoMetadataServiceService {
    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
    ) {}

    private get baseUrl() {
        return this.configService.get<string>('videoMetadataService.baseUrl') ?? 'http://localhost:8080/api/v1'
    }

    async postVideos( createVideoRequest:CreateVideoRequest){
        const respond= await lastValueFrom(this.httpService.post(`${this.baseUrl}/videos`,createVideoRequest))
        return respond.data
    }

    async getVideos(){
        const respond= await lastValueFrom(this.httpService.get(`${this.baseUrl}/videos`))
        return respond.data
    }

    async getVideo(videoUuid:UUID){
        const respond = await lastValueFrom(this.httpService.get(`${this.baseUrl}/videos/${videoUuid}`))
        return respond.data
    }

    async getEncodingStatus(videoUuid:UUID){
        const respond = await lastValueFrom(this.httpService.get(`${this.baseUrl}/videos/${videoUuid}/encoding-status`))
        return respond.data
    }

    async delVideo(videoUuid:UUID){
        await lastValueFrom(this.httpService.delete(`${this.baseUrl}/videos/${videoUuid}`))
    }
}
