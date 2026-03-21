import { Controller, Get, Param } from "@nestjs/common";
import { DBService } from "./services/DB/DB.service";

@Controller('videos')
export class VideoController{
    constructor(private videoRecord:DBService){}
    @Get('list')
    async getVideoList(){
        return (await this.videoRecord.findAll()).map(f=>f.fileName)
    }
    @Get(':name')
    async getVideo(@Param()name:string){
        
    }
}