import { getSupabase } from './supabase.js';
import type { FinalRankEntry } from '../types.js';

// Save a completed match to the database
export async function saveMatch(
  roomId: string,
  rankings: FinalRankEntry[],
  startedAt: Date,
): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  try {
    // Create match record
    const { data: match, error: matchErr } = await db
      .from('matches')
      .insert({
        room_id: roomId,
        started_at: startedAt.toISOString(),
        ended_at: new Date().toISOString(),
        question_count: 10,
      })
      .select('id')
      .single();

    if (matchErr || !match) {
      console.error('[DB] saveMatch error:', matchErr?.message);
      return;
    }

    // Insert player results
    const rows = rankings.map((r, i) => ({
      match_id: match.id,
      player_name: r.name,
      is_ai: r.isAI,
      rank_position: i + 1,
      score: r.score,
      correct_count: r.correctCount,
      max_combo: r.maxCombo,
      avg_response_ms: r.avgResponseTime,
    }));

    const { error: playersErr } = await db.from('match_players').insert(rows);
    if (playersErr) {
      console.error('[DB] saveMatch players error:', playersErr.message);
    }
  } catch (err) {
    console.error('[DB] saveMatch error:', err);
  }
}

// Get leaderboard
export async function getLeaderboard(
  period: 'alltime' | 'weekly',
  limit = 20,
): Promise<{ name: string; score: number; games: number; wins: number }[]> {
  const db = getSupabase();
  if (!db) return [];

  try {
    const periodKey = period === 'weekly' ? `weekly_${getWeekString()}` : 'alltime';

    const { data, error } = await db
      .from('leaderboard')
      .select('total_score, games_played, wins, players(display_name)')
      .eq('period', periodKey)
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row: any) => ({
      name: row.players?.display_name ?? 'Unknown',
      score: row.total_score,
      games: row.games_played,
      wins: row.wins,
    }));
  } catch {
    return [];
  }
}

function getWeekString(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
