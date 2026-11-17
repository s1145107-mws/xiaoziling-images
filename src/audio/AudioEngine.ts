/**
 * 純 Web Audio API 合成的音效系統：無需任何外部音頻檔案。
 * - 背景音樂：輕快冒險風（旋律 + 低音 + 鼓），三關各有不同旋律
 * - setUrgent(true)：倒數最後 5 秒 BGM 加速並加入緊張的高音鼓點
 * - 音效：答對、攻擊、受擊、答錯、滴答、勝利、按鈕、放置部件
 */

export type BgmTheme = 'menu' | 'forest' | 'castle' | 'space' | 'victory';

interface Pattern {
  bpm: number;
  melody: number[]; // 32 個八分音符，0 = 休止
  bass: number[]; // 8 個（每半小節一個）
  wave: OscillatorType;
}

const PATTERNS: Record<BgmTheme, Pattern> = {
  menu: {
    bpm: 100,
    wave: 'triangle',
    melody: [
      72, 0, 74, 76, 79, 0, 76, 0, 74, 0, 72, 74, 76, 0, 0, 0,
      72, 0, 74, 76, 79, 0, 81, 79, 76, 0, 74, 0, 72, 0, 0, 0,
    ],
    bass: [48, 48, 45, 43, 48, 53, 43, 48],
  },
  forest: {
    bpm: 112,
    wave: 'triangle',
    melody: [
      72, 0, 76, 79, 76, 0, 74, 72, 74, 0, 76, 74, 72, 0, 67, 0,
      72, 0, 76, 79, 81, 79, 76, 0, 74, 76, 74, 72, 72, 0, 0, 0,
    ],
    bass: [48, 48, 53, 55, 48, 45, 53, 55],
  },
  castle: {
    bpm: 106,
    wave: 'square',
    melody: [
      69, 0, 72, 76, 74, 72, 71, 0, 72, 0, 69, 71, 72, 0, 64, 0,
      69, 0, 72, 76, 77, 76, 74, 72, 71, 72, 71, 68, 69, 0, 0, 0,
    ],
    bass: [45, 45, 41, 43, 45, 40, 41, 40],
  },
  space: {
    bpm: 118,
    wave: 'sawtooth',
    melody: [
      74, 78, 81, 0, 86, 0, 81, 78, 76, 0, 79, 83, 81, 0, 0, 0,
      74, 78, 81, 0, 86, 85, 83, 81, 79, 81, 83, 78, 74, 0, 0, 0,
    ],
    bass: [50, 50, 55, 57, 50, 47, 55, 57],
  },
  victory: {
    bpm: 128,
    wave: 'square',
    melody: [
      72, 0, 72, 72, 76, 0, 79, 0, 84, 0, 0, 0, 79, 0, 84, 0,
      81, 0, 81, 81, 84, 0, 86, 0, 88, 0, 0, 0, 0, 0, 0, 0,
    ],
    bass: [48, 48, 53, 55, 53, 53, 55, 48],
  },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private bgmBus!: GainNode;
  private sfxBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;

  private theme: BgmTheme | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private urgent = false;
  private _muted = false;

  get muted() {
    return this._muted;
  }

  /** 必須在使用者點擊後呼叫（瀏覽器自動播放政策） */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      this.bgmBus = this.ctx.createGain();
      this.bgmBus.gain.value = 0.22;
      this.bgmBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.6;
      this.sfxBus.connect(this.master);
      this.noiseBuf = this.makeNoise();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  /* ------------------------------ BGM ------------------------------ */

  playBgm(theme: BgmTheme) {
    this.unlock();
    if (!this.ctx) return;
    if (this.theme === theme && this.timer !== null) return;
    this.stopBgm();
    this.theme = theme;
    this.step = 0;
    this.urgent = false;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stopBgm() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.theme = null;
  }

  /** 倒數最後 5 秒：BGM 加速 */
  setUrgent(u: boolean) {
    this.urgent = u;
  }

  private schedule() {
    if (!this.ctx || !this.theme) return;
    const pat = PATTERNS[this.theme];
    const bpm = pat.bpm * (this.urgent ? 1.6 : 1);
    const stepDur = 60 / bpm / 2; // 八分音符
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      const t = this.nextTime;
      const i = this.step % 32;
      const m = pat.melody[i];
      if (m) this.tone(mtof(m), t, stepDur * 0.9, pat.wave, 0.35, this.bgmBus);
      if (i % 4 === 0) {
        const b = pat.bass[Math.floor(i / 4)];
        this.tone(mtof(b), t, stepDur * 3.2, 'triangle', 0.55, this.bgmBus);
      }
      // 鼓：拍頭大鼓、反拍小鼓
      if (i % 4 === 0) this.kick(t, 0.5);
      if (i % 4 === 2) this.hat(t, 0.12);
      if (this.urgent) this.hat(t + stepDur / 2, 0.18, 9000);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  /* ------------------------------ 音效 ------------------------------ */

  click() {
    this.withCtx((t) => this.tone(880, t, 0.06, 'square', 0.25));
  }

  place() {
    this.withCtx((t) => {
      this.tone(523, t, 0.08, 'triangle', 0.4);
      this.tone(784, t + 0.06, 0.1, 'triangle', 0.4);
    });
  }

  correct() {
    this.withCtx((t) => {
      [72, 76, 79, 84].forEach((m, k) => this.tone(mtof(m), t + k * 0.08, 0.18, 'square', 0.3));
      this.tone(mtof(88), t + 0.32, 0.35, 'triangle', 0.35);
    });
  }

  /** 小字靈發動攻擊：上升的魔法音 + 呼嘯聲 + 命中 */
  attack() {
    this.withCtx((t) => {
      const ctx = this.ctx!;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, t);
      o.frequency.exponentialRampToValueAtTime(1800, t + 0.35);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g).connect(this.sfxBus);
      o.start(t);
      o.stop(t + 0.45);
      this.noise(t, 0.35, 0.3, 'bandpass', 1200, 6000);
      // 命中
      this.kick(t + 0.42, 1);
      this.noise(t + 0.42, 0.2, 0.5, 'lowpass', 3000, 400);
    });
  }

  wrong() {
    this.withCtx((t) => {
      this.tone(mtof(64), t, 0.16, 'square', 0.3);
      this.tone(mtof(58), t + 0.16, 0.3, 'square', 0.3);
    });
  }

  /** 玩家被關主重擊 */
  hurt() {
    this.withCtx((t) => {
      const ctx = this.ctx!;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g).connect(this.sfxBus);
      o.start(t);
      o.stop(t + 0.6);
      this.kick(t, 1.2);
      this.noise(t, 0.4, 0.7, 'lowpass', 2500, 200);
    });
  }

  /** 最後 5 秒的「滴答」 */
  tick(highPitch = false) {
    this.withCtx((t) => {
      this.tone(highPitch ? 2093 : 1568, t, 0.05, 'square', 0.35);
      this.tone(highPitch ? 1568 : 1175, t + 0.12, 0.04, 'square', 0.2);
    });
  }

  timeUp() {
    this.withCtx((t) => {
      [0, 0.18, 0.36].forEach((d) => this.tone(mtof(60), t + d, 0.12, 'square', 0.35));
    });
  }

  victory() {
    this.withCtx((t) => {
      const seq: [number, number, number][] = [
        [72, 0, 0.12], [72, 0.12, 0.12], [72, 0.24, 0.12], [76, 0.36, 0.3],
        [74, 0.7, 0.12], [77, 0.82, 0.12], [81, 0.94, 0.5],
      ];
      seq.forEach(([m, d, len]) => {
        this.tone(mtof(m), t + d, len, 'square', 0.28);
        this.tone(mtof(m - 12), t + d, len, 'triangle', 0.3);
      });
    });
  }

  /** 正字核心重組的閃亮聲 */
  sparkle() {
    this.withCtx((t) => {
      for (let k = 0; k < 10; k++) {
        this.tone(mtof(84 + ((k * 5) % 14)), t + k * 0.07, 0.25, 'sine', 0.18);
      }
    });
  }

  /* ------------------------------ 合成器 ------------------------------ */

  private withCtx(fn: (t: number) => void) {
    this.unlock();
    if (!this.ctx) return;
    fn(this.ctx.currentTime + 0.01);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, bus?: GainNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus ?? this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private kick(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(this.bgmBusOr(vol));
    o.start(t);
    o.stop(t + 0.2);
  }

  private bgmBusOr(vol: number) {
    // 大音量的 kick 屬於音效（受擊），小音量屬於背景音樂
    return vol > 0.8 ? this.sfxBus : this.bgmBus;
  }

  private hat(t: number, vol: number, freq = 7000) {
    this.noise(t, 0.04, vol, 'highpass', freq, freq, this.bgmBus);
  }

  private noise(
    t: number,
    dur: number,
    vol: number,
    type: BiquadFilterType,
    f0: number,
    f1: number,
    bus?: GainNode,
  ) {
    const ctx = this.ctx!;
    if (!this.noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(f0, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(bus ?? this.sfxBus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private makeNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
}

export const audio = new AudioEngine();
