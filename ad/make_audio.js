// Synthesizes the 30s soundtrack (120 BPM, A minor) -> audio.wav. Pure Node, no deps.
const fs = require('fs');
const SR = 44100, DUR = 30, N = SR * DUR, BEAT = 0.5;
const mk = () => new Float32Array(N);
const drums = [mk(), mk()], music = [mk(), mk()], fx = [mk(), mk()], send = mk();
let seed = 1337; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
const add = (bus, t, i, v, p = 0, snd = 0) => { const k = (t * SR + i) | 0; if (k < 0 || k >= N) return; const [l, r] = pan(p); bus[0][k] += v * l; bus[1][k] += v * r; send[k] += v * snd; };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function lp(x, f) { const a = 1 - Math.exp(-2 * Math.PI * f / SR); let y = 0; return x.map(v => (y += a * (v - y))); }
function hp(x, f) { const l = lp(x, f); return x.map((v, i) => v - l[i]); }

function kick(t, g = 1) {
  const len = 0.45 * SR; let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, f = 46 + 130 * Math.exp(-tt * 28);
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-tt * 7) * 1.0 + (i < 60 ? rnd() * 0.5 : 0);
    add(drums, t, i, v * g);
  }
}
function noiseBurst(bus, t, dur, g, lo, hi, dec, p = 0, snd = 0) {
  const n = (dur * SR) | 0; let x = new Float32Array(n).map(() => rnd());
  x = hp(x, lo); if (hi) x = lp(x, hi);
  for (let i = 0; i < n; i++) add(bus, t, i, x[i] * Math.exp(-(i / SR) * dec) * g, p, snd);
}
function clap(t, g = 0.8) { [0, 0.011, 0.023].forEach((o, k) => noiseBurst(drums, t + o, k < 2 ? 0.02 : 0.22, g * (k < 2 ? 0.7 : 1), 900, 5200, k < 2 ? 90 : 16, 0, 0.35)); }
function hat(t, g = 0.3, open = false, p = 0.2) { noiseBurst(drums, t, open ? 0.22 : 0.05, g, 7000, 0, open ? 18 : 90, p); }
function snareRoll(t, g = 0.5) { noiseBurst(drums, t, 0.09, g, 1200, 7000, 30, 0, 0.2); }

function tone(bus, t, dur, f, g, o) { // generic synth voice
  const n = (dur * SR) | 0, {wave = 'saw', att = 0.004, dec = 3, cut = 4000, cutDec = 0, p = 0, snd = 0, det = 0, sub = 0} = o || {};
  let ph1 = 0, ph2 = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR, env = Math.min(1, tt / att) * Math.exp(-tt * dec) * Math.min(1, (dur - tt) / 0.03);
    ph1 += f / SR; ph2 += f * (1 + det) / SR;
    const s = (w, ph) => w === 'saw' ? 2 * (ph % 1) - 1 : w === 'tri' ? 4 * Math.abs((ph % 1) - 0.5) - 1 : w === 'sq' ? ((ph % 1) < 0.5 ? 1 : -1) : Math.sin(2 * Math.PI * ph);
    let v = s(wave, ph1) + (det ? s(wave, ph2) : 0);
    if (sub) v += Math.sin(2 * Math.PI * ph1 * 0.5) * sub;
    const c = cut * (cutDec ? Math.exp(-tt * cutDec) * 0.85 + 0.15 : 1), a = 1 - Math.exp(-2 * Math.PI * c / SR);
    y += a * (v - y);
    add(bus, t, i, y * env * g, p, snd);
  }
}
const pluck = (t, m, g = 0.22, p = 0, d = 0.32) => tone(music, t, d, hz(m), g, { wave: 'saw', dec: 9, cut: 5200, cutDec: 14, p, snd: 0.5, det: 0.004 });
const bass = (t, m, d = 0.46, g = 0.5) => tone(music, t, d, hz(m), g, { wave: 'saw', dec: 2.5, cut: 420, cutDec: 6, sub: 0.9, att: 0.006 });
const pad = (t, d, ms, g = 0.07) => ms.forEach((m, k) => tone(music, t, d, hz(m), g, { wave: 'saw', att: 0.4, dec: 0.15, cut: 1600, det: 0.006, p: (k - 1) * 0.5, snd: 0.6 }));

