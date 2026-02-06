ALTER TABLE public.planning_entries
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.planning_entries.is_active IS 'Quando false, o lançamento permanece visível mas é excluído dos totais do dashboard.';
