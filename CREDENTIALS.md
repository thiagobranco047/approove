# 🔐 Credenciais e Acessos - Approove

## 📋 Credenciais de Desenvolvimento

### Dashboard Administrativo

```
Email: admin@approove.com
Senha: admin123
```

### Time da Agência Demo (delegação / Minhas tarefas)

| Papel | Email | Senha |
|-------|-------|-------|
| Copywriter | copy@approove.com | member123 |
| Designer | design@approove.com | member123 |
| Revisora | review@approove.com | member123 |

Use essas contas para testar atribuição de publicações e o fluxo **Delegar** / **Minhas tarefas** no dashboard.

⚠️ **IMPORTANTE:** Estas são credenciais de desenvolvimento. Altere em produção!

---

## 🌐 URLs da Aplicação

### Ambiente de Desenvolvimento
```
Base URL: http://localhost:3000
Network: http://192.168.0.46:3000
```

---

## 📍 Páginas e Rotas

### 🔓 Páginas Públicas

#### Página Inicial
```
URL: http://localhost:3000
Descrição: Página de apresentação do sistema
```

#### Login (Admin)
```
URL: http://localhost:3000/login
Acesso: Público
Descrição: Tela de login para administradores
```

---

### 🔒 Páginas Administrativas (Requer Login)

#### Dashboard Principal
```
URL: http://localhost:3000/dashboard
Acesso: Admin autenticado
Funcionalidades:
  - Listagem de todos os clientes
  - Estatísticas de posts (Pendente/Aprovado/Ajustes)
  - Acesso rápido às páginas dos clientes
  - Logout
```

#### Novo Cliente
```
URL: http://localhost:3000/dashboard/clients/new
Acesso: Admin autenticado
Funcionalidades:
  - Cadastro de novo cliente
  - Campos: Nome, Slug, CNPJ, Endereço, Redes Sociais
  - Gera automaticamente versão v1 e token de acesso
```

---

### 👥 Páginas de Visualização de Cliente (Compartilháveis)

#### Calendário Editorial do Cliente
```
URL: http://localhost:3000/c/[clientSlug]/[versionId]?t=[token]
Acesso: Qualquer pessoa com o token OU Admin logado
Exemplo: http://localhost:3000/c/demo-client/v1?t=demo-token-123

Funcionalidades (Cliente com Token):
  - ✅ Visualização de posts em carrossel (Swiper)
  - ✅ Mudar status (Pendente/Aprovado/Ajustes)
  - ✅ Sistema de comentários
  - ✅ Calendário mensal com navegação
  - ✅ Preview de artes (Feed/Stories)
  - ✅ Toggle Dark/Light mode
  - ❌ NÃO pode editar conteúdo

Funcionalidades EXTRAS (Admin Logado):
  - ✅ Todas as funcionalidades do cliente
  - ✅ EDITAR posts existentes:
    • Data e hora do post
    • Canal (Instagram, Facebook, etc)
    • URLs das imagens (Feed/Stories)
    • Copy/texto do post
  - ✅ ADICIONAR novos posts
  - ✅ DELETAR posts existentes
  - ✅ Botões especiais: "Editar", "Salvar", "Cancelar", "Deletar"
```

---

## 🔑 Tokens de Acesso

### Cliente Demo (Seed)
```
Cliente: demo-client
Versão: v1
Token: demo-token-123
URL Completa: http://localhost:3000/c/demo-client/v1?t=demo-token-123
```

### Como Encontrar o Token de um Cliente

1. Acesse o Dashboard: `/dashboard`
2. O token está associado a cada cliente automaticamente
3. Use o botão "Abrir" no card do cliente para acessar diretamente
4. Ou consulte via Prisma Studio: `npm run db:studio`

---

## 🗄️ Banco de Dados

### Conexão
```
Provider: PostgreSQL (Neon)
URL: Configurada no arquivo .env
```

### Acessar Prisma Studio
```bash
npm run db:studio
# Abre em: http://localhost:5555
```

### Modelos Principais

#### User (Administradores)
- `id`: ID único
- `email`: Email de login
- `password`: Senha (texto plano em dev)
- `name`: Nome do usuário
- `role`: Papel (admin, user)

#### Client (Clientes)
- `id`: ID único
- `slug`: Slug da URL (ex: minha-empresa)
- `name`: Nome da empresa
- `cnpj`: CNPJ
- `address`: Endereço
- `website`: Site
- `instagram`: Link Instagram
- `facebook`: Link Facebook
- `linkedin`: Link LinkedIn

#### CalendarVersion (Versões do Calendário)
- `id`: ID único
- `clientId`: Referência ao cliente
- `version`: Versão (v1, v2, etc)

#### PostItem (Posts do Calendário)
- `id`: ID único
- `calendarVersionId`: Referência à versão
- `scheduledAt`: Data/hora agendada
- `channel`: Canal (Instagram, Facebook, etc)
- `feedImageUrl`: URL imagem feed
- `storiesImageUrl`: URL imagem stories
- `copyText`: Texto do post
- `status`: Status (pending, approved, adjustments)

#### Comment (Comentários)
- `id`: ID único
- `postItemId`: Referência ao post
- `author`: Autor (agency, client)
- `text`: Texto do comentário
- `createdAt`: Data de criação

