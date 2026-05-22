/** Browser Speech Synthesis helpers (client-only). */

export const SPEECH_RATE = 0.95;
export const SPEECH_PITCH = 1;
export const SPEECH_LANG = "en-US";

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function voiceScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;
  if (lang.startsWith("en-us")) score += 10;
  else if (lang.startsWith("en-gb")) score += 8;
  else if (lang.startsWith("en")) score += 5;
  if (name.includes("google us english")) score += 50;
  if (name.includes("google uk english")) score += 45;
  if (name.includes("microsoft") && name.includes("english")) score += 35;
  if (name.includes("samantha") || name.includes("daniel")) score += 20;
  if (voice.default && score < 5) score += 3;
  return score;
}

export function pickPreferredEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : voices;
  return [...pool].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
}

export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const onChange = () => {
      synth.removeEventListener("voiceschanged", onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", onChange);
    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onChange);
      resolve(synth.getVoices());
    }, 500);
  });
}

export function createLessonUtterance(
  text: string,
  voice: SpeechSynthesisVoice | null,
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? SPEECH_LANG;
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  if (voice) utterance.voice = voice;
  return utterance;
}

export function cancelSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function pauseSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.resume();
}

export function isSpeechPaused(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.paused;
}
