/* Original Jianghu score + synthesized foley. No external audio services at runtime. */
(function (root) {
  'use strict';
  const TRACKS = {
    prep: { file: 'opening', title: '临江坡开张', detail: '竹笛领路 · 琵琶拨弦 · 备菜小调' },
    service: { file: 'service', title: '锅里有江湖', detail: '竹笛拨弦 · 低音轻摇 · 老街正热闹' },
    settlement: { file: 'evening', title: '收锅听晚风', detail: '低笛慢板 · 阮声余韵 · 留一盏灯' }
  };
  const KEY = 'yiguojianghu-audio-v1';
  const clamp = n => Math.max(0, Math.min(1, n));
  function preferences(value, legacyMuted) {
    const p = { music: .55, effects: .65, ambience: .35, muted: !!legacyMuted };
    if (value && typeof value === 'object') {
      for (const k of ['music', 'effects', 'ambience']) {
        if (Number.isFinite(value[k])) p[k] = clamp(value[k]);
      }
      if (typeof value.muted === 'boolean') p.muted = value.muted;
    }
    return p;
  }
  function create(legacyMuted = false) {
    let saved; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (_) {}
    const settings = preferences(saved, legacyMuted);
    let ctx, master, musicBus, fxBus, roomBus, compressor, noiseBuffer;
    let current, wanted = '', requestId = 0, timer, roomSource, roomGain;
    let scene = { phase: 'prep', paused: false, panel: false, opera: false, hidden: false, eating: 0, rain: false };
    let error = '', loading = false, activated = false, onChange = () => {}, bubbleAt = 0;
    const cache = new Map(), cooldown = new Map(), live = new Set();
    function emit() { onChange(); }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {} emit(); }
    function gain(param, value, seconds = .2) {
      if (!ctx) return;
      param.cancelScheduledValues(ctx.currentTime);
      param.setTargetAtTime(value, ctx.currentTime, Math.max(.015, seconds / 3));
    }
    function init() {
      const Constructor = root.AudioContext || root.webkitAudioContext;
      if (!Constructor) { error = '这个浏览器暂不支持声音，请换一个浏览器试试。'; emit(); return false; }
      ctx = new Constructor();
      master = ctx.createGain(); musicBus = ctx.createGain(); fxBus = ctx.createGain(); roomBus = ctx.createGain();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -9; compressor.knee.value = 12; compressor.ratio.value = 6;
      compressor.attack.value = .005; compressor.release.value = .22;
      musicBus.connect(compressor); fxBus.connect(compressor); roomBus.connect(compressor);
      compressor.connect(master); master.connect(ctx.destination); master.gain.value = 0;
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      roomSource = ctx.createBufferSource(); roomSource.buffer = noiseBuffer; roomSource.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 650;
      roomGain = ctx.createGain(); roomGain.gain.value = 0;
      roomSource.connect(filter); filter.connect(roomGain); roomGain.connect(roomBus); roomSource.start();
      timer = setInterval(ambience, 240);
      return true;
    }
    function unlock() {
      if (scene.hidden) return Promise.resolve();
      try {
        if (!ctx && !init()) return Promise.resolve();
        activated = true;
        const resume = settings.muted ? Promise.resolve() : ctx.resume();
        mix();
        if (!settings.muted && !current && !loading) switchTrack(true);
        return resume.then(emit).catch(() => { error = '点一下声音按钮，就能听见老街。'; emit(); });
      } catch (_) { error = '声音暂时未能启动，点「重新开启声音」再试。'; emit(); return Promise.resolve(); }
    }
    function mix() {
      if (!ctx) return;
      gain(master.gain, settings.muted || scene.hidden ? 0 : .82, .15);
      gain(musicBus.gain, settings.music * (scene.opera ? .10 : scene.paused || scene.panel ? .5 : 1), .7);
      gain(fxBus.gain, settings.effects, .08);
      gain(roomBus.gain, settings.ambience, .2);
      const busy = scene.phase === 'service' && !scene.paused && !scene.panel && !scene.opera && scene.eating > 0;
      gain(roomGain.gain, busy ? .025 + (scene.rain ? .018 : 0) : 0, 1);
    }
    async function load(file) {
      if (cache.has(file)) return cache.get(file);
      const pending = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch('assets/audio/' + file + '.mp3', { signal: controller.signal });
          if (!response.ok) throw new Error('music unavailable');
          return await ctx.decodeAudioData(await response.arrayBuffer());
        } finally { clearTimeout(timeout); }
      })();
      cache.set(file, pending);
      pending.catch(() => cache.delete(file));
      return pending;
    }
    async function switchTrack(force = false) {
      if (!ctx || !activated) return;
      const track = TRACKS[scene.phase] || TRACKS.prep;
      if (!force && wanted === track.file) return;
      wanted = track.file;
      const ticket = ++requestId;
      loading = true; error = ''; emit();
      try {
        const buffer = await load(track.file);
        if (ticket !== requestId) return;
        const source = ctx.createBufferSource(), volume = ctx.createGain();
        source.buffer = buffer; source.loop = true; volume.gain.value = 0;
        source.connect(volume); volume.connect(musicBus);
        source.start(); gain(volume.gain, 1, 1.5);
        if (current) {
          const old = current;
          gain(old.volume.gain, 0, 1.1);
          old.source.stop(ctx.currentTime + 1.7);
        }
        source.onended = () => { source.disconnect(); volume.disconnect(); };
        current = { source, volume, file: track.file };
        loading = false; mix(); emit();
      } catch (_) {
        if (ticket !== requestId) return;
        loading = false;
        error = '曲子还没载入，互动音效仍可用。点「重试配乐」再请乐师。';
        emit();
      }
    }
    function update(next) {
      const old = scene, previousTrack = scene.phase;
      scene = { ...scene, ...next };
      if (scene.hidden !== old.hidden && ctx) {
        if (scene.hidden) { gain(master.gain, 0, .03); ctx.suspend().catch(() => {}); }
        else if (activated && !settings.muted) ctx.resume().catch(() => {});
      }
      if (ctx && Object.keys(scene).some(k => old[k] !== scene[k])) mix();
      if (scene.phase !== previousTrack && !settings.muted) switchTrack();
    }
    function set(key, value) {
      if (key === 'muted') settings.muted = !!value;
      else if (['music', 'effects', 'ambience'].includes(key) && Number.isFinite(value)) settings[key] = clamp(value);
      else return;
      mix(); persist();
      if (!settings.muted) { unlock(); if (current && current.file !== TRACKS[scene.phase].file) switchTrack(); }
    }
    function trackNode(source, output) {
      live.add(source);
      source.onended = () => { live.delete(source); source.disconnect(); output.disconnect(); };
    }
    function tone(freq, duration, level, bus = fxBus, delay = 0, end = freq, type = 'sine') {
      const at = ctx.currentTime + delay, oscillator = ctx.createOscillator(), envelope = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, freq), at);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), at + duration);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(level, at + .006);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(envelope); envelope.connect(bus);
      trackNode(oscillator, envelope); oscillator.start(at); oscillator.stop(at + duration + .02);
    }
    function noise(duration, level, frequency, delay = 0, type = 'bandpass') {
      const at = ctx.currentTime + delay, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain();
      source.buffer = noiseBuffer; filter.type = type; filter.frequency.value = frequency; filter.Q.value = .7;
      envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(level, at + .008);
      envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
      source.connect(filter); filter.connect(envelope); envelope.connect(fxBus);
      live.add(source); source.onended = () => { live.delete(source); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      source.start(at, .5); source.stop(at + duration + .02);
    }
    function gong(delay = 0, level = .10) {
      [1, 1.47, 2.12, 2.63, 3.9].forEach((ratio, i) => tone(225 * ratio, 1.7 - i * .17, level / (i + 1), fxBus, delay, 222 * ratio));
      noise(.12, .07, 1900, delay);
    }
    function drum(delay = 0, level = .16) { tone(155, .3, level, fxBus, delay, 55); noise(.07, .065, 1100, delay); }
    function bowl(delay = 0) { [1430, 2190, 3220].forEach((f, i) => tone(f, .12 + i * .04, .045 / (i + 1), fxBus, delay)); }
    function play(kind = 'tap') {
      if (!ctx || !activated || ctx.state !== 'running' || settings.muted || scene.hidden || !settings.effects) return;
      const now = ctx.currentTime;
      if (now - (cooldown.get(kind) ?? -10) < (kind === 'coin' ? .25 : .06)) return;
      cooldown.set(kind, now);
      if (live.size > 100) return;
      switch (kind) {
        case 'open': gong(0, .075); [0, .15, .31].forEach((d, i) => tone([294, 392, 440][i], .5, .10, fxBus, d, [294, 392, 440][i], 'triangle')); break;
        case 'coin': [0, .10, .21].forEach((d, i) => { tone([880, 1175, 1760][i], .24, .075, fxBus, d); tone([1760, 2350, 3520][i], .10, .016, fxBus, d); }); break;
        case 'serve': bowl(); noise(.55, .10, 850, .09); [0, .1, .24, .35].forEach((d, i) => tone(460 + i * 65, .12, .045, fxBus, d, 180)); break;
        case 'dish': bowl(); bowl(.13); break;
        case 'clean': noise(.25, .065, 1300); bowl(.22); break;
        case 'cat':
          tone(540, .18, .07, fxBus, 0, 780); tone(780, .38, .06, fxBus, .17, 460);
          tone(1080, .18, .025, fxBus, 0, 1560); tone(1560, .38, .02, fxBus, .17, 920);
          for (let i = 0; i < 18; i++) tone(82, .032, .024 * (1 - i / 22), fxBus, .36 + i * .035, 64);
          break;
        case 'drum': drum(); break;
        case 'opera-start': drum(); drum(.16); gong(.32, .13); break;
        case 'opera-hit': noise(.22, .1, 2800); drum(); gong(.04, .09); break;
        case 'opera-miss': tone(560, .13, .07, fxBus, 0, 510, 'triangle'); break;
        case 'fanfare': drum(); drum(.14); gong(.28, .12); [587, 784, 880, 1175].forEach((f, i) => tone(f, .5, .06, fxBus, .25 + i * .12, f, 'triangle')); break;
        case 'close': [440, 392, 294].forEach((f, i) => tone(f, .8, .065, fxBus, i * .24, f, 'triangle')); bowl(.7); break;
        case 'buy': tone(670, .13, .065); tone(890, .14, .045, fxBus, .07); break;
        default: tone(780, .07, .05); tone(1230, .04, .022); break;
      }
    }
    function ambience() {
      if (!ctx || ctx.state !== 'running' || settings.muted || scene.hidden || !settings.ambience || scene.phase !== 'service' || scene.paused || scene.panel || scene.opera || !scene.eating) return;
      if (ctx.currentTime < bubbleAt) return;
      bubbleAt = ctx.currentTime + .65 + Math.random() * 1.1;
      const f = 300 + Math.random() * 350;
      tone(f, .10, .032, roomBus, 0, f * .45);
      tone(f * 1.5, .07, .018, roomBus, .11, f * .7);
    }
    return {
      settings, unlock, update, set, play,
      retry() { error = ''; unlock(); switchTrack(true); },
      onChange(fn) { onChange = fn; },
      info() { return { ...TRACKS[scene.phase], active: activated, loading, error, playing: !!current && !settings.muted && !scene.hidden, opera: scene.opera, context: ctx?.state || 'locked' }; },
      dispose() { clearInterval(timer); requestId++; for (const node of live) { try { node.stop(); } catch (_) {} } if (ctx) ctx.close().catch(() => {}); }
    };
  }
  root.JianghuAudio = { create, preferences, TRACKS };
  if (typeof module !== 'undefined') module.exports = root.JianghuAudio;
})(typeof window !== 'undefined' ? window : globalThis);
