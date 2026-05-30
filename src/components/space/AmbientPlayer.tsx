'use client';

import { useState, useRef, useCallback } from 'react';
import { Music, VolumeX } from 'lucide-react';

// Maps each mood to a drone frequency (Hz) and timbre character
const MOOD_AUDIO: Record<string, { freq: number; freq2: number; label: string }> = {
  lavender: { freq: 220,  freq2: 329,  label: 'Soft lavender drone' },
  sand:     { freq: 196,  freq2: 293,  label: 'Warm sand tones' },
  forest:   { freq: 130,  freq2: 196,  label: 'Deep forest hum' },
  ocean:    { freq: 174,  freq2: 261,  label: 'Ocean breath' },
  rose:     { freq: 246,  freq2: 369,  label: 'Rose bloom tone' },
  midnight: { freq: 110,  freq2: 164,  label: 'Midnight cosmic' },
};

interface AmbientPlayerProps {
  mood: string;
  accentColor: string;
}

export function AmbientPlayer({ mood, accentColor }: AmbientPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const ctxRef   = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);

  const stop = useCallback(() => {
    nodesRef.current.forEach(n => { try { (n as OscillatorNode).stop?.(); } catch {} });
    nodesRef.current = [];
    ctxRef.current?.close();
    ctxRef.current = null;
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    const config = MOOD_AUDIO[mood] ?? MOOD_AUDIO.lavender;
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Simple reverb via convolver
    const convolver = ctx.createConvolver();
    const length = ctx.sampleRate * 2.5;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.2);
      }
    }
    convolver.buffer = impulse;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3);
    masterGain.connect(ctx.destination);
    convolver.connect(masterGain);

    // Two layered sine oscillators per voice = pad-like sound
    const voices = [
      { freq: config.freq,      type: 'sine' as OscillatorType, gain: 0.5 },
      { freq: config.freq2,     type: 'sine' as OscillatorType, gain: 0.3 },
      { freq: config.freq * 2,  type: 'sine' as OscillatorType, gain: 0.12 },
      { freq: config.freq * 1.5, type: 'sine' as OscillatorType, gain: 0.08 },
    ];

    voices.forEach(({ freq, type, gain }) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      // Gentle vibrato
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.18;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 1.2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(convolver);
      osc.start();
      nodesRef.current.push(osc, lfo);
    });

    setPlaying(true);
  }, [mood]);

  function toggle() {
    if (playing) stop(); else start();
  }

  return (
    <button
      onClick={toggle}
      title={playing ? 'Stop ambient sound' : `Play ambient: ${MOOD_AUDIO[mood]?.label ?? 'drone'}`}
      style={{
        position: 'fixed', bottom: 22, right: 22, zIndex: 50,
        width: 44, height: 44, borderRadius: '50%',
        background: playing ? accentColor : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${accentColor}55`,
        boxShadow: playing ? `0 0 20px ${accentColor}66` : '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.3s ease',
        color: playing ? '#fff' : accentColor,
      }}
    >
      {playing ? <VolumeX size={18} /> : <Music size={18} />}
    </button>
  );
}
