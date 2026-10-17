-- ==============================================================================
-- ALPHACORE TECH - UNIFIED SUPABASE CROSS-DEVICE PERSISTENCE SCHEMA
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/dmlcergmwkotcbyylpdb/sql/new
-- 2. Paste this entire script into the SQL Editor and click "RUN".
-- ==============================================================================

-- 1. PINs Registry (Profiles, Clearance, Must-Change Flags)
CREATE TABLE IF NOT EXISTS public.alphacore_pins (
    pin TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'permanent',
    roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    must_change_pin BOOLEAN NOT NULL DEFAULT false,
    pin_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. System Settings & Modal Endpoint URLs
CREATE TABLE IF NOT EXISTS public.alphacore_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Chat Messages (Shared Global Comm Link & Private Neural Threads)
CREATE TABLE IF NOT EXISTS public.alphacore_chat (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL DEFAULT 'shared',
    thread_id TEXT NOT NULL DEFAULT 'shared_main',
    profile TEXT,
    author TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    text TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS) & Grant Full Access Policies
ALTER TABLE public.alphacore_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on alphacore_pins" ON public.alphacore_pins;
CREATE POLICY "Allow public read/write on alphacore_pins" ON public.alphacore_pins FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.alphacore_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on alphacore_settings" ON public.alphacore_settings;
CREATE POLICY "Allow public read/write on alphacore_settings" ON public.alphacore_settings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.alphacore_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on alphacore_chat" ON public.alphacore_chat;
CREATE POLICY "Allow public read/write on alphacore_chat" ON public.alphacore_chat FOR ALL USING (true) WITH CHECK (true);

-- Ensure vault_files has public policy if RLS is on
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on vault_files" ON public.vault_files;
CREATE POLICY "Allow public read/write on vault_files" ON public.vault_files FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket RLS policies for vault_data
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('vault_data', 'vault_data', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DROP POLICY IF EXISTS "Allow public uploads to vault_data" ON storage.objects;
CREATE POLICY "Allow public uploads to vault_data" ON storage.objects FOR ALL USING (bucket_id = 'vault_data') WITH CHECK (bucket_id = 'vault_data');

-- 5. Realtime Subscriptions
-- Enables instant multi-device synchronization when pins, settings, or chat messages change
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alphacore_pins;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alphacore_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alphacore_chat;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6. Seed Default PINs & Settings
INSERT INTO public.alphacore_pins (pin, label, type, roles, must_change_pin)
VALUES 
    ('672167566', 'Architect', 'permanent', '["admin", "vault", "aimodals", "generate", "lora", "diagnostics"]'::jsonb, false),
    ('6969', 'DoeBoy', 'permanent', '["admin", "vault", "aimodals", "generate", "lora", "diagnostics"]'::jsonb, false),
    ('20022005', 'J. P.', 'permanent', '["aimodals", "generate"]'::jsonb, false),
    ('1990', 'Fisherman', 'permanent', '["aimodals", "generate"]'::jsonb, false),
    ('67676767', 'john', 'permanent', '["aimodals", "generate", "vault", "lora", "diagnostics"]'::jsonb, false)
ON CONFLICT (pin) DO NOTHING;

INSERT INTO public.alphacore_settings (id, data)
VALUES (
    'global',
    '{
        "txt2imgUrl": "https://alphacoreprogramming-ai--alphacore-aio-backend-txt2img-w-235075.us-east.modal.run",
        "img2imgUrl": "https://alphacoreprogramming-ai--alphacore-aio-backend-img2img-w-0e3ec9.us-east.modal.run",
        "negativePrompt": "worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts",
        "stepsFastTxt": 20, "stepsFocusedTxt": 60, "stepsNormalTxt": 30,
        "stepsFastImg": 15, "stepsFocusedImg": 40, "stepsNormalImg": 25,
        "guidanceImg": 4.0
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
