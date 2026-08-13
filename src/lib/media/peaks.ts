/** Downsample a mono PCM channel into peak magnitudes in 0..1. */
export function peaksFromChannel(samples: Float32Array | number[], buckets: number): number[] {
  const n = Math.max(1, Math.floor(buckets));
  if (!samples.length) return Array.from({ length: n }, () => 0);
  const out: number[] = [];
  const step = samples.length / n;
  for (let i = 0; i < n; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));
    let peak = 0;
    for (let s = start; s < end && s < samples.length; s++) {
      const a = Math.abs(samples[s]);
      if (a > peak) peak = a;
    }
    out.push(Math.min(1, peak));
  }
  return out;
}

export function mixToMono(channels: Array<Float32Array>): Float32Array {
  if (!channels.length) return new Float32Array();
  const len = channels[0].length;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let sum = 0;
    for (const ch of channels) sum += ch[i] || 0;
    out[i] = sum / channels.length;
  }
  return out;
}
