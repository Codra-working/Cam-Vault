import { VideoURL } from "src/common/types/types";
import { FFMPEGBuilder, VideoSource } from "./FFmpegProcessBuilder";
import { FormatInputPathObject } from "path";
//linear mapping
export interface FFMPEGBuilderFactory{
    (ffmpegbuilder:FFMPEGBuilder,inputStreams:VideoSource[],outputStreams:VideoSource[],videoLen:number):FFMPEGBuilder;
}

export const linearMapping : FFMPEGBuilderFactory=function(ffmpegBuilder, inputStreams,outputStreams,videoLen)  {
    if(inputStreams.length!==outputStreams.length) throw Error("The length of the input stream cannout be mapped on to output stream")
    const length=inputStreams.length
    for (let i = 0; i < length; i++) {
        ffmpegBuilder.addGlobalOption('-rtsp_transport', 'tcp')
        ffmpegBuilder.addInputOption('-timeout', '5000000')
        ffmpegBuilder.addInputSrc(inputStreams[i])
        ffmpegBuilder.addOutputOption('-map', i.toString(10))
        ffmpegBuilder.addOutputOption('-c', 'copy')
        ffmpegBuilder.addOutputOption('-t', videoLen.toString(10))
        ffmpegBuilder.addOutputSrc(outputStreams[i])
    }
    return ffmpegBuilder
}
