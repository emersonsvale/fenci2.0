-- Lista de Compras: categorias (corredores do mercado) e itens
-- Usado quando plannings.type = 'lista_compras'

-- Categorias fixas por corredor (ordem de percurso no supermercado)
CREATE TABLE public.shopping_list_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shopping_list_categories_sort ON public.shopping_list_categories(sort_order);

-- Seed: categorias ideais por corredor
INSERT INTO public.shopping_list_categories (name, sort_order) VALUES
  ('Hortifruti', 1),
  ('Açougue e Peixaria', 2),
  ('Frios e Laticínios', 3),
  ('Mercearia (Básicos/Grãos)', 4),
  ('Mercearia (Complementos)', 5),
  ('Matinais e Padaria', 6),
  ('Bebidas', 7),
  ('Congelados', 8),
  ('Higiene Pessoal', 9),
  ('Limpeza', 10),
  ('Pets', 11);

-- Itens da lista de compras (por planejamento)
CREATE TABLE public.shopping_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  status text NOT NULL DEFAULT 'a_comprar' CHECK (status IN ('a_comprar', 'no_carrinho', 'comprado', 'faltou_mercado')),
  quantity numeric(12,3) DEFAULT 1,
  unit text DEFAULT 'Unidades',
  category_id uuid REFERENCES public.shopping_list_categories(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baixa')),
  purchase_location text,
  price_estimated numeric(12,2),
  price_actual numeric(12,2),
  notes text,
  stock_current numeric(12,3),
  stock_minimum numeric(12,3),
  recipe_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shopping_list_items_planning_id ON public.shopping_list_items(planning_id);
CREATE INDEX idx_shopping_list_items_user_id ON public.shopping_list_items(user_id);
CREATE INDEX idx_shopping_list_items_category ON public.shopping_list_items(category_id);
CREATE INDEX idx_shopping_list_items_status ON public.shopping_list_items(planning_id, status);

-- RLS: shopping_list_categories (leitura para todos autenticados)
ALTER TABLE public.shopping_list_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_list_categories_select ON public.shopping_list_categories
  FOR SELECT TO authenticated USING (true);

-- RLS: shopping_list_items (apenas dono)
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY shopping_list_items_select ON public.shopping_list_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY shopping_list_items_insert ON public.shopping_list_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY shopping_list_items_update ON public.shopping_list_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY shopping_list_items_delete ON public.shopping_list_items
  FOR DELETE USING (auth.uid() = user_id);
