import { Controller, Get, Req, Post, Header,Body, Redirect, Query, Param, HostParam } from '@nestjs/common';
import type { Request } from 'express';
import { CreateVideoDto } from './dto/create-video.dto';
import {VideosService} from './videos.service'
import {Video} from './interfaces/video.interface'


@Controller('videos')
export class VideosController{
  constructor(private videosService: VideosService){}

  @Post()
  @Header('Cache-Control','no-store')
  async create(@Body() createVideoDto: CreateVideoDto){
    this.videosService.create(createVideoDto)
  }

  @Get()
  async findAll(@Req() request: Request): Promise<Video[]>{
    return this.videosService.findAll()
  }
  
  @Get('filter')
  findAllFiltered(@Query('name') name:string, @Query('date') date:number){
    return `This action returns all videos filtered by name: ${name} and date: ${date}`;
  }

  @Get('wrongAddress')
  @Redirect('https://nestjs.com',301)
  redirectWrong(){}

  @Get('docs')
  @Redirect('https://docs.nestjs.com',302)
  getDocs(@Query('version')version){
    if(version && version ==='5'){
      return {url: 'https://docs.nestjs.com/v5/'}
    }
  }
  @Get(':id')
  findOne(@Param() params:any):string{
    console.log(params.id);
    return `This action returns a #${params.id} video`
  }
}
@Controller ({host:'admin.videos.com'})
export class AdminController{
  @Get()
  index():string{
    return 'Admin page'
  }
}
@Controller({host:':account.example.com'})
export class AccountController{
  @Get()
  getInfo(@HostParam('account') account:string){
    return account;
  }
}