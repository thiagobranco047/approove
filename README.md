# Approove - Plataforma de Aprovação de Conteúdo

Plataforma de aprovação de conteúdo para redes sociais. Organize calendários editoriais, colabore com seu time e aprove publicações com seus clientes — tudo em um só lugar.

## Funcionalidades

### Plataforma (admin)

- **Autenticação**: Login/cadastro com email/senha e Google OAuth (NextAuth v5)
- **Multi-tenant**: Organizações, memberships e seats — cada empresa gerencia sua carteira de clientes
- **Dashboard**: Sidebar, métricas visuais (Recharts) e visão geral dos clientes
- **Gestão de clientes**: CRUD, tokens de compartilhamento, detalhe com tabs (publicações, calendário, informações)
- **Gestão de time**: Convite por email, roles (owner/admin/member), remoção de membros
- **Onboarding**: Carrossel de boas-vindas para novos usuários
- **Upload de mídia**: Drag-and-drop via Vercel Blob na tela de publicação (JPEG, PNG, GIF, WebP, SVG, MP4)

### Tela de publicação (admin + cliente)

- **Calendário editorial**: Swiper para navegar entre posts; modal de calendário com navegação livre de meses/anos
- **Múltiplos posts por dia**: Indicadores no calendário (badges por status) e navegação entre posts do mesmo dia
- **Materiais flexíveis**: Attachments por tipo (Feed, Stories, LinkedIn, Reels, Carrossel, Outro) — não limitado a feed/stories fixos
- **Versionamento de artes**: Múltiplas versões por material, seletor em dropdown no preview
- **Anotações na arte (pins)**: Marcações posicionadas na imagem com comentário, autor (agência/cliente) e resolução
- **Toggle de pins**: Ocultar/exibir marcações para visualizar a arte limpa
- **Visualização ampliada**: Fullscreen sobre toda a interface, com pins e anotações no modo ampliado
- **Upload na publicação**: Envio de arquivo ou URL externa ao adicionar material ou nova versão
- **Aprovação**: Status (pendente, aprovado, ajustes) e thread de comentários (agência/cliente)
- **Compartilhamento via link**: Cliente acessa sem conta via token (`?t=TOKEN`)
- **Revisores convidados (Opção B)**: Contatos nomeados com e-mail, link único, papéis (visualizador / revisor / aprovador) e vínculo a uma ou mais empresas (clientes)
- **Gestão de revisores**: Tab no detalhe do cliente — convidar, copiar link, revogar acesso, multi-empresa

## Tecnologias

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **NextAuth v5** (Auth.js) — Google OAuth + Credentials
- **Prisma** (ORM) + **PostgreSQL**
- **Recharts** (Gráficos)
- **Swiper** (Carrossel de posts)
- **Zod** (Validação)
- **bcryptjs** (Hash de senhas)
- **@vercel/blob** (Upload de arquivos)

## Instalação

### 1. Clone e instale

```bash
git clone <repository-url>
cd approove
npm install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz (ou copie o `.env.example`):

```env
# Banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/approove?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gere-com: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""

# Google OAuth (opcional — veja seção abaixo)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Vercel Blob (upload de imagens — veja seção abaixo)
BLOB_READ_WRITE_TOKEN=""

# E-mail (Resend — convites de revisor no piloto)
RESEND_API_KEY=""
EMAIL_FROM="Approove <convites@seudominio.com>"