function riser(t0, t1, g = 0.5) {
  const n = ((t1 - t0) * SR) | 0; let x = new Float32Array(n).map(() => rnd()), o = new Float32Array(n);
  const step = 2048;
  for (let s = 0; s < n; s += step) { const u = s / n, f = 300 + 9000 * u * u, seg = hp(x.slice(s, s + step), f); for (let i = 0; i < seg.length; i++) o[s + i] = seg[i]; }
  for (let i = 0; i < n; i++) { const u = i / n; add(fx, t0, i, o[i] * u * u * g, Math.sin(u * 20) * 0.6, 0.3); }
}
function revCymbal(t1, len = 1.6, g = 0.45) { const t0 = t1 - len, n = (len * SR) | 0; let x = hp(new Float32Array(n).map(() => rnd()), 4000); for (let i = 0; i < n; i++) { const u = i / n; add(fx, t0, i, x[i] * Math.pow(u, 3) * g, 0, 0.3); } }
function boom(t, g = 0.9) { // impact
  kick(t, 1.1);
  const n = 1.6 * SR; let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; ph += 2 * Math.PI * (38 + 40 * Math.exp(-tt * 9)) / SR; add(fx, t, i, Math.sin(ph) * Math.exp(-tt * 2.6) * g); }
  noiseBurst(fx, t, 1.4, 0.35, 200, 6000, 3.2, 0, 0.7);
}
function whoosh(t, len = 0.5, g = 0.28, up = true) { const n = (len * SR) | 0; let x = new Float32Array(n).map(() => rnd()); const o = new Float32Array(n); for (let s = 0; s < n; s += 1024) { const u = s / n, f = up ? 400 + 5000 * u : 5400 - 5000 * u, seg = lp(hp(x.slice(s, s + 1024), f * 0.4), f); for (let i = 0; i < seg.length; i++) o[s + i] = seg[i]; } for (let i = 0; i < n; i++) { const u = i / n, e = Math.sin(Math.PI * u); add(fx, t, i, o[i] * e * g * 2, (up ? -1 : 1) * (u * 2 - 1) * 0.7, 0.2); } }
function ping(t, m, g = 0.28) { tone(fx, t, 0.6, hz(m), g, { wave: 'sin', dec: 6, snd: 0.6, att: 0.002 }); tone(fx, t, 0.6, hz(m) * 2.76, g * 0.25, { wave: 'sin', dec: 12, att: 0.002 }); }
function blip(t, m, g = 0.2, p = 0) { tone(fx, t, 0.12, hz(m), g, { wave: 'sq', dec: 24, cut: 3000, p, snd: 0.25, att: 0.001 }); }
function thud(t, g = 0.9) { kick(t, 1.1); noiseBurst(fx, t, 0.25, g * 0.5, 100, 2500, 22, 0, 0.3); }
function tick(t, g = 0.22, f = 2200) { tone(fx, t, 0.03, f, g, { wave: 'sin', dec: 90, att: 0.0005 }); }

// ---------- arrangement ----------
const chords = [ // Am F C G : [bass midi, chord tones]
  [33, [57, 60, 64, 69]], [29, [53, 57, 60, 65]], [36, [55, 60, 64, 67]], [31, [55, 59, 62, 67]],
];
const bar = (b) => b * 4 * BEAT;
const inFull = (t) => (t >= 4 && t < 24) || (t >= 26 && t < 30);

