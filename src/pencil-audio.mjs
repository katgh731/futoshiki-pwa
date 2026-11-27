let context;
let paperNoise;
let active;

export function playPencilSound(duration) {
  const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Audio) return;

  try {
    context ??= new Audio();
    if (!paperNoise) {
      const length = Math.ceil(context.sampleRate * 0.8);
      paperNoise = context.createBuffer(1, length, context.sampleRate);
      const samples = paperNoise.getChannelData(0);
      let seed = 27;
      for (let i = 0; i < length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const pressure = 0.66 + 0.22 * Math.sin(i / 117) + 0.12 * Math.sin(i / 37);
        samples[i] = (seed / 2 ** 31 - 1) * pressure;
      }
    }

    if (context.state !== 'running') context.resume().catch(() => {});
    active?.stop();
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();
    const now = context.currentTime;
    source.buffer = paperNoise;
    filter.type = 'bandpass';
    filter.frequency.value = 1450;
    filter.Q.value = 0.65;
    volume.gain.setValueAtTime(0, now);
    volume.gain.linearRampToValueAtTime(0.11, now + 0.035);
    volume.gain.linearRampToValueAtTime(0.055, now + duration * 0.65);
    volume.gain.linearRampToValueAtTime(0, now + duration);
    source.connect(filter).connect(volume).connect(context.destination);
    source.start(now, 0, duration);
    active = source;
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      volume.disconnect();
      if (active === source) active = undefined;
    };
  } catch {
    // Audio support and playback policies vary. Writing remains available.
  }
}
