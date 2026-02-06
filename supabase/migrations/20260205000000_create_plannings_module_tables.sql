-- plannings: cabeçalho do planejamento
CREATE TABLE public.plannings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  status text DEFAULT 'rascunho',
  date_start date,
  date_end date,
  budget_total numeric(12,2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_plannings_user_id ON public.plannings(user_id);

-- planning_categories: categorias por planejamento
CREATE TABLE public.planning_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_planning_categories_planning_id ON public.planning_categories(planning_id);
CREATE INDEX idx_planning_categories_user_id ON public.planning_categories(user_id);

-- planning_entries: lançamentos do planejamento
CREATE TABLE public.planning_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  planning_category_id uuid NOT NULL REFERENCES public.planning_categories(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('before', 'during', 'after')),
  description text,
  amount_planned numeric(12,2) NOT NULL,
  amount_actual numeric(12,2),
  entry_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_planning_entries_planning_id ON public.planning_entries(planning_id);
CREATE INDEX idx_planning_entries_planning_phase ON public.planning_entries(planning_id, phase);
CREATE INDEX idx_planning_entries_user_id ON public.planning_entries(user_id);

-- planning_installments: parcelas (ex.: financiamento)
CREATE TABLE public.planning_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text,
  installment_number int NOT NULL,
  total_installments int NOT NULL,
  amount numeric(12,2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_planning_installments_planning_id ON public.planning_installments(planning_id);
CREATE INDEX idx_planning_installments_user_id ON public.planning_installments(user_id);

-- RLS: plannings
ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;

CREATE POLICY plannings_select ON public.plannings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY plannings_insert ON public.plannings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY plannings_update ON public.plannings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY plannings_delete ON public.plannings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: planning_categories
ALTER TABLE public.planning_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_categories_select ON public.planning_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY planning_categories_insert ON public.planning_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY planning_categories_update ON public.planning_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY planning_categories_delete ON public.planning_categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: planning_entries
ALTER TABLE public.planning_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_entries_select ON public.planning_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY planning_entries_insert ON public.planning_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY planning_entries_update ON public.planning_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY planning_entries_delete ON public.planning_entries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS: planning_installments
ALTER TABLE public.planning_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY planning_installments_select ON public.planning_installments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY planning_installments_insert ON public.planning_installments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY planning_installments_update ON public.planning_installments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY planning_installments_delete ON public.planning_installments
  FOR DELETE USING (auth.uid() = user_id);