#### ShareToken (Tokens de Acesso)
- `id`: ID único
- `token`: Token de acesso
- `calendarVersionId`: Referência à versão
- `expiresAt`: Data de expiração (opcional)

---

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm start
```

### Banco de Dados
```bash
# Sincronizar schema
npm run db:push

# Abrir Prisma Studio
npm run db:studio

# Popular banco com dados
npm run db:seed

# Regenerar Prisma Client
npx prisma generate
```

---

## 🔄 Fluxo de Uso

### Para Administradores

1. **Login**
   - Acesse `/login`
   - Use credenciais de admin
   
2. **Gerenciar Clientes**
   - Vá para `/dashboard`
   - Clique em "Novo Cliente" para adicionar
   - Visualize estatísticas de cada cliente
   
3. **Editar Posts do Calendário**
   - Acesse qualquer calendário de cliente (via dashboard ou URL direta)
   - O sistema detecta automaticamente que você é admin
   - Clique em **"Editar"** para modificar posts
   - Clique em **"Novo Post"** (canto inferior esquerdo) para adicionar
   - Clique no **ícone de lixeira** para deletar
   
4. **Compartilhar com Cliente**
   - Copie a URL gerada automaticamente
   - Compartilhe com o cliente final
   - Cliente pode aprovar/comentar mas NÃO pode editar conteúdo

### Para Clientes Finais

1. **Acessar Calendário**
   - Receber URL com token do admin
   - Abrir em qualquer navegador
   
2. **Revisar Posts**
   - Navegar com setas ou arrastar
   - Ver calendário mensal
   - Clicar em dias para ir ao post
   
3. **Interagir**
   - Marcar como Pendente/Aprovado/Ajustes
   - Adicionar comentários
   - Visualizar artes em tela cheia

---

## 🎨 Temas

O sistema suporta **Dark Mode** e **Light Mode**:

- Toggle no header (ícone de sol/lua)
- Preferência salva automaticamente
- Funciona em todas as páginas

---

## 📊 Estatísticas

### Por Cliente no Dashboard

- **Pendente** (Cinza): Posts aguardando aprovação
- **Aprovado** (Verde): Posts aprovados pelo cliente
- **Ajustes** (Laranja): Posts que precisam de ajustes

### No Calendário

Os dias com posts mostram:
- Número de posts do dia
- Cor baseada no status mais crítico:
  - 🟠 Laranja: Tem posts com ajustes
  - ⚫ Cinza: Tem posts pendentes
  - 🟢 Verde: Todos aprovados

---

## 🔒 Segurança

### Sessões
- Sessões armazenadas em cookies HTTP-only
- Duração: 7 dias
- Renovação automática

### Tokens de Compartilhamento
- Únicos por versão do calendário
- Podem ter data de expiração
- Não requerem login do cliente

---

## 🎨 Modo de Edição (Admin)

### Como Editar Posts

1. **Faça login** no dashboard (`/login`)
2. **Acesse o calendário** do cliente (via dashboard ou URL direta)
3. **Clique em "Editar"** no post desejado
4. **Modifique os campos:**
   - 📅 Data/Hora: Seletor datetime
   - 📺 Canal: Campo de texto
   - 🖼️ Imagens: URLs (Feed e Stories)
   - ✍️ Copy: Área de texto
5. **Clique em "Salvar"** ou "Cancelar"

### Adicionar Novo Post

1. Clique em **"Novo Post"** (canto inferior esquerdo)
2. Post em branco é criado
3. Entre em modo de edição automaticamente
4. Preencha as informações
5. Salve

### Deletar Post

1. Clique no **ícone de lixeira** (vermelho)
2. Confirme a exclusão
3. Post é removido permanentemente

### Diferenças: Cliente vs Admin

| Funcionalidade | Cliente (Token) | Admin (Logado) |
|----------------|-----------------|----------------|
| Visualizar posts | ✅ | ✅ |
| Mudar status | ✅ | ✅ |
| Comentar | ✅ | ✅ |
| Editar data/hora | ❌ | ✅ |
| Editar canal | ❌ | ✅ |
| Editar imagens | ❌ | ✅ |
| Editar copy | ❌ | ✅ |
| Adicionar posts | ❌ | ✅ |
| Deletar posts | ❌ | ✅ |

---

## 📝 Notas Importantes

1. **Produção**: Altere as credenciais padrão
2. **Backup**: Faça backup regular do banco de dados
3. **HTTPS**: Use HTTPS em produção
4. **Tokens**: Mantenha tokens seguros e privados
5. **Senhas**: Implemente hash de senhas (bcrypt) em produção
6. **Edição Admin**: Admin pode editar QUALQUER calendário quando logado
7. **Detecção Automática**: Sistema detecta admin via cookie de sessão

---

## 🆘 Suporte

Em caso de problemas:

1. Verifique se o servidor está rodando: `npm run dev`
2. Verifique a conexão com o banco de dados
3. Consulte logs no terminal
4. Abra o console do navegador (F12)
5. Consulte a documentação: `README.md`

---

**Última atualização:** Janeiro 2026
**Versão:** 1.1.0 - Adicionado sistema de edição para Admin
