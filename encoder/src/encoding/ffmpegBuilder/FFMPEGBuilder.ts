import { Injectable, Scope } from '@nestjs/common';
import * as path from 'path';
import { isFormatInputPathObject, isRTSPURL } from 'src/common/types/types';
import type { RTSPURL } from 'src/common/types/types';
import { URL } from 'url';
import {
  FFMPEGBuildStrategy,
  FFMPEGBuildContext,
  Codec,
} from './FFMPEGBuilderStrategy';
import { spawn } from 'child_process';

export type VideoSource = path.FormatInputPathObject | URL | RTSPURL;
export type Specs = Map<VideoSource, Options>;
export type Options = Map<string, string>;

//싱글톤 문제 해결 필요
@Injectable({ scope: Scope.TRANSIENT })
export class FFMPEGBuilder {
  private globalOptions: Options = new Map();
  private filterOptions: Options = new Map();
  private inSpec: Specs = new Map();
  private outSpec: Specs = new Map();
  private inOptions: Options = new Map();
  private outOptions: Options = new Map();
  private inputStream: VideoSource;
  private outputStream: VideoSource;

  inStream(videoSource: VideoSource) {
    this.inputStream = videoSource;
    return this;
  }

  outStream(videoSource: VideoSource) {
    this.outputStream = videoSource;
    return this;
  }

  addGlobalOption(key: string, value: string): FFMPEGBuilder {
    this.globalOptions.set(key, value);
    return this;
  }

  addFilterOption(key: string, value: string): FFMPEGBuilder {
    this.filterOptions.set(key, value);
    return this;
  }

  // addInputSpec(videoSource: VideoSource): FFMPEGBuilder {
  //     this.inSpec.set(videoSource, this.inOptions)
  //     this.outOptions = new Map()
  //     return this
  // }

  inputOption(key: string, value: string): this {
    this.inOptions.set(key, value);
    return this;
  }

  timeout(time: number): this {
    this.inOptions.set('-timeout', time.toString(10));
    return this;
  }

  // addOutputSpec(videoSource: VideoSource): FFMPEGBuilder {
  //     this.outSpec.set(videoSource, this.outOptions)
  //     this.outOptions = new Map()
  //     return this
  // }

  outputOption(key: string, value: string): this {
    this.outOptions.set(key, value);
    return this;
  }

  map(index: number): this {
    this.outOptions.set('-map', index.toString(10));
    return this;
  }

  codec(codec: Codec): this {
    this.outOptions.set('-c', codec);
    return this;
  }
  commit() {
    if (!this.inputStream || !this.outputStream) {
      throw new Error(
        'Both input and output streams must be set before save()',
      );
    }
    this.inSpec.set(this.inputStream, this.inOptions);
    this.outSpec.set(this.outputStream, this.outOptions);
    this.inOptions = new Map();
    this.outOptions = new Map();

    return this;
  }

  /**
   * print a node if it is not an instance of Map (special symbols are considered as a instance of a Map)
   * parent node contains a list of (key,value)pair and each (key,value)pair is a child node of a parent
   * if a node is a map, the (key,value) pair of the map will be visted in order with the number of registration, except when isVideoSoure() is true
   * so if a node is videoSource it will be visited last, only if they share a same parent node
   * @param node node to be visited
   * @param ret order of nodes which is going to be visited
   */
  inputPrefixCount = 0;
  protected DFS(node, ret: Array<string>) {
    if (node instanceof Map) {
      for (const [key, value] of node) {
        let videosource: VideoSource | undefined = undefined;
        if (!isVideoSource(key)) this.DFS(key, ret);
        else videosource = key;
        if (!isVideoSource(value)) this.DFS(value, ret);
        else videosource = value;
        if (videosource !== undefined) {
          if (this.inputPrefixCount < this.inSpec.size) {
            ret.push('-i');
            this.inputPrefixCount++;
          }
          this.DFS(videoSourceToString(videosource), ret);
        } //videosource 후순위
      }
    } else if (typeof node === 'symbol') {
      // Intentionally empty.
    } else {
      ret.push(node as string);
    }
  }
  build() {
    this.inputPrefixCount = 0;
    const a = Symbol();
    const b = Symbol();
    const c = Symbol();
    const d = Symbol();
    const graph = new Map();
    graph.set(a, this.globalOptions);
    graph.set(c, this.inSpec);
    graph.set(b, this.filterOptions);
    graph.set(d, this.outSpec);
    const args = [];
    this.DFS(graph, args);
    return spawn('ffmpeg', args);
  }

  applyStrategy(strategy: FFMPEGBuildStrategy, context: FFMPEGBuildContext) {
    //interface를 정해야됨
    return strategy(this, context);
  }
}

function isVideoSource(val: unknown): val is VideoSource {
  if (val instanceof URL || isRTSPURL(val) || isFormatInputPathObject(val))
    return true;
  return false;
}

export function videoSourceToString(src: VideoSource): string {
  if (typeof src === 'string') {
    return src;
  }
  if (src instanceof URL) {
    return src.toString();
  }
  return path.format(src);
}

// function cloneVideoSource(src: VideoSource): VideoSource {
//   if (typeof src === 'string') {
//     return src;
//   } else if (src instanceof URL) {
//     return new URL(src.toString());
//   } else {
//     //src===parsedPath
//     return { ...src };
//   }
// }
