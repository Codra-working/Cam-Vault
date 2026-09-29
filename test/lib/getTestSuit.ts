import * as fs from 'node:fs';
import { parse } from 'yaml';

function urlFilter() {
  return true;
}

export type RESTAPI={ httpMethod:string, url:string, reqBody?:object, response?:object}

// 현재 reqBody가 있을경우 함수실행을 막아놓음 나중에 수정
function getRequestBodyExample(reqBody) {
  if (reqBody) return;
  const ret = {};
  for (const [key, value] of Object.entries(reqBody.content['application/json'].schema.properties)) {
    if (key === 'example')Object.assign(ret, { [key]: value });
  }
  return ret;
}

// 현재 param이 잇을경우 URL을 고치는 로직을 추가안함
export default function getApiExample(openAPIfile:string):Array<RESTAPI> {
  const file = fs.readFileSync(openAPIfile);
  const parsedAPI = parse(file.toString());
  const endpoints = Object.getOwnPropertyNames(parsedAPI.paths).filter(urlFilter);
  const ret:Array<RESTAPI> = [];

  for (const endpoint of endpoints) {
    // does endpoint has param
    const MethodOrParam:Array<string> = Object.getOwnPropertyNames(parsedAPI.paths[endpoint]);
    const hasParam:boolean = MethodOrParam.includes('parameters');
    if (hasParam) {
      // ToDo: correctURL
    }
    const methods:Array<string> = MethodOrParam.filter((x) => x !== 'parameters');
    for (const method of methods) {
      const { tags, requestBody, responses } = parsedAPI.paths[endpoint][method];
      const restApi:RESTAPI = {
        httpMethod: method, url: endpoint, reqBody: requestBody ? getRequestBodyExample(requestBody) : undefined,
      };
      ret.push(restApi);
    }
  }
  return ret;
}
