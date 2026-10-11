export default class CircularQueue<inputType> {
    buffer: inputType[];
    p1: number;
    p2: number;
    emptyFlag: boolean;
    constructor(qSize: number);
    isEmpty(): boolean;
    isFull(): boolean;
    enqueue(x: inputType): inputType | undefined;
    dequeue(): inputType | undefined;
}
