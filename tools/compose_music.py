"""Original, deterministic game score. No samples or external compositions.

Rebuild: python3 tools/compose_music.py (numpy + scipy + ffmpeg required).
The browser only needs the checked-in MP3 files, never these build dependencies.
"""
from pathlib import Path
import json
import subprocess
import tempfile
import numpy as np
from scipy.io.wavfile import write
from scipy.signal import butter, sosfilt

SR = 32000
OUT = Path(__file__).resolve().parents[1] / 'work/procedural-audio'
rng = np.random.default_rng(1101)


def note(midi, duration, voice):
    t = np.arange(max(1, int(duration * SR))) / SR
    f = 440 * 2 ** ((midi - 69) / 12)
    if voice == 'dizi':
        vibrato = .0025 * np.sin(2 * np.pi * 5.1 * t) * np.minimum(1, t * 3)
        pitch = f * (1 + vibrato - .022 * np.exp(-t * 33))
        phase = 2 * np.pi * np.cumsum(pitch) / SR
        x = sum(a * np.sin(h * phase) for h, a in [(1, 1), (2, .25), (3, .16), (4, .06)])
        breath = sosfilt(butter(2, [900, 4200], btype='bandpass', fs=SR, output='sos'), rng.normal(0, 1, len(t)))
        x += breath * .05
        env = np.minimum(1, t / .075) * np.minimum(1, (duration - t) / .12)
        return x * env * (.88 + .12 * np.cos(2 * np.pi * 2.1 * t)) * .33
    if voice in ('pipa', 'yangqin', 'ruan'):
        decay = {'pipa': 2.2, 'yangqin': 1.6, 'ruan': 2.7}[voice]
        x = np.zeros(len(t))
        for h in range(1, 12):
            detune = 1 + (h * h * .00022 if voice == 'yangqin' else 0)
            x += np.sin(2 * np.pi * f * h * detune * t) * np.exp(-t * decay * (1 + h * .28)) / h ** 1.35
        env = np.minimum(1, t / .004) * np.minimum(1, (duration - t) / .06)
        return x * env * .42
    if voice == 'wood':
        return (np.sin(2 * np.pi * 780 * t) + .6 * np.sin(2 * np.pi * 1230 * t)) * np.exp(-t * 55) * np.minimum(1, t / .002) * .45
    if voice == 'bass':
        x = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t) + .09 * np.sin(6 * np.pi * f * t)
        return x * np.minimum(1, t / .012) * np.minimum(1, (duration - t) / .05) * np.exp(-t * 3.7) * .55
    if voice == 'brush':
        x = sosfilt(butter(2, [1900, 7500], btype='bandpass', fs=SR, output='sos'), rng.normal(0, 1, len(t)))
        return x * np.minimum(1, t / .006) * np.exp(-t * 24) * .5
    if voice == 'drum':
        phase = 2 * np.pi * (64 * t + 1.8 * (1 - np.exp(-t * 24)))
        return (np.sin(phase) * np.exp(-t * 10) + rng.normal(0, .10, len(t)) * np.exp(-t * 40)) * np.minimum(1, t / .003) * .6
    if voice == 'gong':
        x = sum(np.sin(2 * np.pi * 200 * h * t) * np.exp(-t * (1.7 + i * .35)) / (i + 1)
                for i, h in enumerate([1, 1.47, 2.12, 2.63, 3.9, 5.2]))
        return x * np.minimum(1, t / .006) * np.minimum(1, (duration - t) / .1) * .3
    raise ValueError(voice)


# An original call-and-answer melody: upward invitation, cheeky reply, long breath.
MELODY = [
    [(0, 69, .5), (.75, 74, .75), (1.5, 77, .5), (2.25, 76, .5), (3, 74, .8)],
    [(0, 72, .7), (1, 69, .6), (2, 67, .5), (2.75, 69, .9)],
    [(0, 65, .5), (.75, 67, .5), (1.5, 69, 1.1), (3, 72, .65)],
    [(0, 74, 1.35), (2, 69, .5), (3, 67, .65)],
    [(0, 69, .5), (.5, 72, .5), (1.25, 74, .6), (2.25, 77, 1.2)],
    [(0, 79, .7), (1, 77, .6), (2, 74, .7), (3, 72, .6)],
    [(0, 69, .7), (1, 67, .5), (1.75, 65, .7), (3, 67, .5)],
    [(0, 69, .75), (1.25, 65, .65), (2.25, 62, 1.4)],
]
CHORDS = [(50, 57, 62, 65), (48, 55, 60, 64), (46, 53, 58, 62), (45, 52, 57, 62),
          (50, 57, 62, 65), (53, 60, 65, 69), (48, 55, 60, 67), (50, 57, 62, 65)]


