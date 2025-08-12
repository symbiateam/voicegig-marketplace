-- 1. Check what tables exist in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check what views exist
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';

-- 3. Check if key tables exist and their row counts
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
    THEN 'profiles: EXISTS'
    ELSE 'profiles: MISSING'
  END as profiles_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs' AND table_schema = 'public')
    THEN 'jobs: EXISTS'
    ELSE 'jobs: MISSING'
  END as jobs_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions' AND table_schema = 'public')
    THEN 'submissions: EXISTS'
    ELSE 'submissions: MISSING'
  END as submissions_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ledger' AND table_schema = 'public')
    THEN 'ledger: EXISTS'
    ELSE 'ledger: MISSING'
  END as ledger_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payouts' AND table_schema = 'public')
    THEN 'payouts: EXISTS'
    ELSE 'payouts: MISSING'
  END as payouts_status;
