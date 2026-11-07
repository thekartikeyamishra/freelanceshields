// lib/mascot.ts — lets any tool make the guide react, with no coupling.
export type Mood =
  | 'neutral' | 'happy' | 'grin' | 'laugh' | 'wink' | 'thinking' | 'surprised'
  | 'worried' | 'sad' | 'celebrate' | 'starstruck' | 'sleepy' | 'love' | 'cool'
  | 'confused' | 'nerd' | 'shy' | 'relieved' | 'sweat' | 'dizzy';

export interface MascotEventDetail { mood: Mood; message?: string }

export function mascotSay(mood: Mood, message?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<MascotEventDetail>('fs:mascot', { detail: { mood, message } }));
}
