-- Valor guardado para o objetivo (aportes / economia)
CREATE TABLE public.planning_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  saved_at date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_planning_savings_planning_id ON public.planning_savings(planning_id);
CREATE INDEX idx_planning_savings_user_id ON public.planning_savings(user_id);

ALTER TABLE public.planning_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_savings_select ON public.planning_savings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY planning_savings_insert ON public.planning_savings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY planning_savings_update ON public.planning_savings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY planning_savings_delete ON public.planning_savings
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.planning_savings IS 'Valores que o usuário está guardando para o objetivo do planejamento.';