// 0-4 tension: drone, accelerating hats, question blips, roll, riser
tone(music, 0, 4, 55, 0.35, { wave: 'saw', att: 1.5, dec: -0.15, cut: 300, sub: 1, snd: 0.2 });
tone(music, 0, 4, 82.4, 0.10, { wave: 'saw', att: 2.5, dec: -0.2, cut: 900, det: 0.01, snd: 0.5 });
for (let i = 0; i < 8; i++) tick(0.25 + i * 0.5, 0.12, 1500); // clock/heartbeat
for (let t = 2; t < 4; t += 0.25) hat(t, 0.08 + (t - 2) * 0.1);
[1.0, 1.5, 2.0, 2.5, 3.0, 3.25, 3.5, 3.75].forEach((t, i) => blip(t, [69, 72, 76, 69, 72, 76, 81, 84][i], 0.16, i % 2 ? 0.5 : -0.5));
[3.0, 3.25, 3.5, 3.625, 3.75, 3.8125, 3.875, 3.9375].forEach((t, i) => snareRoll(t, 0.25 + i * 0.05));
riser(0.4, 4.0, 0.5); revCymbal(4.0, 1.6, 0.5);
boom(4.0);

// 4-24 & 26-30 groove
for (let b = 2; b < 15; b++) {
  const t0 = bar(b); if (t0 >= 24 && t0 < 26) continue;
  const [bm, ch] = chords[(b - 2) % 4];
  const big = t0 >= 20 && t0 < 24; // montage = busier
  for (let s = 0; s < 4; s++) {
    const t = t0 + s * BEAT;
    kick(t, 0.95);
    if (s % 2 === 1) clap(t, 0.7);
    hat(t + BEAT / 2, 0.3, s === 3, 0.25);
    if (big || t0 >= 26) { hat(t + BEAT / 4, 0.12, false, -0.3); hat(t + BEAT * 0.75, 0.12, false, 0.3); }
    // bass: offbeat pump rolling 8ths
    bass(t, bm, 0.22, 0.5); bass(t + BEAT / 2, bm + (s % 2 ? 12 : 0), 0.22, 0.42);
  }
  // 16th arp
  const pat = [0, 2, 1, 3, 2, 1, 3, 2, 0, 3, 1, 2, 3, 2, 1, 0];
  for (let i = 0; i < 16; i++) { if (t0 < 6 && i % 2) continue; const m = ch[pat[i]] + (i % 8 === 7 ? 12 : 0); pluck(t0 + i * BEAT / 4, m, 0.16 + (i % 4 === 0 ? 0.06 : 0), Math.sin(i) * 0.6); }
  pad(t0, 2, ch.slice(0, 3).map(m => m - 12), 0.05);
  // lead hook in the montage & finale
  if (big || t0 >= 26) { const hook = [76, 74, 72, 76, 79, 76, 74, 72]; hook.forEach((m, i) => tone(music, t0 + i * BEAT / 2, 0.24, hz(m), 0.11, { wave: 'sq', dec: 5, cut: 3200, snd: 0.6, att: 0.004 })); }
}
// scene whooshes/hits on each 2s cut
[6, 8, 10, 14, 16, 18].forEach(t => { whoosh(t - 0.35, 0.35); tick(t, 0.3, 1000); });
whoosh(11.65, 0.35); thud(12.0, 0.8); noiseBurst(fx, 12, 0.5, 0.3, 300, 3000, 8, 0, 0.5); // permit stamp
ping(6.0, 88, 0.3); ping(6.5, 93, 0.25); // whatsapp/phone
[7.0, 7.125, 7.25, 7.375, 7.5].forEach((t, i) => tick(t, 0.12, 2600 + i * 80)); // typing
for (let i = 0; i < 16; i++) tick(18.0 + i * 0.125, 0.14, 1800 + i * 90); // calculator ticks
ping(19.75, 96, 0.3);
for (let i = 0; i < 8; i++) { const t = 20 + i * 0.5; noiseBurst(fx, t, 0.05, 0.25, 800, 6000, 80, i % 2 ? .4 : -.4, 0.2); } // photo-cut shutter clicks
// key jingle + door (montage end ~ 23.x)
[91, 96, 100].forEach((m, i) => tone(fx, 23.0 + i * 0.09, 0.7, hz(m), 0.13, { wave: 'sin', dec: 5, snd: 0.7 }));

