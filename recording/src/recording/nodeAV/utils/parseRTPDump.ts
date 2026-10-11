import convertUint8ArrToNum from './convertUint';

export type RecordHeader={length:number, plen:number, offset:number}
export type Record={recordHeader:RecordHeader, recordBody:Uint8Array}
export type FileHeader={startSec:number, startMS:number, ipv4Address:`${number}.${number}.${number}.${number}`, port:number, pad:number}
export type FileBody=Record[]
export type RTPObj={fileHeader:FileHeader, fileBody:FileBody}

export default function parseRtpDump(rtpDump:Uint8Array):RTPObj {
  const rtpObj:RTPObj = { fileHeader: {} as FileHeader, fileBody: new Array<Record>() };
  const fileHeader = {} as FileHeader;
  const arr = [4, 4, 4, 2, 2];
  const hField = ['startSec', 'startMS', 'ipv4Address', 'port', 'pad'];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const idx = arr[i];
    sum += idx;
    const bufArr:number[] = [];
    for (let j = sum - idx; j < sum; j++) {
      bufArr.push(rtpDump[j]);
    }
    const buf = Buffer.from(bufArr);
    Object.assign(fileHeader, { [hField[i]]: convertUint8ArrToNum(new Uint8Array(buf)) });
  }
  if (sum !== 16) throw Error('wrong header size');
  rtpObj.fileHeader = fileHeader;

  console.log(`fileheader: ${fileHeader}`);
  const fileBody = new Array<Record>();
  while (sum < rtpDump.length) {
    const record = {} as Record;
    const sumOffset = sum;
    const recordHeader = {};
    const arr2 = [2, 2, 4];
    const rField = ['length', 'plen', 'offset'];
    for (let i = 0; i < arr2.length; i++) {
      const idx = arr2[i];
      sum += idx;
      const bufArr2:number[] = [];
      for (let j = sum - idx; j < sum; j++) {
        bufArr2.push(rtpDump[j]);
      }
      const buf2 = new Uint8Array(bufArr2);
      Object.assign(recordHeader, { [rField[i]]: convertUint8ArrToNum(new Uint8Array(buf2)) });
    }
    const ok = recordHeader[rField[0]] - recordHeader[rField[1]] === 8;
    if (!ok) throw Error('wrong record header:length');
    Object.assign(record, { header: recordHeader });

    const recordBody:number[] = [];
    const end = sumOffset + recordHeader[rField[0]];
    while (sum < end) {
      recordBody.push(rtpDump[sum]);
      sum++;
    }
    Object.assign(record, { recordBody: new Uint8Array(recordBody) });
    fileBody.push(record);
    console.log(`record: ${record}`);
  }
  rtpObj.fileBody = fileBody;
  return rtpObj;
}
