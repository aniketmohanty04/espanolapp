import { speakSpanish as speakSpanishNative } from './spanishSpeechService';

// Audio SFX muted per previous request, but Spanish educational speech synthesis is active
class SoundService {
  public setMuted(_muted: boolean): void {}
  public getIsMuted(): boolean {
    return true;
  }
  public speakSpanish(text: string, rate: number = 0.88): void {
    speakSpanishNative(text, { rate });
  }
  public playCorrect(): void {}
  public playIncorrect(): void {}
  public playCoinReward(): void {}
  public playWrong(): void {}
  public playLevelComplete(): void {}
  public playVictoryFanfare(): void {}
  public playClick(): void {}
}

export const soundService = new SoundService();
