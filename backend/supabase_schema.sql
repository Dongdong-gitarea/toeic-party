-- TOEIC PARTY — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run

-- ══════════════════════════════════════
-- 1. Players (anonymous accounts)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,          -- fingerprint / localStorage ID
  display_name TEXT NOT NULL DEFAULT 'Player',
  char_idx INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  rank_tier TEXT NOT NULL DEFAULT 'bronze', -- bronze/silver/gold/diamond
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════
-- 2. Match History
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  question_count INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  rank_position INTEGER NOT NULL,       -- 1-4
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  avg_response_ms INTEGER NOT NULL DEFAULT 0
);

-- ══════════════════════════════════════
-- 3. Saved Words (personal vocabulary)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  correct_answer TEXT NOT NULL DEFAULT '',
  definition TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL DEFAULT '',       -- Chinese
  pos TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  starred BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, word)
);

-- ══════════════════════════════════════
-- 4. Leaderboard (weekly/all-time)
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                  -- 'weekly_2026-W19' or 'alltime'
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, period)
);

-- ══════════════════════════════════════
-- 5. Row Level Security (RLS)
-- ══════════════════════════════════════
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Players: anyone can read, only owner can update
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Players can update own record" ON players FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);

-- Matches: readable by all
CREATE POLICY "Matches are viewable" ON matches FOR SELECT USING (true);
CREATE POLICY "Server can insert matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Server can update matches" ON matches FOR UPDATE USING (true);

-- Match players: readable by all
CREATE POLICY "Match players viewable" ON match_players FOR SELECT USING (true);
CREATE POLICY "Server can insert match_players" ON match_players FOR INSERT WITH CHECK (true);

-- Saved words: owner only
CREATE POLICY "Users see own words" ON saved_words FOR SELECT USING (true);
CREATE POLICY "Users insert own words" ON saved_words FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own words" ON saved_words FOR UPDATE USING (true);
CREATE POLICY "Users delete own words" ON saved_words FOR DELETE USING (true);

-- Leaderboard: readable by all
CREATE POLICY "Leaderboard is public" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Server can upsert leaderboard" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Server can update leaderboard" ON leaderboard FOR UPDATE USING (true);

-- ══════════════════════════════════════
-- 6. Indexes
-- ══════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_players_device ON players(device_id);
CREATE INDEX IF NOT EXISTS idx_saved_words_player ON saved_words(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period_score ON leaderboard(period, total_score DESC);
