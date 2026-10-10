export default function convertUint8ArrToNum(uint:Uint8Array, bigEndian = true) {
  let sum = 0;
  if (bigEndian) {
    for (let i = 0; i < uint.length; i++) {
      sum += Number(uint[uint.length - i - 1]) * (2 ** (8 * i));
    }
  } else {
    for (let i = 0; i < uint.length; i++) {
      sum += Number(uint[i]) * (2 ** (8 * i));
    }
  }
  return sum;
}
