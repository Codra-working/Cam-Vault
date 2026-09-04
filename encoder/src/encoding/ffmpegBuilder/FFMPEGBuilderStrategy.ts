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
        .inStream(context.inputs[i])
        .map(i)
        .codec(context.codec)
        .outputOption('-f', 'mpegts')
        .outStream(context.outputs[i])
        .commit();
    }
    return builder;
  };
