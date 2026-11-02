import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkGeminiRateLimit, getRateLimitUserId, askCaminoGemini } from '../services/geminiService';
import { supabaseService } from '../services/supabaseClient';
import { authDatabaseService } from '../services/authDatabaseService';

describe('Gemini Rate Limiter Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authDatabaseService.setCurrentSession(null);
  });

  it('generates or returns a valid user ID for rate limiting', () => {
    authDatabaseService.setCurrentSession('student@example.com');
    expect(getRateLimitUserId()).toBe('student@example.com');

    authDatabaseService.setCurrentSession(null);
    const anonId = getRateLimitUserId();
    expect(anonId).toBeTruthy();
    expect(typeof anonId).toBe('string');
  });

  it('fails open gracefully when Supabase client is offline or unavailable', async () => {
    vi.spyOn(supabaseService, 'getClient').mockReturnValue(null);

    const status = await checkGeminiRateLimit();
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(20);
    expect(status.resetInSeconds).toBe(0);
  });

  it('enforces rate limit when Supabase reports limit exceeded', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, current_count: 20, remaining_calls: 0, reset_in_seconds: 35 }],
      error: null
    });

    vi.spyOn(supabaseService, 'getClient').mockReturnValue({
      rpc: mockRpc
    } as any);

    const status = await checkGeminiRateLimit('test_user');
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.resetInSeconds).toBe(35);
    expect(mockRpc).toHaveBeenCalledWith('check_gemini_rate_limit', {
      p_user_id: 'test_user',
      p_max_requests: 20,
      p_window_seconds: 60
    });
  });

  it('askCaminoGemini returns friendly rate limit notice when limit is reached', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: [{ allowed: false, current_count: 20, remaining_calls: 0, reset_in_seconds: 42 }],
      error: null
    });

    vi.spyOn(supabaseService, 'getClient').mockReturnValue({
      rpc: mockRpc
    } as any);

    const response = await askCaminoGemini('¿Cómo estás?');
    expect(response.source).toBe('fallback');
    expect(response.text).toContain('límite de 20 preguntas por minuto');
    expect(response.text).toContain('42 segundos');
  });
});
