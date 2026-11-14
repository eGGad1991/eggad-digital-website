# Supabase Storage policy files

The SQL files in this folder are retained policy snapshots for the `portfolio-media` bucket.

- `SUPABASE_STORAGE_POLICIES.sql`
- `storage-policies.sql`

They express similar access intent but use different policy names. Do not execute both scripts blindly in sequence: they can create overlapping policies with different names. Review the existing policies in Supabase first and maintain one authoritative migration/script going forward.
