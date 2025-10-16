type Mulberry32State = {
  value: number;
};

const UINT32_MAX = 0xffffffff;

export class Mulberry32 {
  private state: Mulberry32State;

  constructor(seed: number) {
    this.state = { value: normalizeSeed(seed) };
  }

  next(): number {
    let t = (this.state.value += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / (UINT32_MAX + 1);
    this.state.value = t >>> 0;
    return result;
  }

  int(min: number, max: number): number {
    if (max < min) {
      [min, max] = [max, min];
    }
    const range = max - min + 1;
    return min + Math.floor(this.next() * range);
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const index = this.int(0, values.length - 1);
    return values[index];
  }
}

export function createRng(seed: number): Mulberry32 {
  return new Mulberry32(seed);
}

export function shuffleInPlace<T>(rng: Mulberry32, values: T[]): void {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [values[i], values[j]] = [values[j], values[i]];
  }
}

export function normalizedSeedFrom(...parts: number[]): number {
  let seed = 0;
  for (const part of parts) {
    seed = (seed ^ normalizeSeed(part + 0x9e3779b9 + (seed << 6) + (seed >> 2))) >>> 0;
  }
  return seed >>> 0;
}

function normalizeSeed(seed: number): number {
  const normalized = Math.floor(seed) % (UINT32_MAX + 1);
  return (normalized + (normalized < 0 ? UINT32_MAX + 1 : 0)) >>> 0;
}