# Stripe Billing (sandbox/dev)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_STARTER=""
STRIPE_PRICE_PRO=""
STRIPE_PRICE_STUDIO=""
STRIPE_PORTAL_CONFIGURATION_ID=""
```

### 3. Configure o banco e popule com dados de exemplo

```bash
npm run db:push
npm run db:seed
```

### 4. Inicie o servidor

```bash
npm run dev
```

### 5. Acesse a aplicação

| Acesso | URL |
|--------|-----|
| **Login (admin)** | http://localhost:3000/login |
| **Dashboard** | http://localhost:3000/dashboard |
| **Gestão do cliente demo** (revisores, posts, info) | http://localhost:3000/dashboard/clients/demo-client |
| **Aba Revisores (demo)** | http://localhost:3000/dashboard/clients/demo-client?tab=reviewers |
| **Calendário do cliente (visão externa)** | http://localhost:3000/c/demo-client/v1?t=demo-token-123 |

## Credenciais de Teste

Após rodar o seed, os seguintes dados estarão disponíveis:

| Campo | Valor |
|-------|-------|
| **Email** | `admin@approove.com` |
| **Senha** | `admin123` |
| **Organização** | Agência Demo |
| **Cliente demo** | Cliente Demo (`demo-client`) |
| **Token de acesso** | `demo-token-123` |

**Time demo** (delegação): `copy@approove.com`, `design@approove.com`, `review@approove.com` — senha `member123`

> **Gestão interna vs. visão do cliente:** use `/dashboard/clients/demo-client` (menu **Clientes** → clique no card) para publicações, **Revisores** e informações. O link `/c/demo-client/v1?t=...` é só a visão de aprovação — não tem aba de revisores.

> As imagens do seed usam URLs fixas do [Lorem Picsum](https://picsum.photos) (`/seed/...`) e não mudam a cada refresh.

## Configurar Google OAuth (opcional)

O login com Google é opcional. Se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estiverem vazios, apenas o login por email/senha fica disponível.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie ou selecione um projeto
3. Vá em **Credenciais** > **Criar credenciais** > **ID do cliente OAuth**
4. Tipo: **Aplicativo da Web**
5. Em **URIs de redirecionamento autorizados**, adicione:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Produção: `https://seudominio.com/api/auth/callback/google`
6. Copie o **Client ID** e **Client Secret** para o `.env`

> Use a conta Google da empresa dona do projeto. Quando o app for para produção, o processo de verificação do Google precisa ser feito pela organização dona do domínio.

## Configurar Upload (Vercel Blob)

Necessário para enviar arquivos pela interface (adicionar material / nova versão). Sem o token, a opção de **URL externa** continua funcionando.

