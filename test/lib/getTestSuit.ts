import * as fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

function urlFilter() {
  return true;
}
// TYPE DEFINITION
type $ref=string
export type RESTAPI={ httpMethod:string, url:string, reqBody?:object, response?:object}

type Schema= {type:string, additionalProperties?:boolean, required:Array<string>, properties:object,};
type ParameterSchema = {name:string, in:string, required:boolean, schema:{type:string, minimun?:number, maximum?:number}, example:any}|$ref;

type Method={tags:string, summary:string, description:string, responses:any, requestBody:any}
// 프로퍼티 타입 체크하는 함수 아직 구현 안됨
function typeCheck(property:object) {
  return true;
}
// 현재 스키마 예제만 가져올 수 있음
function getSchemaExample(schema:Schema) {
  const { additionalProperties, required, properties } = schema;
  const tempObj = {};
  if (additionalProperties !== true) {
    // required만 출력
    for (const [propertyName, property] of Object.entries(properties)) {
      if (required && required.includes(propertyName) && typeCheck(property)) {
        Object.assign(tempObj, { [propertyName]: property.example });
      }
    }
  }
  return tempObj;
}

// 타입확인 기능 필요
function getParamExample(param:ParameterSchema) {
  const { required, example } = param;
  let ret;
  if (required) ret = example;
  return ret;
}

// 정규식 검사가 부정확함
function getRef(parsedYaml:any, ref:string) {
  const tokens = ref.split('/');
  if (tokens[0] !== '#') {
    throw Error('wrong format');
  }
  let obj = parsedYaml;
  for (let i = 1; i < tokens.length; i++) {
    if (!obj[tokens[i]]) {
      throw Error('wrong format');
    }
    obj = obj[tokens[i]];
  }
  return obj;
}

// 현재 예시 api를 가져오는 기능은 parameters, method 선언 순서에 의존함 parameters->method 순서로 선언해야됨
export default function getApiExample(openAPIfile:string):Array<RESTAPI> {
  const file = fs.readFileSync(openAPIfile);
  const parsedAPI = parse(file.toString());
  const endpoints = Object.getOwnPropertyNames(parsedAPI.paths).filter(urlFilter);
  const ret:Array<RESTAPI> = [];

  for (const [idx, endpoint] of endpoints.entries()) {
    for (const [key, value] of Object.entries(parsedAPI.paths[endpoint])) {
      if (key === 'parameters') {
        const parameters = value as ParameterSchema[];
        for (let paramValue of parameters) {
          if (paramValue.$ref) {
            paramValue = getRef(parsedAPI, paramValue.$ref);
            paramValue = getParamExample(paramValue);
            endpoints[idx] = endpoint.replace(/\{[^{}]+\}/, paramValue.toString());// 앞에서부터 교체
          }
        }
      } else {
        const methodName = key;
        const method = value as Method;
        let { tags, requestBody, responses } = method;
        if (requestBody && requestBody.required) {
          let { schema } = requestBody.content['application/json'];
          if (schema.$ref) {
            const ref:string = requestBody.content['application/json'].schema.$ref;
            schema = getRef(parsedAPI, ref);
          }
          requestBody = getSchemaExample(schema);
        }
        const restApi:RESTAPI = { httpMethod: methodName, url: endpoints[idx], reqBody: requestBody };
        ret.push(restApi);
      }
    }
  }
  return ret;
}

if (import.meta.main) {
  const yaml = process.argv[2] ?? path.join(import.meta.dirname, '..', '..', 'docs', 'openapi.yaml');
  console.log(getApiExample(yaml));
}
