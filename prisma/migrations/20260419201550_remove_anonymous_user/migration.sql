-- Remove the legacy anonymous user (replaced by Supabase-authenticated users).
DELETE FROM "users" WHERE "email" = 'anonymous@local';
