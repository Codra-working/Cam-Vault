import {
  Body, Delete, Get, Header, Param, Post, Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

/**
 * Generates endpoints based on templit
 */
export default class RouteGenerator {
  constructor(protected client:ClientProxy) {}

  addRoutHandler({
    HttpMethod,
    path,
    routeParameter,
    headers,
    bodyKeys,
    queryKeys,
    toPayload,
    toResponse = (val) => val,
  }: autoGenerateRoutHandlerOptions) {
    const init = () => {
      Object.assign(Get, { myNameIs: 'Get' });
      Object.assign(Post, { myNameIs: 'Post' });
      Object.assign(Delete, { myNameIs: 'Delete' });
    };

    const cleanUp = () => {
      if (Object.getOwnPropertyNames(Get).includes('myNameIs')) delete (Get as NamedRouteHandlerDecorator).myNameIs;
      if (Object.getOwnPropertyNames(Post).includes('myNameIs')) delete (Post as NamedRouteHandlerDecorator).myNameIs;
      if (Object.getOwnPropertyNames(Delete).includes('myNameIs')) delete (Delete as NamedRouteHandlerDecorator).myNameIs;
    };
    init();

    if (routeParameter) {
      path = `${path}/:${routeParameter}`;
    }
    const propertyName = `${(HttpMethod as NamedRouteHandlerDecorator).myNameIs}_${path.replaceAll('/', '_')}`;

    const handler = (...values: string[]) => {
      const param = routeParameter ? values[0] : '';
      const bodyMap = new Map<string, string>();
      const queryMap = new Map<string, string>();
      let argsCnt = routeParameter ? 1 : 0;

      bodyKeys?.forEach((key) => {
        bodyMap.set(key, values[argsCnt]);
        argsCnt++;
      });
      queryKeys?.forEach((key) => {
        queryMap.set(key, values[argsCnt]);
        argsCnt++;
      });

      const body = Object.fromEntries(bodyMap);
      const query = Object.fromEntries(queryMap);
      const payload = toPayload({
        routeParameter: param,
        body,
        query,
      });
      const response = this.client.send<
            string[] | string | VideoMeta[],
            Record<string, string>
        >({ cmd: propertyName }, payload);

      return toResponse(response);
    };

    const handlerDiscriptor = {
      value: handler,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    HttpMethod(path)(
      RouteGenerator.prototype,
      propertyName,
      handlerDiscriptor,
    );

    headers?.forEach((header) => {
      Header(header.key, header.value)(
        RouteGenerator.prototype,
        propertyName,
        handlerDiscriptor,
      );
    });

    let argsCounter: number = 0;
    if (routeParameter) {
      Param(routeParameter)(
        RouteGenerator.prototype,
        propertyName,
        argsCounter,
      );
      argsCounter++;
    }
    bodyKeys?.forEach((key) => {
      Body(key)(RouteGenerator.prototype, propertyName, argsCounter);
      argsCounter++;
    });
    queryKeys?.forEach((key) => {
      Query(key)(RouteGenerator.prototype, propertyName, argsCounter);
      argsCounter++;
    });

    Object.defineProperty(
      RouteGenerator.prototype,
      propertyName,
      handlerDiscriptor,
    );

    cleanUp();
  }
}

export const convertToNumOrStr = (
  val: unknown,
): number | string | undefined => {
  let num: number;
  let str: string;
  if (val !== undefined) {
    try {
      num = Number(val);
      str = String(val);
    } catch (error) {
      console.log(`convertToNumOrStr failed: ${error}`);
      console.log(`${val}`);
      return undefined;
    }
  } else return undefined;
  return !isNaN(num) ? num : str;
};
export type NamedRouteHandlerDecorator = RouteHandlerDecorator & {
  myNameIs?: string;
};
export type RouteHandlerDecorator = (
  path?: string | string[],
) => MethodDecorator;
export type autoGenerateRoutHandlerOptions = {
  HttpMethod: RouteHandlerDecorator;
  path: string;
  headers?: Head[];
  routeParameter?: string;
  bodyKeys?: string[];
  queryKeys?: string[];
  toPayload: (reqBody: {
    routeParameter: string;
    body: Record<string, string>;
    query: Record<string, string>;
  }) => Record<string, string>;
  toResponse?: (recBody: any) => any;
};
export type VideoMeta = {
  Bucket: string;
  Key: string;
  segmentNumber: number;
};
export type Head = { key: string; value: string };
