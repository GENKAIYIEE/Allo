-- Create the payday_logs table
CREATE TABLE payday_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cutoff_type TEXT NOT NULL CHECK (cutoff_type IN ('15th', '30th')),
    income NUMERIC NOT NULL,
    daily_expenses NUMERIC NOT NULL,
    family_support NUMERIC NOT NULL,
    ipon_goal NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE payday_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for Select, Insert, Update, Delete for authenticated users
CREATE POLICY "Users can manage their own payday logs" ON payday_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
