import { parseToInteger, parseStreams } from "./parse";
import { Type, RTSPURLSample } from "../types/types";

// configuring testcase
const integer: number[] = [];
const realNumber: number[] = [
    Number.MIN_VALUE
];


for (let i = -(10 ** 3); i++; i < 10 ** 3) {
    integer.push(i)
}
integer.push(Number.MAX_SAFE_INTEGER)
integer.push(Number.MIN_SAFE_INTEGER)
integer.push(0.00000)
integer.push(Number.MAX_VALUE)

// running actual test
describe("parseToInteger test", () => {
    test.each(integer)("integer test", (valid) => {
        expect(parseToInteger(valid.toString())).toBe(valid)
    })
    test.each(realNumber)("real number test", (valid) => {
        expect(() => { parseToInteger(valid.toString()) }).toThrow("not an integer")
    })
    test("NaN test", () => {
        expect(() => { parseToInteger(NaN.toString()) }).toThrow("not a number")
    })

})

describe("parseStreams test", () => {
    afterEach(()=>{
        jest.resetAllMocks()
    })

    
    test("valid RTSP",() => {
        jest.spyOn(Type, "toRtspUrl").mockImplementation(() => { return RTSPURLSample })
        expect(parseStreams("rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0")).toEqual([RTSPURLSample])
    })

    
    test("invalid RTSP",()=>{
        jest.spyOn(Type, "toRtspUrl").mockImplementation(() => { throw new Error("invalid RTSP URL") })
        expect(()=>{parseStreams("rtsp://admin:admin@192.168.0.10:554/cam/realmonitor?channel=1&subtype=0")}).toThrow("invalid RTSP URL")
    })
})