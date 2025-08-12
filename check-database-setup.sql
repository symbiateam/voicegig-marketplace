-- Check what tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check table structures
\d public.profiles;
\d public.jobs;
\d public.submissions;
\d public.ledger;
\d public.payouts;

-- Check if views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- Check what data is in tables
SELECT 'profiles' as table_name, count(*) as count FROM public.profiles
UNION ALL
SELECT 'jobs', count(*) FROM public.jobs
UNION ALL
SELECT 'submissions', count(*) FROM public.submissions
UNION ALL
SELECT 'ledger', count(*) FROM public.ledger
UNION ALL
SELECT 'payouts', count(*) FROM public.payouts;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check existing RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check if storage bucket exists (if you have access)
-- This might not work depending on permissions
SELECT name, public
FROM storage.buckets
WHERE name = 'submissions';

-- Sample jobs data check
SELECT id, title, type, payment_amount, status
FROM public.jobs
LIMIT 5;
