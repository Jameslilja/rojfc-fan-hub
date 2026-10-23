CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', avatar_path text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id=auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());
INSERT INTO public.profiles(id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
CREATE TABLE public.admin_access (email text PRIMARY KEY, user_id uuid, is_owner boolean NOT NULL DEFAULT false, invited_by uuid, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_access TO authenticated;
GRANT ALL ON public.admin_access TO service_role;
ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own admin access" ON public.admin_access FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.grant_first_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.profiles(id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
IF NEW.email_confirmed_at IS NOT NULL THEN
UPDATE public.admin_access SET user_id=NEW.id WHERE email=lower(NEW.email);
IF FOUND THEN INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT DO NOTHING; END IF;
END IF; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.grant_first_admin() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER on_admin_email_confirmed AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();
CREATE OR REPLACE FUNCTION public.approve_admin_email(target_email text, actor uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE target_id uuid; BEGIN
SELECT id INTO target_id FROM auth.users WHERE lower(email)=lower(target_email) AND email_confirmed_at IS NOT NULL;
INSERT INTO public.admin_access(email,user_id,invited_by) VALUES(lower(target_email),target_id,actor) ON CONFLICT(email) DO UPDATE SET user_id=coalesce(EXCLUDED.user_id,admin_access.user_id);
IF target_id IS NOT NULL THEN INSERT INTO public.user_roles(user_id,role) VALUES(target_id,'admin') ON CONFLICT DO NOTHING; END IF;
RETURN target_id; END; $$;
REVOKE ALL ON FUNCTION public.approve_admin_email(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approve_admin_email(text,uuid) TO service_role;