def compose(key, title, bpm, bars):
    beat = 60 / bpm
    n = round(bars * 4 * beat * SR)
    mix = np.zeros((n, 2), dtype=np.float64)

    def add(at, midi, length, voice, vol=1, pan=0):
        wave = note(midi, length * beat, voice) * vol
        idx = (round(at * beat * SR) + np.arange(len(wave))) % n
        np.add.at(mix[:, 0], idx, wave * np.sqrt((1 - pan) / 2))
        np.add.at(mix[:, 1], idx, wave * np.sqrt((1 + pan) / 2))

    for bar in range(bars):
        chord = CHORDS[bar % 8]
        base = bar * 4
        quiet = key == 'evening'
        energetic = key == 'service'
        # Spacious rounded lute bass and alternating, slightly swung plucks.
        add(base, chord[0], 2.9, 'ruan', .38 if quiet else .51, -.05)
        add(base + 2.25, chord[1] - 12, 1.55, 'ruan', .24, .05)
        rhythm = [0, 1.25, 2, 3.25] if quiet else [0, .55, 1.25, 2, 2.55, 3.25]
        for j, at in enumerate(rhythm):
            add(base + at, chord[1 + j % 3] + (12 if bar % 8 >= 4 and j % 3 == 2 else 0),
                1.6, 'pipa', .24 if quiet else .34, -.38)
        phrase = MELODY[bar % 8]
        if bar // 8 % 2:
            phrase = [(at, m + (12 if i == len(phrase) - 1 and bar % 4 == 1 else 0), dur)
                      for i, (at, m, dur) in enumerate(phrase)]
        for j, (at, midi, length) in enumerate(phrase):
            if quiet and j % 2 and bar % 2 == 0:
                continue
            voice = 'dizi' if (bar // 4) % 2 == 0 or quiet else 'yangqin'
            # Four-bar conversations leave air between bamboo flute and dulcimer.
            add(base + at, midi - (12 if quiet else 0), length * (1.25 if quiet else 1),
                voice, .49 if quiet else .60, .24 if voice == 'dizi' else .36)
        if not quiet:
            # A low, syncopated street-band groove under the folk instruments.
            for at, pitch, volume in [(0, chord[0] - 12, .5), (1.6, chord[0] - 12, .30),
                                       (2.5, chord[1] - 12, .39), (3.5, chord[0], .26)]:
                add(base + at, pitch, .55, 'bass', volume if energetic else volume * .50)
            for at in ([.1, .65, 1.1, 1.65, 2.1, 2.65, 3.1, 3.65] if energetic else [1.1, 3.1]):
                add(base + at, 0, .35, 'brush', .13 if energetic else .07, -.18)
            for at in [0, 2]:
                add(base + at, 0, .55, 'drum', .20 if energetic else .10)
            for at in ([.65, 1.1, 2.65, 3.1, 3.65] if energetic else [1.5, 3.5]):
                add(base + at, 0, .25, 'wood', .13 if energetic else .07, .2)
            if bar % 8 == 0:
                add(base, 0, 3, 'gong', .12 if energetic else .07, -.2)
            if energetic and bar % 4 == 3:
                for j in range(4):
                    add(base + 3 + j * .25, [74, 72, 69, 67][j], .7, 'pipa', .18, -.3)
        if bar % 4 == 3:
            add(base + 3.5, chord[-1] + 12, 2, 'yangqin', .15, .45)
    dry = mix.copy()
    # Circular reflections also wrap around the loop boundary, so tails never cut.
    for seconds, gain in [(.071, .12), (.137, .09), (.233, .075), (.347, .055), (.491, .035)]:
        mix += np.roll(dry[:, ::-1], round(seconds * SR), axis=0) * gain
    mix -= mix.mean(axis=0)
    mix *= min(.14 / np.sqrt(np.mean(mix ** 2)), .85 / np.max(np.abs(mix)))
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as folder:
        wav = Path(folder) / (key + '.wav')
        write(wav, SR, np.int16(np.clip(mix, -1, 1) * 32767))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-codec:a', 'libmp3lame',
                        '-b:a', '128k', '-metadata', 'title=' + title, '-metadata', 'artist=一锅江湖 · 原创器乐',
                        str(OUT / (key + '.mp3'))], check=True)
    return {'file': key + '.mp3', 'title': title, 'bpm': bpm, 'bars': bars,
            'seconds': round(n / SR, 4), 'rms': round(float(np.sqrt(np.mean(mix ** 2))), 4),
            'peak': round(float(np.max(np.abs(mix))), 4), 'source': 'Original procedural composition; no third-party samples'}


if __name__ == '__main__':
    manifest = [compose('opening', '临江坡开张', 96, 16),
                compose('service', '锅里有江湖', 108, 32),
                compose('evening', '收锅听晚风', 76, 16)]
    (OUT / 'credits.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
