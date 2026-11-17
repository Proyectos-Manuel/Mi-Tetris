/*
# Create high scores table for Tetris game

1. New Tables
- `high_scores`
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, player name shown on the leaderboard, not null)
  - `score` (integer, points achieved in the run, not null)
  - `lines` (integer, total lines cleared in the run, not null)
  - `level` (integer, level reached in the run, not null)
  - `created_at` (timestamp, when the score was recorded)
2. Security
- Enable RLS on `high_scores`.
- Grant SELECT and INSERT to `anon` and `authenticated` (no sign-in in this app; players submit scores without an account).
- Policies: everyone can read the leaderboard and insert new scores. No UPDATE or DELETE granted, so nobody can tamper with existing records.
3. Notes
- Single-tenant, no-auth app: policies are scoped `TO anon, authenticated` with `USING (true)` because the leaderboard is intentionally public/shared.
- Insert is validated server-side only for shape (name <= 20 chars, non-negative numbers) via a WITH CHECK policy to prevent junk rows.
*/

CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  score integer NOT NULL,
  lines integer NOT NULL,
  level integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON high_scores TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_high_scores" ON high_scores;
CREATE POLICY "anon_select_high_scores" ON high_scores
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon_insert_high_scores" ON high_scores;
CREATE POLICY "anon_insert_high_scores" ON high_scores
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) > 0
  AND char_length(name) <= 20
  AND score >= 0
  AND score <= 100000000
  AND lines >= 0
  AND lines <= 100000
  AND level >= 0
  AND level <= 1000
);