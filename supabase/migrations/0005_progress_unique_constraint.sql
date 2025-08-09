-- Add unique constraint to progress table for (user_id, module_id)
-- This enables the ON CONFLICT clause in upsert operations

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'progress_user_module_unique' 
        AND conrelid = 'public.progress'::regclass
    ) THEN
        ALTER TABLE public.progress 
        ADD CONSTRAINT progress_user_module_unique 
        UNIQUE (user_id, module_id);
        
        RAISE NOTICE 'Added unique constraint progress_user_module_unique to progress table';
    ELSE
        RAISE NOTICE 'Unique constraint progress_user_module_unique already exists';
    END IF;
END $$;
