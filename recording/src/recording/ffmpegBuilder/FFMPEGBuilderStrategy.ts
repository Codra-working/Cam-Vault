import { VideoURL } from "src/common/types/types";
import { FFMPEGBuilder, Options, VideoSource } from "./FFMPEGBuilder";
import { FormatInputPathObject } from "path";
//linear mapping
export type Codec = 'copy' | 'libx264' | 'libx265' | 'h264_nvenc' | 'hevc_nvenc'


export type FFMPEGBuildSpec = {
    strategy: FFMPEGBuildStrategy
    context: FFMPEGBuildContext
}
export type FFMPEGBuildContext = {
    inputs: VideoSource[],
    outputs: VideoSource[],
    videoLen: number,
    codec: Codec
}



export interface FFMPEGBuildStrategy {
    (builder: FFMPEGBuilder, context: FFMPEGBuildContext): FFMPEGBuilder;
}

export const linearRecordingBuildStrategy: FFMPEGBuildStrategy = function (builder, context) {
    const { inputs: inputStreams, outputs: outputStreams, videoLen: videoLen, codec: codec } = context
    if (inputStreams.length !== outputStreams.length) throw Error("The length of the input stream cannout be mapped on to the output stream")
    const length = inputStreams.length
    for (let i = 0; i < length; i++) {
        builder.inputOption('-rtsp_transport', 'tcp')
            .timeout(5000000)
            .inStream(inputStreams[i])
            .map(i)
            .codec(codec)
            .outputOption('-t', videoLen.toString(10))
            .outStream(outputStreams[i]).commit()
    }
    return builder
}
