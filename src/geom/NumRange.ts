export class NumRange {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  get size(): number {
    return this.max - this.min;
  }

  normalize(value: number): number {
    while (value < this.min) value += this.size;
    return this.min + (value - this.min) % this.size;
  }
}
