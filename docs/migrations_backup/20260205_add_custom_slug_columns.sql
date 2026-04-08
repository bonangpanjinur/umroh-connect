-- Create enum for slug status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE slug_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns to agent_website_settings
ALTER TABLE agent_website_settings
ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS slug_status slug_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create a function to validate slug uniqueness (though UNIQUE constraint handles it, this can be used for pre-validation)
CREATE OR REPLACE FUNCTION check_slug_uniqueness(target_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM agent_website_settings WHERE custom_slug = target_slug
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS Policies
-- Agent can only update their own settings, but we should ensure they can't approve their own slug
-- Assuming there's an existing policy for agents to update their settings.
-- We need to make sure 'slug_status' and 'admin_notes' can only be updated by admins.

-- Drop existing update policy if it exists to recreate it with restrictions
-- Note: You'll need to check the exact policy name in your database. 
-- Usually it's something like "Agents can update their own website settings"

-- For the sake of this migration, we'll add a trigger or a more restrictive policy if possible.
-- However, in Supabase, RLS is often managed via the UI or specific SQL.
-- Let's assume we want to restrict 'slug_status' and 'admin_notes' updates to admins only.

CREATE OR REPLACE FUNCTION handle_agent_slug_request()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is not an admin and is trying to change slug_status or admin_notes
    IF (current_setting('role') != 'service_role') AND 
       (NEW.slug_status IS DISTINCT FROM OLD.slug_status OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes) THEN
        -- Check if the user has admin role (this depends on how you define admins, e.g., in a profiles table)
        -- For now, we'll just reset them to old values if not service_role (admin)
        NEW.slug_status := OLD.slug_status;
        NEW.admin_notes := OLD.admin_notes;
    END IF;
    
    -- If custom_slug is changed, set status to pending
    IF NEW.custom_slug IS DISTINCT FROM OLD.custom_slug THEN
        NEW.slug_status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_agent_website_settings_update ON agent_website_settings;
CREATE TRIGGER on_agent_website_settings_update
    BEFORE UPDATE ON agent_website_settings
    FOR EACH ROW
    EXECUTE FUNCTION handle_agent_slug_request();
