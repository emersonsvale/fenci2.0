# Fenci Web 2.0

Aplicação Nuxt 4 com Supabase para gestão financeira pessoal.

## Pré-requisitos

- Node.js 20+
- npm

## Setup

```bash
npm install
```

Copie o arquivo de exemplo de variáveis de ambiente e preencha com os dados do seu projeto Supabase:

```bash
cp .env.example .env
```

Edite o `.env` e configure:

- `SUPABASE_URL` — URL do projeto (Supabase Dashboard → Settings → API)
- `SUPABASE_KEY` — chave anon/public

## Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Build para produção

```bash
npm run build
```

Preview local do build:

```bash
npm run preview
```

---

## Deploy no Coolify

Este projeto está preparado para deploy no [Coolify](https://coolify.io) usando Docker. Siga os passos abaixo.

### 1. Pré-requisitos

- Conta no Coolify (self-hosted ou Coolify Cloud)
- Repositório do projeto no GitHub já configurado (ex.: `https://github.com/emersonsvale/fenci2.0`)
- Projeto Supabase criado (para `SUPABASE_URL` e `SUPABASE_KEY`)

### 2. Criar a aplicação no Coolify

1. No painel do Coolify, clique em **+ Add New** (ou **New Resource**).
2. Escolha **Application**.
3. Selecione **GitHub** (ou **Git**, se usar outro provedor) e autorize o acesso ao repositório, se necessário.
4. Selecione o repositório **emersonsvale/fenci2.0** (ou o seu fork).
5. Escolha a branch **master** (ou a branch que você usa para deploy).

### 3. Configurar o build

1. Em **Build Pack**, selecione **Dockerfile**.
2. O Coolify usará o `Dockerfile` na raiz do repositório — não é preciso informar caminho extra.
3. **Dockerfile Location**: deixe em branco ou `./Dockerfile` (raiz do projeto).
4. **Port**: o app expõe a porta **3000**; o Coolify costuma detectar automaticamente. Se pedir, informe `3000`.

### 4. Variáveis de ambiente

No Coolify, na seção **Environment Variables** da aplicação, adicione:

| Variável        | Obrigatório | Descrição |
|-----------------|-------------|-----------|
| `SUPABASE_URL`  | Sim         | URL do projeto (ex.: `https://xxxxx.supabase.co`) |
| `SUPABASE_KEY`  | Sim         | Chave **anon** (public) do Supabase |

**Onde obter:** Supabase Dashboard → seu projeto → **Settings** → **API** → Project URL e anon public key.

Não commite o `.env` no Git. Use apenas as variáveis no Coolify (ou no arquivo de env do Coolify).

### 5. URL do app no Supabase (Auth)

Para o login e callbacks funcionarem em produção:

1. No **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. Em **Site URL**, coloque a URL final do app no Coolify (ex.: `https://fenci.seudominio.com`).
3. Em **Redirect URLs**, adicione:
   - `https://fenci.seudominio.com/**`
   - `https://fenci.seudominio.com/confirm`
   - `https://fenci.seudominio.com/reset-senha` (ou a rota que você usa para reset de senha)

Assim o Supabase aceita redirects da sua aplicação em produção.

### 6. Fazer o deploy

1. Salve a configuração da aplicação.
2. Clique em **Deploy** (ou **Start Build**).
3. Aguarde o build (instalação de dependências com `npm ci` e build do Nuxt). O primeiro deploy pode levar alguns minutos.
4. Após o sucesso, o Coolify mostrará a URL pública do app (se tiver domínio e proxy configurados).

### 7. Atualizações

Sempre que enviar alterações para o repositório:

```bash
git add .
git commit -m "sua mensagem"
git push origin master
```

No Coolify, configure **Auto Deploy** na aplicação (se disponível) para fazer deploy a cada push na branch escolhida. Caso contrário, dispare o deploy manualmente após o `git push`.

### Resolução de problemas

| Erro | Solução |
|------|--------|
| `npm ci can only install packages when your package.json and package-lock.json are in sync` | Rode `npm install` localmente, faça commit do `package-lock.json` e push. |
| `COPY failed: file not found... package-lock.json` | Verifique se o `.dockerignore` **não** contém `package.json` nem `package-lock.json`. |
| App inicia mas dá erro de Supabase | Confira se `SUPABASE_URL` e `SUPABASE_KEY` estão corretos nas variáveis de ambiente do Coolify. |
| Login não redireciona ou dá erro | Ajuste **Site URL** e **Redirect URLs** no Supabase (passo 5). |

---

## Documentação

- [Nuxt](https://nuxt.com/docs)
- [Supabase](https://supabase.com/docs)
- [Coolify](https://coolify.io/docs)
