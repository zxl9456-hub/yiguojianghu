/* Lifecycle tests: deferred network, tab visibility, mute, and source overlap. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../dist/audio.js'), 'utf8');
const drain = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const requests = [], contexts = [], storage = new Map();
  function param(value = 0) { return { value, cancelScheduledValues() {}, setTargetAtTime(v) { this.value = v; }, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } }; }
  function node() { return { connect() {}, disconnect() {}, gain: param(), frequency: param(), Q: param(), start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } }; }
  class Context {
    constructor() { this.currentTime = 1; this.state = 'suspended'; this.sampleRate = 100; this.destination = node(); this.sources = []; this.gains = []; this.oscillators = []; contexts.push(this); }
    createGain() { const n = node(); this.gains.push(n); return n; }
    createDynamicsCompressor() { return { ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }; }
    createBiquadFilter() { return node(); }
    createBuffer() { return { getChannelData: () => new Float32Array(300) }; }
    createBufferSource() { const n = node(); this.sources.push(n); return n; }
    createOscillator() { const n = node(); this.oscillators.push(n); return n; }
    decodeAudioData(data) { return Promise.resolve({ file: data.file, duration: 40 }); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  const sandbox = { AudioContext: Context, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {}, AbortController,
    fetch(url) { return new Promise((resolve, reject) => requests.push({ url, fail: reject, ok() { resolve({ ok: true, arrayBuffer: async () => ({ file: url }) }); } })); } };
  vm.runInNewContext(code, sandbox);
  return { ...sandbox.JianghuAudio, requests, contexts, storage };
}
(async () => {
  let h = harness();
  const p = h.preferences({ music: 3, effects: NaN, ambience: -1, muted: 'yes' }, true);
  assert.equal(p.music, 1); assert.equal(p.effects, .65); assert.equal(p.ambience, 0); assert.equal(p.muted, true);
  console.log('PASS 声音偏好兼容旧静音设置，拒绝非法音量');
  let a = h.create();
  a.update({ phase: 'service' });
  assert.equal(h.contexts.length, 0); assert.equal(h.requests.length, 0);
  await a.unlock(); await a.unlock(); await a.unlock();
  assert.equal(h.contexts.length, 1); assert.equal(h.requests.length, 1);
  h.requests[0].ok(); await drain();
  assert.equal(h.contexts[0].sources.filter(s => s.buffer?.file && s.started && !s.stopped).length, 1);
  console.log('PASS 用户操作前不播放；重复激活只创建一个上下文和一条配乐');
  a.update({ phase: 'prep' }); a.update({ phase: 'settlement' });
  h.requests[2].ok(); await drain(); h.requests[1].ok(); await drain();
  let tracks = h.contexts[0].sources.filter(s => s.buffer?.file && s.started && !s.stopped);
  assert.equal(tracks.length, 1); assert.match(tracks[0].buffer.file, /evening/);
  console.log('PASS 快速切换阶段、下载乱序返回时，只播放最后一段曲子');
  const c = h.contexts[0];
  a.set('muted', true); assert.equal(c.gains[0].gain.value, 0);
  assert.equal(JSON.parse(h.storage.get('yiguojianghu-audio-v1')).muted, true);
  a.set('muted', false); await drain(); assert.equal(c.gains[0].gain.value, .82);
  a.update({ hidden: true }); assert.equal(c.state, 'suspended');
  a.play('coin'); const count = c.oscillators.length;
  a.update({ hidden: false }); assert.equal(c.state, 'running');
  a.set('effects', 0); a.play('cat'); assert.equal(c.oscillators.length, count);
  a.set('effects', .7); a.play('cat'); assert.ok(c.oscillators.length > count);
  console.log('PASS 静音持久化、隐藏页面停声、音效单独音量生效');
  a.update({ opera: true }); assert.ok(c.gains[1].gain.value < .1);
  a.update({ opera: false, panel: false, paused: false }); assert.equal(c.gains[1].gain.value, a.settings.music);
  a.dispose(); assert.equal(c.state, 'closed');
  console.log('PASS 变脸时压低背景配乐，关闭播放器释放上下文');
  h = harness(); a = h.create(); await a.unlock(); h.requests[0].fail(new Error('offline')); await drain();
  assert.ok(a.info().error); a.play('coin'); assert.ok(h.contexts[0].oscillators.length > 0);
  a.retry(); assert.equal(h.requests.length, 2); h.requests[1].ok(); await drain(); assert.equal(a.info().error, ''); a.dispose();
  console.log('PASS 下载失败不影响互动音效，可重试恢复配乐');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../dist/assets/audio/credits.json')));
  for (const track of Object.values(h.TRACKS)) assert.ok(fs.statSync(path.join(__dirname, '../dist/assets/audio', track.file + '.mp3')).size > 10000);
  assert.equal(manifest.length, 3);
  console.log('PASS 三段随游戏发布的本地配乐均存在');
})().catch(error => { console.error(error); process.exitCode = 1; });
