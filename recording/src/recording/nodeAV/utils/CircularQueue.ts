export default class CircularQueue<inputType> {
  buffer:inputType[];

  p1:number;

  p2:number;

  emptyFlag:boolean;

  // rule1: p1,p2 ∈ [0, qlen-1]
  // suppose rule1 is always true when any function is called
  constructor(qSize:number) {
    this.buffer = Array<inputType>(qSize);
    this.p1 = 0;
    this.p2 = this.buffer.length - 1;
    this.emptyFlag = true;
  }

  isEmpty() {
    return this.emptyFlag;
  }

  isFull():boolean {
    if ((this.p2 === this.p1 - 1 || (this.p1 === 0 && this.p2 === this.buffer.length - 1)) && !this.isEmpty())// if rule1 and (( p2 = p1-1 ) or (p1 = 0 and p2 = qlen-1))
    { return true; }
    return false;
  }

  enqueue(x:inputType):inputType | undefined {
    if (this.isFull()) {
      // cannot enqueue
      return undefined;
    }
    this.emptyFlag = false;
    // rule1 is true since there is no change in p1,p2
    // we should find a way to increase p2(enqueue) without violating rule 1

    if (this.p2 !== this.buffer.length - 1) { // rule1 and p2!=p1-1 and p2 !=qlen-1 ⇔ p1 ∈ [0, qlen-1]\{p2+1} p2 ∈ [0, qlen-2]
      // so we can increase p2 without rule1 violation
      this.p2++;
      this.buffer[this.p2] = x;
      return x;
    }
    // rule1 is true since there are no change in p1,p2
    // rule1 and p2!=p1-1 and p1!=0 and p2 =qlen-1 ⇔ p1 ∈ [1, qlen-1], p2=qLen-1
    // we can't increase p2 since rule1 violation
    // let p2=0 then rule1 is true
    this.p2 = 0;
    this.buffer[this.p2] = x;
    return x;
  }

  dequeue():inputType | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    // if rule1 and not empty
    // we should find a way to increase p1(dequeue) without violating rule1
    let retValue:inputType;
    if (this.p1 === this.buffer.length - 1) {
      retValue = this.buffer[this.p1];
      this.p1 = 0;
    } else {
      retValue = this.buffer[this.p1++];
    }
    if (this.p2 === this.p1 - 1 || (this.p1 === 0 && this.p2 === this.buffer.length - 1)) this.emptyFlag = true;
    // if rule1 and p1!=p2 and p1!=qlen-1 then p1 ∈ [0,qlen-2]
    // we can increase p1 since p1!=qlen-1
    return retValue;
  }
}