1. Acesse [vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
2. Crie um **Blob Store** e copie o token **Read-Write**
3. Adicione ao `.env`:
   ```env
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
   ```
4. Reinicie o servidor de desenvolvimento

Tipos aceitos: JPEG, PNG, GIF, WebP, SVG, MP4 · máximo 50MB por arquivo.

## Configurar e-mail (Resend) — piloto fechado

Necessário para **enviar o link de convite automaticamente** ao cadastrar um revisor (aba Revisores do cliente). Sem as variáveis, o convite é criado normalmente e o link pode ser copiado manualmente.

1. Crie conta em [resend.com](https://resend.com) e gere uma **API Key**
2. Verifique um domínio (ou use o domínio de teste do Resend em dev)
3. Adicione ao `.env` (e às variáveis da Vercel em produção):
   ```env
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Approove <convites@seudominio.com>"
   NEXTAUTH_URL="https://app.seudominio.com"
   ```
4. `NEXTAUTH_URL` deve ser a URL pública final — os links nos e-mails usam esse valor

> Em desenvolvimento local, convites sem Resend configurado exibem aviso na interface; use **Copiar link** na lista de revisores.

## Configurar Stripe Billing

Use Stripe em modo sandbox/teste.

1. Autentique o Stripe CLI ou MCP na conta da empresa.
2. Crie produtos/preços com prefixo `Approove SaaS` para separar este app dos outros produtos da conta.
3. Copie os Price IDs para `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_STUDIO`.
4. Crie uma configuração do Customer Portal para os produtos `Approove SaaS` e copie o ID para `STRIPE_PORTAL_CONFIGURATION_ID`.
5. Rode o listener de webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
6. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
7. Em `/dashboard/settings`, abra Checkout em nova aba e pague com cartão de teste Stripe.

Objetos sandbox criados para este app:

| Plano | Produto Stripe | Preço |
|-------|----------------|-------|
| Solo | `Approove SaaS - Solo` | US$15/mês |
| Starter | `Approove SaaS - Starter` | US$25/mês |
| Pro | `Approove SaaS - Pro` | US$75/mês |
| Studio | `Approove SaaS - Studio` | US$150/mês |

Cada Price usa USD como moeda padrão e inclui uma opção manual para o Brasil:

| Plano | Brasil |
|---|---:|
| Solo | R$97/mês |
| Starter | R$197/mês |
| Pro | R$497/mês |
| Studio | R$997/mês |

O Stripe Checkout seleciona BRL automaticamente para clientes no Brasil. Em
países sem uma opção de moeda configurada, o Checkout usa o USD padrão. A
interface segue a mesma regra a partir dos cabeçalhos geográficos da Vercel ou
Cloudflare, com `Accept-Language` apenas como fallback de desenvolvimento.

## Piloto fechado — deploy e checklist

Use este roteiro para colocar 1–3 agências reais em produção antes do lançamento comercial.

### Deploy em produção (Vercel + Neon)

| Passo | Ação |
|-------|------|
| 1 | Crie projeto **Neon** (PostgreSQL) e copie `DATABASE_URL` |
| 2 | Importe o repositório na **Vercel** |
| 3 | Configure variáveis: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM` (+ Google OAuth se usar) |
| 4 | Após o primeiro deploy: `npx prisma db push` e `npm run db:seed` (ou migração equivalente no CI) |
| 5 | Confirme login, upload de arte e convite de revisor com e-mail recebido |

**Neon (free tier):** o banco pode suspender após inatividade — o app exibe mensagem amigável (503). Para piloto, considere plano pago ou acordar horário de “aquecimento” antes das demos.

**Vercel Blob:** mesmo projeto Vercel ou store vinculado; token Read-Write obrigatório para upload.

### Happy path (~15 min) — validar antes de convidar clientes

1. **Login** — criar conta ou usar seed (`admin@approove.com` / `admin123` só em ambiente de teste)
2. **Cliente** — Dashboard → Clientes → criar cliente ou abrir demo
3. **Publicação** — Detalhe do cliente → Nova publicação (data, canal, copy)
4. **Artes** — Botão **Montar calendário e artes** → adicionar material (upload ou URL), pins e status
5. **Revisor** — Aba Revisores → Convidar → confirmar e-mail recebido (ou copiar link)
6. **Cliente externo** — Abrir link `?t=...` em aba anônima → comentar / aprovar / solicitar ajuste
7. **Delegação** (opcional) — Dashboard → Minhas tarefas / Delegar entre copy e design

### Suporte no piloto (sem self-service)

| Situação | Processo manual |
|----------|-------------------|
| **Esqueci a senha** | Admin redefine via banco (`User.passwordHash` com bcrypt) ou cria novo usuário e convida ao time |
| **Convite não chegou** | Copiar link na aba Revisores; verificar spam e domínio verificado no Resend |
| **Upload falhou** | Confirmar `BLOB_READ_WRITE_TOKEN` e limite 50MB |
| **500 / banco** | Verificar Neon ativo; reiniciar deploy; `prisma generate` após mudanças de schema |

Recuperação de senha self-service fica para o ciclo **MVP vendável**; no piloto, documente um contato de suporte (e-mail/WhatsApp da agência).

### Gestão interna vs. calendário de produção

| Tela | URL | Uso |
|------|-----|-----|
| **Gestão do cliente** | `/dashboard/clients/[slug]` | Posts (agenda/copy), revisores, informações, link compartilhável |
| **Calendário de produção** | `/c/[slug]/[versão]` | Upload de artes, carrossel, pins, aprovação (admin logado) |
| **Visão do cliente** | `/c/[slug]/[versão]?t=TOKEN` | Mesma UI, acesso do revisor sem conta |

### Modelo de mídia por post

Cada **post** pode ter vários **materiais** (`PostAttachment`: feed, stories, carrossel, etc.). Cada material tem **versões** de revisão (`AttachmentVersion`: v1, v2…) e, dentro de cada versão, uma **sequência de slides** (`AttachmentSlide`).

| Conceito | Exemplo | Uso |
|----------|---------|-----|
| Material | Carrossel Instagram | Um slot no post (abaixo do preview) |
| Versão | v1 → v2 após ajuste do cliente | Histórico de revisão da arte inteira |
| Slide | Imagem 1, 2, 3 do carrossel | Navegação horizontal no preview |
| Pin | Comentário na imagem 2 do slide 2 | Anotação por slide |

- **Imagem única** (feed, stories): 1 slide por versão; `url` em `AttachmentVersion` permanece como capa (retrocompat).
- **Carrossel**: mínimo 2 slides; upload via `slides[]` ou `urls[]` na API; preview com Swiper + contador «1 de N».
- **Upload em lote**: arraste vários arquivos no formulário de carrossel; cada um vira um slide.
- **Gestão de slides** (admin): reordenar (↑↓), remover e adicionar slides em versões já salvas (`PATCH/DELETE/POST /api/attachment-versions/[id]/slides`).
- **Vídeo na sequência**: `mediaType: video` por slide; player com controles; pins apenas em imagens.
- **Pins** em carrossel ficam ligados ao slide (`attachmentSlideId`); artes antigas continuam com pins na versão.

```
PostItem
 └── PostAttachment (type: carousel, order: 0)
      └── AttachmentVersion (version: 1)
           ├── AttachmentSlide (order: 0) → pins
           ├── AttachmentSlide (order: 1) → pins
           └── AttachmentSlide (order: 2) → pins
```

## Estrutura do Projeto

```
approove/
├── app/
│   ├── (auth)/                      # Login e cadastro
│   ├── (admin)/                     # Área logada (sidebar)
│   │   ├── dashboard/               # Dashboard, clientes, time
│   │   └── onboarding/              # Onboarding
│   ├── api/
│   │   ├── auth/                    # NextAuth + signup
│   │   ├── attachments/             # Versões de attachment
│   │   ├── attachment-versions/     # Pins de anotação
│   │   ├── calendar/                # Posts do calendário
│   │   ├── clients/                 # CRUD de clientes + revisores/convites
│   │   ├── reviewers/               # Gestão de revisores
│   │   ├── invites/                 # Revogar convites
│   │   ├── share/                   # Validação de token de acesso
│   │   ├── posts/                   # Posts, attachments, status, comentários
│   │   ├── team/                    # Gestão de time
│   │   ├── upload/                  # Upload para Vercel Blob
│   │   └── user/                    # Flag de onboarding
│   └── c/[clientSlug]/[versionId]/  # Visão do cliente (token)
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── client-reviewers-tab.tsx     # Gestão de revisores convidados
│   ├── annotation-layer.tsx         # Imagem + pins + fullscreen
│   ├── calendar-modal.tsx           # Calendário com criação por data
│   ├── media-source-input.tsx       # Upload ou URL externa
│   ├── image-upload.tsx             # Drag-and-drop
│   ├── attachment-sequence-viewer.tsx # Swiper de slides (carrossel)
│   ├── carousel-slides-input.tsx    # Upload multi-slide (criação)
│   ├── carousel-slides-manager.tsx  # Reordenar/remover slides salvos
│   ├── batch-media-upload.tsx       # Upload em lote
│   ├── slide-media-preview.tsx      # Imagem ou vídeo + pins
│   ├── post-slide-editable.tsx      # Slide admin (edição)
│   ├── version-selector.tsx         # Dropdown de versões
│   └── ...
├── lib/
│   ├── attachment-slides.ts         # Slides, carrossel e includes Prisma
│   └── ...
│   ├── schema.prisma
│   └── seed.ts
├── auth.ts                          # Configuração NextAuth
└── middleware.ts                    # Proteção de rotas
```

## Modelos do Banco de Dados

| Modelo | Descrição |
|--------|-----------|
| **User** | Usuários da plataforma (email, senha hash, OAuth) |
| **Account** / **Session** / **VerificationToken** | NextAuth |
| **Organization** | Empresa/agência |
| **Membership** | Vínculo User ↔ Organization (owner/admin/member) |
| **Client** | Cliente da organização |
| **CalendarVersion** | Versão do calendário de um cliente |
| **PostItem** | Publicação (data, canal, copy, status) |
| **PostAttachment** | Material do post (tipo, label, ordem) |
| **AttachmentVersion** | Versão da arte (URL, número da versão) |
| **AnnotationPin** | Pin de anotação na arte (coordenadas, texto, autor, resolvido) |
| **Comment** | Comentário no post (agência/cliente) |
| **ShareToken** | Token de acesso público ao calendário |
| **ClientReviewer** | Contato convidado (nome, e-mail) da organização |
| **ClientReviewerClient** | Vínculo revisor ↔ empresa(s) específica(s) |
| **ClientInvite** | Convite nomeado: revisor + calendário + token + papel + status |

## Autenticação

**1. Usuários da plataforma (NextAuth)**
- Login com email/senha (bcrypt) ou Google OAuth
- Sessão via JWT · middleware protege `/dashboard/*` e `/onboarding`

**2. Clientes (Share Token + Convite)**
- Link: `/c/[slug]/[version]?t=TOKEN`
- **Token legado**: acesso completo de revisão (comentar, anotar, aprovar)
- **Token com convite (`ClientInvite`)**: acesso limitado por papel e empresas vinculadas
  - `viewer` — só visualiza
  - `reviewer` — comenta e cria pins
  - `approver` — comenta, pins e altera status
- Comentários e pins registram `authorName` e `reviewerId` quando via convite
- Admin logado também pode interagir na mesma tela

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm run lint` | Executa linter |
| `npm run db:push` | Sincroniza schema com o banco |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Popula banco com dados de exemplo |

## Deploy

### Vercel

1. Push do código para GitHub
2. Importe o projeto na Vercel
3. Configure: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BLOB_READ_WRITE_TOKEN`
4. Deploy automático

### Outras plataformas

1. Configurar todas as variáveis de ambiente
2. Executar `prisma generate` no build
3. Node.js 18+

---

## Planos e precificação (proposta comercial)

Documento de referência para landing page, billing (Stripe) e limites por organização. Valores em **BRL**; mercado-alvo: agências de social media no Brasil.

### Visão geral

| Plano | Preço/mês | Anual (~17% off) | Clientes | Foco |
|-------|-----------|------------------|----------|------|
| ⚪ **Solo** | R$ 97 | — | até 2 | **Porta de entrada** — freelancer com os primeiros clientes |
| 🟢 **Starter** | R$ 197 | R$ 1.970 (~R$ 164/mês) | até 5 | Micro agência com carteira em formação |
| 🔵 **Agency** | R$ 497 | R$ 4.970 (~R$ 414/mês) | até 15 | **Plano âncora** — agência em crescimento |
| 🟣 **Studio** | R$ 997 | R$ 9.970 (~R$ 831/mês) | até 40 | Operação madura, volume e export |
| ⚫ **Enterprise** | a partir de R$ 2.490 | contrato anual | ilimitado* | White-label, SLA, custom |

\*Enterprise: faixas negociadas (100+ clientes, SSO, região de dados, etc.).

**Trial:** 15 dias em qualquer plano self-serve, com cartão obrigatório e uma única vez por organização (`Organization.trialUsedAt`). Enterprise sob consulta comercial.

**Overage (opcional):** +R$ 29/mês por cliente extra (Starter/Agency) · +R$ 49 por 10 GB de storage adicional.

> Referência internacional (futuro): Solo ~US$ 15 · Starter ~US$ 39 · Agency ~US$ 89 · Studio ~US$ 179 · Enterprise US$ 449+.

### Limites por plano

| Recurso | Solo | Starter | Agency | Studio | Enterprise |
|---------|------|---------|--------|--------|------------|
| Clientes | 2 | 5 | 15 | 40 | Ilimitado |
| Usuários da agência | 1 | 2 | 5 | 15 | Ilimitado |
| Revisores convidados | 5 ativos | 10 ativos | Ilimitado | Ilimitado | Ilimitado |
| Calendários | Ilimitados | Ilimitados | Ilimitados | Ilimitados |
| Storage de mídia **ativo** (fair use, HQ + preview) | ~5 GB | ~20 GB | ~80 GB | Negociado |
| Consulta histórica (preview comprimido) | 12 meses | Ilimitada | Ilimitada | Contrato |
| Original HQ após calendário arquivado | Export antes · sem cold storage | Glacier 90 dias | Glacier 1 ano | Custom |
| Suporte | Comunidade / email | Email | Prioritário (24h úteis) | SLA dedicado |

Storage **ativo** = calendários em aprovação ou até **30 dias** após fechamento (HQ + preview). Após arquivamento, permanece só preview para navegação no app — ver [Arquivamento de mídia](#arquivamento-de-mídia-hq-vs-preview).

Storage estimado com **original em alta (HQ) + preview comprimido** para revisores (~20 posts/mês/cliente, 80% imagem / 20% vídeo). Ver [Estimativa de infra](#estimativa-de-infraestrutura-de-mídia).

### Matriz de funcionalidades × plano

Legenda: ✅ incluído · 🔜 roadmap · — não incluído

| Funcionalidade | Starter | Agency | Studio | Enterprise | Status no produto |
|----------------|---------|--------|--------|------------|-------------------|
| Calendário editorial + swiper | ✅ | ✅ | ✅ | ✅ | Concluído |
| Comentários e aprovação (status) | ✅ | ✅ | ✅ | ✅ | Concluído |
| Link compartilhável (`?t=TOKEN`) | ✅ | ✅ | ✅ | ✅ | Concluído |
| Pins de anotação na arte | ✅ | ✅ | ✅ | ✅ | Concluído |
| Versionamento de artes | ✅ | ✅ | ✅ | ✅ | Concluído |
| Revisores nomeados + papéis (viewer/reviewer/approver) | ✅ (limite) | ✅ | ✅ | ✅ | Concluído |
| Multi-empresa por revisor | ✅ | ✅ | ✅ | ✅ | Concluído |
| Upload de mídia (Blob / futuro S3) | ✅ | ✅ | ✅ | ✅ | Concluído |
| Gestão de time (seats) | ✅ | ✅ | ✅ | ✅ | Concluído |
| Branding leve (logo do cliente no link) | — | ✅ | ✅ | ✅ | Pendente |
| Histórico de versões (auditoria por post/arte) | — | ✅ | ✅ | ✅ | Parcial* |
| E-mail ao convidar revisor | — | ✅ | ✅ | ✅ | Pendente |
| Notificações por e-mail | — | ✅ | ✅ | ✅ | Pendente |
| ClientAssignment (time ↔ clientes) | — | — | ✅ | ✅ | Pendente |
| Subdomínio por cliente | — | — | ✅ | ✅ | Pendente |
| Exportações (ZIP HQ, PDF calendário, relatório) | — | — | ✅ | ✅ | Pendente |
| Preview comprimido / download HQ separado | — | 🔜 | ✅ | ✅ | Pendente |
| Arquivamento automático (HQ → cold / remove) | ✅ básico | ✅ | ✅ | ✅ | Pendente |
| Consulta de calendários antigos (só preview) | ✅ (12 meses) | ✅ | ✅ | ✅ | Pendente |
| Restore de original HQ arquivado | — | 🔜 (90 dias) | ✅ (1 ano) | ✅ | Pendente |
| Permissões avançadas | — | — | — | ✅ | Pendente |
| White-label completo | — | — | — | ✅ | Pendente |
| SSO / multi-org | — | — | — | ✅ | Futuro |
| Webhooks e integrações | — | — | 🔜 | ✅ | Futuro |

\*Versionamento de artes existe (`AttachmentVersion`); log de auditoria completo ainda está no roadmap.

### Detalhe por plano

#### ⚪ Solo — R$ 97/mês

- Até **2 clientes**, **1 usuário**, **5 revisores** ativos
- Calendários ilimitados, comentários, aprovação, link compartilhável — o produto inteiro, só com a carteira menor
- Feito para o freelancer ou estúdio de uma pessoa atendendo os primeiros clientes; o caminho natural de upgrade é o Starter quando entra o terceiro cliente
- Mesmo trial de 15 dias com cartão obrigatório dos demais planos

#### 🟢 Starter — R$ 197/mês

- Até **5 clientes**, **2 usuários**, **10 revisores** ativos
- Calendários ilimitados, comentários, aprovação, link compartilhável
- Ideal para validar o fluxo com poucos clientes; storage ativo ~5 GB
- **Arquivamento:** ao fechar calendário, aviso por e-mail para **exportar ZIP HQ** em até 14 dias; depois originais são **removidos** — permanece preview comprimido para consulta por **12 meses**

#### 🔵 Agency — R$ 497/mês *(recomendado)*

- Tudo do Starter, até **15 clientes**, **5 usuários**, revisores **ilimitados**
- **Branding leve** (logo do cliente na visão de aprovação)
- **Histórico de versões** (auditoria de artes)
- E-mail de convite e notificações *(quando lançados)*
- ~**R$ 33/cliente/mês** no teto do plano — posicionamento principal de marketing
- **Arquivamento:** originais HQ → **cold storage (Glacier)** por **90 dias** após fechamento; consulta histórica **ilimitada** via preview no app

#### 🟣 Studio — R$ 997/mês

- Tudo do Agency, até **40 clientes**, **15 usuários**
- **Subdomínio por cliente** (ex.: `marca.approove.com.br`)
- **Exportações avançadas** (ZIP materiais em HQ, PDF do calendário, relatório de aprovação)
- **ClientAssignment** — membros do time vinculados a clientes específicos
- Suporte prioritário (SLA 24h úteis) · storage ativo ~80 GB
- **Arquivamento:** originais HQ em Glacier por **1 ano**; **restore sob demanda** (minutos a horas); export em lote antes do arquivamento incluído no fluxo de fechamento

#### ⚫ Enterprise — a partir de R$ 2.490/mês (anual)

- Clientes e usuários ilimitados (ou faixas customizadas)
- Permissões avançadas, white-label, SLA contratual, onboarding dedicado
- Storage, retenção de HQ e região de dados **negociados** · DPA / contrato anual
- **Arquivamento:** política custom (retenção permanente de HQ, biblioteca de assets, compliance) · preço sob consulta

### Arquivamento de mídia (HQ vs preview)

Estratégia para controlar custo de storage sem perder o valor do histórico de aprovações.

#### Três camadas

| Camada | Conteúdo | Quando | Quem acessa |
|--------|----------|--------|-------------|
| **Hot (ativo)** | Original HQ + preview | Calendário em aprovação ou até **30 dias** após fechamento | Revisor: preview · Agência: HQ + download |
| **Warm (consulta)** | Só preview + metadados (posts, status, comentários, versão) | Após arquivamento do calendário | Todos — navegação no Swiper/histórico |
| **Cold (opcional)** | Original HQ | Após warm, conforme plano | Restore sob demanda (Agency+ / Studio+) |

#### Fluxo ao fechar um calendário

```
Calendário marcado como "fechado"
  → e-mail à agência: "Exporte materiais em HQ até DD/MM (opcional no Studio+)"
  → +30 dias: originais saem do hot storage
  → conforme plano: Glacier (Agency/Studio) ou remoção (Starter)
  → previews permanecem para consulta no app
```

#### Retenção por plano (resumo)

| Plano | Preview (consulta) | HQ após arquivar | Restore HQ |
|-------|-------------------|------------------|------------|
| **Starter** | 12 meses | Removido (export manual antes) | — |
| **Agency** | Ilimitado | Glacier 90 dias, depois remove | 🔜 |
| **Studio** | Ilimitado | Glacier 1 ano | ✅ sob demanda |
| **Enterprise** | Contrato | Contrato | ✅ + SLA |

> **Upsell:** add-on **Storage+** (retenção permanente de HQ na nuvem) para clientes que usam o Approove como biblioteca de assets — fora do fair use padrão.

#### Implementação alvo (schema / infra)

- `AttachmentVersion`: `urlPreview`, `urlOriginal` (nullable após arquivar), `storageClass`, `archivedAt`
- Prefixos S3/Blob: `originals/` · `previews/`
- Job agendado por `CalendarVersion` fechado + política da organização (plano)
- Revisores e links compartilhados servem **sempre preview**; download HQ só para sessão da agência ou export

**Arquitetura alvo de mídia (upload):** upload em **alta qualidade** (`originals/`) + geração automática de **preview comprimido** (`previews/` + CDN). Download HQ e exportações avançadas reservados para Agency+ / Studio+.

### Estimativa de infraestrutura de mídia

Referência para margem e fair use (AWS S3 + CloudFront ou Vercel Blob equivalente):

| Cenário | Posts | Storage aprox. (HQ + preview) | Custo infra mídia/mês |
|---------|-------|-------------------------------|------------------------|
| 3 clientes × 3 meses × 20 posts | 180 | ~2 GB | ~R$ 5–30 |
| 15 clientes (uso típico Agency) | — | ~6–12 GB | ~R$ 15–50 |
| 40 clientes (uso típico Studio) | — | ~20–35 GB | ~R$ 40–120 |

Premissas: ~1 criativo/post, 80% imagem (~4 MB HQ + ~350 KB preview), 20% vídeo (~25 MB HQ + ~4 MB preview). Carrosséis e revisões extras aumentam o volume.

Com **arquivamento**, o storage **ativo** (fair use) considera só calendários quentes; previews históricos ocupam fração mínima (~200–500 KB/post) e não competem com HQ em Glacier.

### Billing (implementação)

- [ ] Integração **Stripe** (checkout, portal do cliente, webhooks)
- [ ] Enforcement de limites (clientes, seats, storage ativo, revisores) por `Organization`
- [ ] Landing page com pricing e CTA de trial Agency
- [ ] Jobs de **arquivamento** (HQ → Glacier/remoção) e retenção de preview por plano

---

## Roadmap

### Concluído

**Base da plataforma**
- [x] Autenticação (NextAuth v5 + Google OAuth + Credentials com bcrypt)
- [x] Multi-tenant (Organization, Membership, seats)
- [x] Login/cadastro com layout split-screen
- [x] Middleware de proteção de rotas (JWT)
- [x] Dashboard com sidebar + métricas (Recharts)
- [x] Onboarding com carrossel
- [x] Gestão de time (convite, roles, remoção)
- [x] CRUD de clientes + share tokens
- [x] Página de detalhes do cliente (tabs)

**Tela de aprovação (cliente + admin)**
- [x] Swiper de posts + modal de calendário
- [x] Calendário: navegação livre, badges por status, criar post em qualquer data (admin)
- [x] Múltiplos posts no mesmo dia (indicadores + navegação)
- [x] Attachments flexíveis (Feed, Stories, LinkedIn, Reels, Carrossel, Outro)
- [x] Sequências de imagens por material (slides + carrossel com Swiper)
- [x] Upload em lote, reordenação e remoção de slides; vídeo por slide
- [x] Versionamento de artes + dropdown de versões
- [x] Pins de anotação na imagem (agência e cliente)
- [x] Toggle para ocultar/exibir pins
- [x] Fullscreen com overlay global (portal) + ESC / clique fora / botão X
- [x] Upload de arquivos (Vercel Blob) + fallback URL externa
- [x] Status de aprovação + comentários
- [x] Excluir anotações; popups portaled; contador de anotações
- [x] Overlays de upload com cancelar (material e versão)
- [x] Revisores convidados (ClientReviewer + ClientInvite + multi-empresa)
- [x] Papéis de acesso (viewer / reviewer / approver)
- [x] Identidade do revisor em comentários e pins (`authorName`)
- [x] **E-mail de convite de revisor** (Resend; fallback manual se não configurado)
- [x] **UX gestão ↔ calendário** — CTA “Montar calendário e artes” no detalhe do cliente
- [x] **Checklist de piloto fechado** — deploy, happy path e suporte manual (README)

### Pendências — próximo ciclo (MVP vendável)

- [ ] **Notificações por email** — aprovação, ajuste solicitado, novo comentário/pin
- [ ] **ClientAssignment** — vincular membros do time a clientes específicos
- [ ] **Configurações** — conta do usuário e dados da organização
- [ ] **Landing page comercial** — pricing, CTA de cadastro (ver [Planos e precificação](#planos-e-precificação-proposta-comercial))
- [ ] **Recuperação de senha** — fluxo self-service (e-mail)

### Pendências — polimento da experiência

- [ ] **Anotações avançadas** — desenho livre, círculos e rabiscos na arte (hoje só pins com texto)
- [ ] **Aprovação em lote** — aprovar/ajustar vários posts de uma vez
- [ ] **Histórico e auditoria** — log de alterações por post/versão
- [ ] **Download do calendário** — exportar conteúdo aprovado (PDF) — plano Studio+
- [ ] **Preview comprimido + download HQ** — originals vs previews (S3/Blob) — plano Agency+/Studio+
- [ ] **Arquivamento de mídia** — hot/warm/cold por plano; calendário fechado; e-mail pré-export
- [ ] **Tipos de mídia customizáveis** — organização definir categorias de material
- [ ] **Preview de vídeo** — player adequado para attachments MP4 *(parcial: vídeo em slides de carrossel)*

### Pendências — futuro (diferenciação)

- [ ] **Billing** — Stripe + enforcement de limites por plano (matriz em [Planos e precificação](#planos-e-precificação-proposta-comercial))
- [ ] **Integrações com redes sociais** — agendamento/publicação direta
- [ ] **Importar do Canva**
- [ ] **Webhooks** para ferramentas externas
- [ ] **App mobile** ou PWA

---

## Licença

Este projeto é privado e proprietário.
