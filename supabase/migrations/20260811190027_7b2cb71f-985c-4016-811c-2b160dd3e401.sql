
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "News are public" ON public.news FOR SELECT USING (true);
CREATE POLICY "Admins manage news" ON public.news FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shirt_number int,
  position text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players are public" ON public.players FOR SELECT USING (true);
CREATE POLICY "Admins manage players" ON public.players FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Content is public" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage content" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_content (key, value) VALUES
('about', 'Roj FC grundades 2024 och är mer än bara ett fotbollslag – vi är en gemenskap. Namnet Roj betyder "sol" och står för ljus, värme och nya början.

Vår klubb samlar spelare från hela världen med ett gemensamt mål: att spela glädjefylld fotboll, utvecklas tillsammans och representera vår kultur med stolthet. Vi tror på hårt arbete, respekt och sammanhållning – både på och utanför planen.

Följ oss på matchdagar, i sociala medier och i shopen. Bijî Roj FC!');

INSERT INTO public.news (title, body, published_at) VALUES
('Välkommen till Roj FC:s nya hemsida', 'Här kommer du att hitta senaste nytt om laget, hela truppen, vår shop och information om klubben. Håll utkik för matchrapporter och nyheter!', now()),
('Säsongen är igång', 'Truppen är samlad och träningarna rullar på för fullt. Vi ser fram emot en fantastisk säsong tillsammans med alla supportrar.', now() - interval '3 days');

INSERT INTO public.players (name, shirt_number, sort_order) VALUES
('Hawar Kako', 8, 1),
('Sarkan Burhan Mohammed Mohammed', 13, 2),
('Fikret Sebecevac', 99, 3);

INSERT INTO public.players (name, sort_order) VALUES
('Abdihakin Hirsi', 10),
('Abdulqader Mohammed Fadhil Alnuami', 11),
('Aeub Ghaitouli', 12),
('Aewb Abdalla', 13),
('Akar Mawlodi', 14),
('Alexander Rasmus', 15),
('Ali Abdul Karim', 16),
('Anas Mohammad', 17),
('Armin Puskar', 18),
('Bahzad Fatah', 19),
('Belmin Jashari', 20),
('Diako Marwati', 21),
('Dilan Rashid', 22),
('Ekrem Aslan', 23),
('Emal Nikzad', 24),
('Friad Sultani', 25),
('Goran Safari', 26),
('Hadjar Piruati', 27),
('Haji Noural-Din', 28),
('Jaser Al-Mosawy', 29),
('Javad Husseinzadeh', 30),
('Jawed Sadeghi', 31),
('Joel Andersson', 32),
('Josef Ahmed', 33),
('Kardo Ali', 34),
('Karwan Abbasi', 35),
('Karwan Zarifnejad', 36),
('Kaywan Abbasi', 37),
('Kevin Jamal', 38),
('Lalesh Hadji', 39),
('Loqman Ghaitouli', 40),
('Mikael Eriksson', 41),
('Mobark Saed', 42),
('Mohamad Barro', 43),
('Mohammad Ghadri', 44),
('Muharrem Bytyqi', 45),
('Mustafa Al-Zubaidi', 46),
('Mårten Ängerfors', 47),
('Nouri Khalil', 48);
