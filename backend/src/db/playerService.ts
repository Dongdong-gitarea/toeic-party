import { getSupabase } from './supabase.js';

export interface DBPlayer {
  id: string;
  device_id: string;
  display_name: string;
  char_idx: number;
  total_xp: number;
  games_played: number;
  games_won: number;
  rank_tier: string;
}

// Get or create player by device ID (anonymous auth)
export async function getOrCreatePlayer(deviceId: string, name: string): Promise<DBPlayer | null> {
  const db = getSupabase();
  if (!db) return null;

  try {
    // Try to find existing
    const { data: existing } = await db
      .from('players')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (existing) {
      // Update name if changed
      if (existing.display_name !== name) {
        await db.from('players').update({ display_name: name, updated_at: new Date().toISOString() }).eq('id', existing.id);
      }
      return existing as DBPlayer;
    }

    // Create new
    const { data: newPlayer, error } = await db
      .from('players')
      .insert({ device_id: deviceId, display_name: name })
      .select()
      .single();

    if (error) {
      console.error('[DB] Create player error:', error.message);
      return null;
    }

    return newPlayer as DBPlayer;
  } catch (err) {
    console.error('[DB] getOrCreatePlayer error:', err);
    return null;
  }
}

// Update player stats after a game
export async function updatePlayerStats(
  deviceId: string,
  xpGain: number,
  won: boolean,
  displayName = 'Player',
): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  try {
    let { data: player } = await db
      .from('players')
      .select('id, total_xp, games_played, games_won')
      .eq('device_id', deviceId)
      .single();

    // Auto-create if first time
    if (!player) {
      const created = await getOrCreatePlayer(deviceId, displayName);
      if (!created) return;
      player = { id: created.id, total_xp: 0, games_played: 0, games_won: 0 };
    }

    const newXP = player.total_xp + xpGain;
    const newGames = player.games_played + 1;
    const newWins = player.games_won + (won ? 1 : 0);

    // Calculate rank tier
    let tier = 'bronze';
    if (newXP >= 5000) tier = 'diamond';
    else if (newXP >= 2000) tier = 'gold';
    else if (newXP >= 500) tier = 'silver';

    await db.from('players').update({
      total_xp: newXP,
      games_played: newGames,
      games_won: newWins,
      rank_tier: tier,
      updated_at: new Date().toISOString(),
    }).eq('id', player.id);

    // Update leaderboard
    const weekNum = getWeekString();
    for (const period of [weekNum, 'alltime']) {
      await db.from('leaderboard').upsert({
        player_id: player.id,
        period,
        total_score: period === 'alltime' ? newXP : xpGain,
        games_played: period === 'alltime' ? newGames : 1,
        wins: period === 'alltime' ? newWins : (won ? 1 : 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'player_id,period' });
    }
  } catch (err) {
    console.error('[DB] updatePlayerStats error:', err);
  }
}

function getWeekString(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
  return `weekly_${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
