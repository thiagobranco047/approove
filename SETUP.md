# 🚀 Guia de Setup Rápido - Approove

Este guia irá ajudá-lo a configurar e rodar o projeto em poucos minutos.

## ⚡ Setup Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

#### Opção A: PostgreSQL Local

Se você já tem PostgreSQL instalado:

```bash
# Criar banco de dados
createdb approove
```

#### Opção B: Docker (Recomendado)

```bash
# Iniciar PostgreSQL com Docker
docker run --name approove-db \
  -e POSTGRES_USER=approove \
  -e POSTGRES_PASSWORD=approove \
  -e POSTGRES_DB=approove \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Para PostgreSQL local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/approove?schema=public"

# Ou para Docker
DATABASE_URL="postgresql://approove:approove@localhost:5432/approove?schema=public"
```

### 4. Sincronizar Schema do Banco

```bash
npm run db:push
```

### 5. Popular Banco com Dados de Exemplo

```bash
npm run db:seed
```

### 6. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

### 7. Acessar Aplicação

Abra seu navegador em:

```
http://localhost:3000/c/demo-client/v1?t=demo-token-123
```

## 🎯 Dados de Exemplo

O comando `db:seed` cria:

- **Cliente**: demo-client
- **Versão**: v1
- **Token**: demo-token-123
- **6 Posts** com diferentes status e canais

## 🛠️ Comandos Úteis

### Visualizar Banco de Dados

```bash
npm run db:studio
```

Abre o Prisma Studio em `http://localhost:5555`

### Limpar e Recriar Banco

```bash
npm run db:push -- --force-reset
npm run db:seed
```

### Adicionar Novo Post Manualmente

Use o Prisma Studio ou crie via código:

```typescript
await prisma.postItem.create({
  data: {
    calendarVersionId: "version-id",
    scheduledAt: new Date("2026-01-25T10:00:00"),
    channel: "Instagram",
    feedImageUrl: "https://example.com/image.jpg",
    copyText: "Seu texto aqui...",
    status: "pending",
  },
});
```

## 🔐 Criar Novo Token de Acesso

Use o Prisma Studio ou crie via código:

```typescript
const shareToken = await prisma.shareToken.create({
  data: {
    token: "my-custom-token",
    calendarVersionId: "version-id",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
  },
});
```

## 🎨 Testar com Suas Próprias Imagens

1. Acesse o Prisma Studio: `npm run db:studio`
2. Navegue até `PostItem`
3. Edite os campos `feedImageUrl` e `storiesImageUrl`
4. Use URLs de imagens públicas ou serviços como:
   - `https://picsum.photos/1080/1080` (Feed)
   - `https://picsum.photos/1080/1920` (Stories)

## 📱 Testar Navegação

- **Setas do Teclado**: ← → para navegar entre posts
- **Botão Calendário**: Visualizar todos os posts do mês
- **Clicar no Dia**: Navegar para o primeiro post daquele dia

## ❓ Problemas Comuns

### Erro: "Can't reach database server"

Verifique se o PostgreSQL está rodando:

```bash
# Se usando Docker
docker ps

# Se instalado localmente
pg_isready
```

### Erro: "Token not found"

Certifique-se de incluir `?t=demo-token-123` na URL.

### Porta 3000 em Uso

Altere a porta:

```bash
PORT=3001 npm run dev
```

## 🚀 Próximos Passos

1. **Personalizar Tema**: Edite `app/globals.css`
2. **Adicionar Clientes**: Use Prisma Studio ou crie via API
3. **Customizar Canais**: Adicione mais canais sociais
4. **Deploy**: Siga o guia no `README.md`

## 📚 Documentação Adicional

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Suporte

Se encontrar problemas:

1. Verifique os logs do terminal
2. Inspecione o console do navegador
3. Verifique a conexão com o banco de dados
4. Consulte a documentação

---

**Pronto!** Seu sistema de validação de calendário editorial está funcionando! 🎉
