import {
  EncodingContext,
  EncodingProcessBuilder,
  FFMPEGProcessBuilder,
} from './FFMPEGBuilder';
//linear mapping
export type EncodingProcessBuilderStrategy<
  TEncodingProcessBuilder extends EncodingProcessBuilder,
> = (
  builder: TEncodingProcessBuilder,
  context: EncodingContext,
) => TEncodingProcessBuilder;

export const FFMPEGProcessBuildStrategy: EncodingProcessBuilderStrategy<FFMPEGProcessBuilder> =
  function (
    builder: FFMPEGProcessBuilder,
    context: EncodingContext,
  ): FFMPEGProcessBuilder {
    if (context.inputs.length !== context.outputs.length)
      throw Error(
        'The length of the input stream cannout be mapped on to the output stream',
      );
    const length = context.inputs.length;
    for (let i = 0; i < length; i++) {
      builder
        .inputOption('-rtsp_transport', 'tcp')
        .timeout(5000000)
        .inStream(context.inputs[i])
        .map(i)
        .codec(context.codec)
        .outputOption('-f', 'stream_segment')
        .outputOption(
          context.segmentLen ? '-segment_time' : '',
          context.segmentLen ? context.segmentLen.toString(10) : '',
        )
        .outputOption('-reset_timestamps', '1')
        .outputOption(
          context.segmentInfoFile ? '-segment_list' : '',
          context.segmentInfoFile ? context.segmentInfoFile : '',
        )
        .outputOption('-segment_list_flags', '+live')
        .outputOption('-f', 'mpegts')
        .outStream(context.outputs[i])
        .commit();
    }
    return builder;
  };
