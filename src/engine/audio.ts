export type Ambient = 'none' | 'orbit' | 'cabin' | 'underwater' | 'mcc' | 'lunar' | 'jet' | 'hologram'
export type Sfx =
  | 'click'
  | 'hover'
  | 'confirm'
  | 'back'
  | 'correct'
  | 'wrong'
  | 'levelup'
  | 'badge'
  | 'capture'
  | 'bubble'
  | 'shutter'
  | 'beep'
  | 'whoosh'
  | 'quindar'
  | 'thud'
  | 'latch'

// Attenuate noise layers by about 10 dB before the master compressor.
const NOISE_GAIN = 0.3

class AudioEngine {
  private ctx?: AudioContext
  private master?: GainNode
  private ambientBus?: GainNode
  private ambientStop: (() => void)[] = []
  private alarmStop?: () => void
  private noise?: AudioBuffer
  private enabled = true
  private volume = 0.7
  private ambientKind: Ambient = 'none'
  private bubbleTimer?: number

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.enabled ? this.volume : 0
    const compressor = this.ctx.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.ratio.value = 4
    this.master.connect(compressor).connect(this.ctx.destination)
    this.ambientBus = this.ctx.createGain()
    this.ambientBus.gain.value = 0.55
    this.ambientBus.connect(this.master)
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const pending = this.ambientKind
    this.ambientKind = 'none'
    this.ambient(pending)
  }

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled
    this.volume = volume
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(enabled ? volume : 0, this.ctx.currentTime, 0.08)
  }

  private noiseSource(loop = true) {
    const src = this.ctx!.createBufferSource()
    src.buffer = this.noise!
    src.loop = loop
    return src
  }

  private osc(type: OscillatorType, freq: number) {
    const o = this.ctx!.createOscillator()
    o.type = type
    o.frequency.value = freq
    return o
  }

  ambient(kind: Ambient) {
    if (kind === this.ambientKind) return
    this.ambientKind = kind
    if (!this.ctx || !this.ambientBus) return
    const ctx = this.ctx
    const now = ctx.currentTime
    for (const stop of this.ambientStop) stop()
    this.ambientStop = []
    window.clearInterval(this.bubbleTimer)
    if (kind === 'none') return

    const layer = ctx.createGain()
    layer.gain.setValueAtTime(0, now)
    layer.gain.linearRampToValueAtTime(1, now + 2.5)
    layer.connect(this.ambientBus)
    const nodes: (AudioScheduledSourceNode | AudioNode)[] = [layer]
    const start = (n: AudioScheduledSourceNode) => {
      n.start()
      nodes.push(n)
    }
    const filteredNoise = (type: BiquadFilterType, freq: number, q: number, gain: number) => {
      const src = this.noiseSource()
      const filter = ctx.createBiquadFilter()
      filter.type = type
      filter.frequency.value = freq
      filter.Q.value = q
      const g = ctx.createGain()
      g.gain.value = gain * NOISE_GAIN
      src.connect(filter).connect(g).connect(layer)
      start(src)
      return { filter, gain: g }
    }
    const drone = (freq: number, gain: number, type: OscillatorType = 'sine') => {
      const o = this.osc(type, freq)
      const g = ctx.createGain()
      g.gain.value = gain
      const lfo = this.osc('sine', 0.05 + Math.random() * 0.08)
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = gain * 0.5
      lfo.connect(lfoGain).connect(g.gain)
      o.connect(g).connect(layer)
      start(o)
      start(lfo)
    }

    switch (kind) {
      case 'orbit':
        drone(55, 0.05)
        drone(82.4, 0.03)
        drone(110.3, 0.012, 'triangle')
        filteredNoise('lowpass', 260, 0.5, 0.05)
        break
      case 'hologram':
        drone(73.4, 0.04)
        drone(146.8, 0.012, 'triangle')
        filteredNoise('bandpass', 900, 0.8, 0.015)
        break
      case 'cabin':
        filteredNoise('bandpass', 700, 0.35, 0.09)
        filteredNoise('lowpass', 180, 0.7, 0.08)
        drone(120, 0.012, 'sawtooth')
        break
      case 'underwater': {
        filteredNoise('lowpass', 320, 0.9, 0.14)
        drone(48, 0.03)
        this.bubbleTimer = window.setInterval(() => Math.random() < 0.55 && this.sfx('bubble'), 700)
        break
      }
      case 'mcc':
        filteredNoise('bandpass', 1400, 0.4, 0.02)
        filteredNoise('lowpass', 220, 0.6, 0.05)
        drone(60, 0.01, 'sawtooth')
        break
      case 'lunar':
        filteredNoise('bandpass', 420, 0.6, 0.04)
        drone(96, 0.012)
        break
      case 'jet':
        filteredNoise('lowpass', 500, 0.7, 0.12)
        filteredNoise('bandpass', 2400, 3, 0.02)
        break
    }

    this.ambientStop.push(() => {
      const t = ctx.currentTime
      layer.gain.cancelScheduledValues(t)
      layer.gain.setValueAtTime(layer.gain.value, t)
      layer.gain.linearRampToValueAtTime(0, t + 1.2)
      window.setTimeout(() => {
        for (const n of nodes) {
          if ('stop' in n) (n as AudioScheduledSourceNode).stop()
          n.disconnect()
        }
      }, 1400)
    })
  }

  alarm(on: boolean, kind: 'fire' | 'depress' | 'toxic' = 'fire') {
    if (!this.ctx || !this.master) return
    this.alarmStop?.()
    this.alarmStop = undefined
    if (!on) return
    const ctx = this.ctx
    const o = this.osc('square', 700)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 2200
    const g = ctx.createGain()
    g.gain.value = 0.06
    o.connect(filter).connect(g).connect(this.master)
    const pattern = kind === 'fire' ? [950, 700] : kind === 'depress' ? [1100, 1100, 0] : [620, 820, 620, 0]
    let step = 0
    const timer = window.setInterval(() => {
      const f = pattern[step++ % pattern.length]
      const t = ctx.currentTime
      if (f === 0) g.gain.setTargetAtTime(0, t, 0.01)
      else {
        g.gain.setTargetAtTime(0.06, t, 0.01)
        o.frequency.setValueAtTime(f, t)
      }
    }, kind === 'depress' ? 180 : 260)
    o.start()
    this.alarmStop = () => {
      window.clearInterval(timer)
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
      window.setTimeout(() => {
        o.stop()
        o.disconnect()
      }, 300)
    }
  }

  sfx(name: Sfx) {
    if (!this.ctx || !this.master || !this.enabled) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const out = this.master
    const tone = (freq: number, at: number, dur: number, gain = 0.12, type: OscillatorType = 'sine', slideTo?: number) => {
      const o = this.osc(type, freq)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t + at)
      g.gain.linearRampToValueAtTime(gain, t + at + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur)
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + at + dur)
      o.connect(g).connect(out)
      o.start(t + at)
      o.stop(t + at + dur + 0.05)
    }
    const burst = (at: number, dur: number, freq: number, type: BiquadFilterType, gain: number, sweepTo?: number) => {
      const src = this.noiseSource(false)
      const f = ctx.createBiquadFilter()
      f.type = type
      f.frequency.setValueAtTime(freq, t + at)
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + at + dur)
      const g = ctx.createGain()
      g.gain.setValueAtTime(gain * NOISE_GAIN, t + at)
      g.gain.exponentialRampToValueAtTime(0.0001 * NOISE_GAIN, t + at + dur)
      src.connect(f).connect(g).connect(out)
      src.start(t + at)
      src.stop(t + at + dur + 0.05)
    }
    switch (name) {
      case 'click':
        tone(1320, 0, 0.07, 0.08, 'triangle')
        break
      case 'hover':
        tone(2400, 0, 0.03, 0.025, 'sine')
        break
      case 'confirm':
        tone(880, 0, 0.09, 0.09, 'triangle')
        tone(1320, 0.07, 0.12, 0.09, 'triangle')
        break
      case 'back':
        tone(990, 0, 0.08, 0.07, 'triangle')
        tone(660, 0.06, 0.1, 0.07, 'triangle')
        break
      case 'correct':
        tone(784, 0, 0.12, 0.1, 'sine')
        tone(988, 0.08, 0.12, 0.1, 'sine')
        tone(1175, 0.16, 0.22, 0.1, 'sine')
        break
      case 'wrong':
        tone(196, 0, 0.26, 0.12, 'sawtooth', 150)
        break
      case 'levelup':
      case 'badge':
        ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.35, 0.08, 'triangle'))
        break
      case 'capture':
        burst(0, 0.12, 900, 'bandpass', 0.4)
        tone(90, 0.02, 0.35, 0.25, 'sine', 50)
        tone(180, 0.1, 0.12, 0.06, 'square')
        break
      case 'latch':
        burst(0, 0.05, 2400, 'highpass', 0.3)
        tone(140, 0, 0.18, 0.2, 'sine', 80)
        break
      case 'bubble':
        tone(300 + Math.random() * 500, 0, 0.08 + Math.random() * 0.08, 0.035, 'sine', 900 + Math.random() * 800)
        break
      case 'shutter':
        burst(0, 0.04, 4000, 'highpass', 0.35)
        burst(0.06, 0.05, 3000, 'highpass', 0.25)
        break
      case 'beep':
        tone(1000, 0, 0.12, 0.09, 'sine')
        break
      case 'quindar':
        tone(2525, 0, 0.25, 0.05, 'sine')
        break
      case 'whoosh':
        burst(0, 1.1, 200, 'bandpass', 0.25, 3200)
        break
      case 'thud':
        tone(70, 0, 0.4, 0.3, 'sine', 40)
        burst(0, 0.2, 300, 'lowpass', 0.3)
        break
    }
  }
}

export const audio = new AudioEngine()