// 24-26 breakdown: pad + soft bass, no kick, riser into the final drop
pad(24, 2, [57, 60, 64, 67], 0.09); tone(music, 24, 2, 55, 0.3, { wave: 'saw', dec: 0.5, cut: 260, sub: 1 });
[0, 0.5, 1, 1.5].forEach((o, i) => pluck(24 + o, [69, 72, 76, 81][i], 0.14, i % 2 ? .5 : -.5, 0.6));
riser(24.5, 26.0, 0.55); revCymbal(26.0, 1.2, 0.4); for (let i = 0; i < 8; i++) snareRoll(25 + i * 0.125, 0.15 + i * 0.05);
boom(26.0, 1.0);
// final stab + button
[57, 60, 64, 69].forEach((m, k) => tone(music, 29.0, 1.0, hz(m + 12), 0.09, { wave: 'saw', dec: 1.8, cut: 3500, det: 0.005, snd: 0.7, p: (k - 1.5) * 0.4 }));
boom(29.0, 0.7); ping(29.5, 100, 0.16);

// ---------- mix ----------
function reverb(inp) { // Schroeder-ish stereo
  const out = [new Float32Array(N), new Float32Array(N)];
  const combs = [[0.0297, 0.84], [0.0371, 0.83], [0.0411, 0.82], [0.0437, 0.81]];
  const ap = [0.005, 0.0017];
  for (let ch = 0; ch < 2; ch++) {
    const acc = new Float32Array(N);
    for (const [d, g] of combs) { const D = ((d + ch * 0.0013) * SR) | 0, buf = new Float32Array(N); for (let i = 0; i < N; i++) { const v = inp[i] + (i >= D ? buf[i - D] * g : 0); buf[i] = v; acc[i] += v * 0.25; } }
    let x = acc; for (const d of ap) { const D = (d * SR) | 0, y = new Float32Array(N); for (let i = 0; i < N; i++) y[i] = -0.5 * x[i] + (i >= D ? x[i - D] + 0.5 * y[i - D] : 0); x = y; }
    out[ch] = lp(x, 6500);
  }
  return out;
}
// sidechain duck from kicks
const duck = new Float32Array(N).fill(1);
for (let b = 2; b < 15; b++) { const t0 = bar(b); if (t0 >= 24 && t0 < 26) continue; for (let s = 0; s < 4; s++) { const k = ((t0 + s * BEAT) * SR) | 0; for (let i = 0; i < 0.22 * SR && k + i < N; i++) duck[k + i] = Math.min(duck[k + i], 1 - 0.7 * Math.exp(-(i / SR) / 0.07)); } }
const rev = reverb(send);
const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const d = duck[i];
  L[i] = drums[0][i] * 0.9 + music[0][i] * d * 0.95 + fx[0][i] + rev[0][i] * 0.5;
  R[i] = drums[1][i] * 0.9 + music[1][i] * d * 0.95 + fx[1][i] + rev[1][i] * 0.5;
}
// dropout right before the drops for impact
const carve = (a, b) => { for (let i = (a * SR) | 0; i < (b * SR) | 0; i++) { L[i] *= 0.15; R[i] *= 0.15; } };
// master: soft clip, normalize, fade
let peak = 0; for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 1.3); R[i] = Math.tanh(R[i] * 1.3); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const norm = 0.92 / peak;
for (let i = 0; i < N; i++) { const f = Math.min(1, (N - i) / (0.35 * SR)), fi = Math.min(1, i / (0.02 * SR)); L[i] *= norm * f * fi; R[i] *= norm * f * fi; }
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE((L[i] * 32767) | 0, 44 + i * 4); buf.writeInt16LE((R[i] * 32767) | 0, 46 + i * 4); }
fs.writeFileSync(__dirname + '/audio.wav', buf);
console.log('audio.wav written, peak was', peak.toFixed(2));
