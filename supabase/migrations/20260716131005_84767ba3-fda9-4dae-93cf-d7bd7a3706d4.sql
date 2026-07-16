ALTER TABLE public.entries ALTER COLUMN worker_id DROP NOT NULL;
ALTER TABLE public.entries DROP CONSTRAINT entries_worker_id_fkey;
ALTER TABLE public.entries ADD CONSTRAINT entries_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES auth.users(id) ON DELETE SET NULL;