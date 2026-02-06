🚀 PRD - Fenci: Gestão Financeira Pessoal
1. Visão Geral do Produto
O Fenci é uma solução multiplataforma (Web e Mobile) projetada para oferecer controle financeiro simplificado e inteligente. O foco principal é permitir que o usuário registre fluxos de caixa, gerencie assinaturas via Stripe e acompanhe investimentos e objetivos de longo prazo de forma intuitiva.

2. Personas

O Desorganizado: Precisa de lembretes e automação para não esquecer boletos.


O Planejador: Define metas de economia e quer visualizar o progresso de seus objetivos.


O Investidor Iniciante: Deseja consolidar sua carteira de ativos e cotações em um só lugar.

3. Requisitos Funcionais (Core Features)
3.1 Gestão de Fluxo de Caixa

Lançamentos: Registro de Entradas, Saídas e Movimentações.


Categorização: Personalização de categorias com ícones e emojis.


Contas e Cartões: Gestão de múltiplas contas bancárias e faturas de cartões de crédito/débito.


Recorrência: Automação de receitas e despesas fixas ou parceladas.

3.2 Planejamento e Metas

Objetivos: Criação de metas financeiras com valor alvo, data limite e frequência de aporte.


Orçamentos: Definição de limites mensais de gastos por usuário.

3.3 Investimentos

Carteiras: Organização de ativos por carteiras específicas.


Transações: Histórico de compra e venda de ativos com suporte a tickers e cotações.

3.4 Assinaturas e Pagamentos (Stripe)

Checkout: Integração com Stripe para assinaturas com 15 dias de teste (trial).


Portal do Cliente: Acesso direto ao Stripe para gestão de faturamento e cancelamento.


Webhooks: Atualização automática do status do usuário (Ativo, Teste, Cancelado) no banco de dados.

4. Requisitos Não Funcionais

Segurança: Autenticação via Supabase Auth com validação manual de JWT em Edge Functions.


Notificações: Sistema de alertas push, email e WhatsApp para vencimentos e avisos.


Interface: Suporte a Dark Mode e múltiplas moedas.