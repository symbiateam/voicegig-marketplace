-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    stripe_account_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
    payment_amount DECIMAL(10,2) NOT NULL,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ledger table for financial transactions
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'paid', 'failed')),
    stripe_transfer_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_balances view
CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT
    user_id,
    COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as available,
    COALESCE((
        SELECT SUM(s.job_payment)
        FROM (
            SELECT DISTINCT s.id, j.payment_amount as job_payment
            FROM submissions s
            JOIN jobs j ON s.job_id = j.id
            WHERE s.user_id = l.user_id AND s.status = 'submitted'
        ) s
    ), 0) as pending,
    COALESCE((
        SELECT SUM(amount)
        FROM ledger
        WHERE user_id = l.user_id AND type = 'credit'
    ), 0) as total_earned
FROM ledger l
GROUP BY user_id;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for jobs (public read, admin write)
CREATE POLICY "Anyone can view open jobs" ON public.jobs
    FOR SELECT USING (status = 'open');

-- RLS Policies for submissions
CREATE POLICY "Users can view own submissions" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.submissions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for ledger
CREATE POLICY "Users can view own ledger entries" ON public.ledger
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for payouts
CREATE POLICY "Users can view own payouts" ON public.payouts
    FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to deduct from wallet balance
CREATE OR REPLACE FUNCTION public.deduct_from_wallet(user_id UUID, deduction_amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL;
BEGIN
    -- Get current available balance
    SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0)
    INTO current_balance
    FROM ledger
    WHERE ledger.user_id = deduct_from_wallet.user_id;
    
    -- Check if sufficient funds
    IF current_balance < deduction_amount THEN
        RAISE EXCEPTION 'Insufficient funds or wallet not found';
    END IF;
    
    -- Insert debit transaction
    INSERT INTO ledger (user_id, amount, type)
    VALUES (deduct_from_wallet.user_id, deduction_amount, 'debit');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add to wallet balance
CREATE OR REPLACE FUNCTION public.add_to_wallet(user_id UUID, addition_amount DECIMAL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert credit transaction
    INSERT INTO ledger (user_id, amount, type)
    VALUES (add_to_wallet.user_id, addition_amount, 'credit');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample jobs
INSERT INTO public.jobs (title, description, type, payment_amount, requirements) VALUES
('Professional Podcast Intro', 'We need a warm, professional voice for our business podcast intro. Should be engaging and authoritative. Script is 30 seconds long.', 'audio', 75.00, 'Professional quality audio, quiet background, clear pronunciation'),
('Product Demo Video Narration', 'Looking for a friendly, enthusiastic voice to narrate our new product demo video. Should sound approachable and knowledgeable.', 'video', 150.00, 'HD video quality, good lighting, professional appearance'),
('Educational Course Modules', 'Series of 10 educational videos for online learning platform. Each module is 5-10 minutes. Looking for clear, instructional delivery.', 'video', 500.00, 'Professional setup, consistent audio quality across all modules'),
('Commercial Radio Spot', 'Local business needs voice talent for 30-second radio commercial. Should be energetic and persuasive.', 'audio', 100.00, 'Broadcast quality audio, upbeat delivery style'),
('Audiobook Chapter Reading', 'Read one chapter of a business book for audiobook production. Chapter is approximately 4000 words.', 'audio', 200.00, 'Consistent pacing, clear diction, studio-quality recording');
