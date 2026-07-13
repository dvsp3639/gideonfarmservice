
-- 1. ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username'),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ENTRIES
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  driver_name TEXT NOT NULL,
  vehicle_reg TEXT NOT NULL,
  mobile TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  photo_path TEXT,
  entry_day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entries_vehicle_day ON public.entries (vehicle_reg, entry_day);
CREATE INDEX idx_entries_worker ON public.entries (worker_id, created_at DESC);
CREATE INDEX idx_entries_created_at ON public.entries (created_at DESC);

GRANT SELECT, INSERT ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers insert own entries" ON public.entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = worker_id AND (public.has_role(auth.uid(), 'worker') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Workers view own entries" ON public.entries FOR SELECT TO authenticated USING (auth.uid() = worker_id);
CREATE POLICY "Admins view all entries" ON public.entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_reg TEXT NOT NULL,
  day DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  entries_count INT NOT NULL DEFAULT 1,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehicle_reg, day)
);
CREATE INDEX idx_coupons_day ON public.coupons (day DESC);
CREATE INDEX idx_coupons_vehicle ON public.coupons (vehicle_reg, day DESC);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Workers view coupons for their entries" ON public.coupons FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.entries e WHERE e.vehicle_reg = coupons.vehicle_reg AND e.entry_day = coupons.day AND e.worker_id = auth.uid()));

CREATE TABLE public.bonus_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_reg TEXT NOT NULL,
  streak_end_day DATE NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vehicle_reg, streak_end_day)
);
CREATE INDEX idx_bonus_awarded_at ON public.bonus_coupons (awarded_at DESC);
GRANT SELECT ON public.bonus_coupons TO authenticated;
GRANT ALL ON public.bonus_coupons TO service_role;
ALTER TABLE public.bonus_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all bonus coupons" ON public.bonus_coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. COUPON AWARD TRIGGER
CREATE OR REPLACE FUNCTION public.evaluate_coupons()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_day DATE := NEW.entry_day;
  v_total NUMERIC(10,2);
  v_count INT;
  v_streak_count INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_total, v_count
  FROM public.entries
  WHERE vehicle_reg = NEW.vehicle_reg AND entry_day = v_day;

  IF v_total >= 500 THEN
    INSERT INTO public.coupons (vehicle_reg, day, total_amount, entries_count)
    VALUES (NEW.vehicle_reg, v_day, v_total, v_count)
    ON CONFLICT (vehicle_reg, day)
    DO UPDATE SET total_amount = EXCLUDED.total_amount, entries_count = EXCLUDED.entries_count;

    SELECT COUNT(*) INTO v_streak_count
    FROM public.coupons
    WHERE vehicle_reg = NEW.vehicle_reg AND day BETWEEN v_day - INTERVAL '6 days' AND v_day;

    IF v_streak_count = 7 THEN
      INSERT INTO public.bonus_coupons (vehicle_reg, streak_end_day)
      VALUES (NEW.vehicle_reg, v_day)
      ON CONFLICT (vehicle_reg, streak_end_day) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evaluate_coupons
  AFTER INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.evaluate_coupons();

-- 6. STORAGE POLICIES (bucket 'vehicle-photos' created via tool)
CREATE POLICY "Workers upload vehicle photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Workers view own vehicle photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins view all vehicle photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-photos' AND public.has_role(auth.uid(), 'admin'));
