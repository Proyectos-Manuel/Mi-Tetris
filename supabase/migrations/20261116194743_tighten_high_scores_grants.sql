/*
# Tighten grants on high_scores

1. Modified tables
- `high_scores`: the initial migration accidentally granted UPDATE and DELETE
  to `anon` and `authenticated`. No UPDATE/DELETE policies exist, so those
  verbs fail anyway, but the privileges should not be there at all.
2. Security changes
- Revoke UPDATE and DELETE from `anon` and `authenticated` so the roles can
  only read the leaderboard and insert new scores.
*/

REVOKE UPDATE, DELETE ON high_scores FROM anon, authenticated;