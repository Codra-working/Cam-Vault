import { Injectable, Optional } from '@nestjs/common';
import { Video } from './interfaces/video.interface'

@Injectable()
export class VideosService{
  private readonly videos:Video[]=[]

  create( video:Video){
    this.videos.push(video)
  }

  findAll():Video[]{
    return this.videos
  }
}