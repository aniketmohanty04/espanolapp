// Audio and speech completely removed per user request
class SoundService {
  public setMuted(_muted: boolean): void {}
  public getIsMuted(): boolean {
    return true;
  }
  public speakSpanish(_text: string, _rate: number = 0.9): void {}
  public playCorrect(): void {}
  public playIncorrect(): void {}
  public playCoinReward(): void {}
  public playWrong(): void {}
  public playLevelComplete(): void {}
  public playVictoryFanfare(): void {}
  public playClick(): void {}
}

export const soundService = new SoundService();
