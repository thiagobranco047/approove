# 📚 Documentação da API - Approove

## Autenticação

Todas as rotas requerem um token válido passado como query parameter `t` ou no body da requisição.

```
?t=TOKEN
```

## Endpoints

### 1. Listar Posts do Calendário

Retorna todos os posts de uma versão específica do calendário.

**Endpoint:**
```
GET /api/calendar/[clientSlug]/[versionId]/posts?t=TOKEN
```

**Parâmetros:**
- `clientSlug` (path): Slug do cliente
- `versionId` (path): ID da versão do calendário
- `t` (query): Token de acesso

**Resposta de Sucesso (200):**
```json
{
  "posts": [
    {
      "id": "post-id",
      "scheduledAt": "2026-01-15T10:00:00.000Z",
      "channel": "Instagram",
      "feedImageUrl": "https://example.com/image.jpg",
      "storiesImageUrl": "https://example.com/stories.jpg",
      "copyText": "Texto da publicação...",
      "status": "pending",
      "comments": [
        {
          "id": "comment-id",
          "author": "client",
          "text": "Texto do comentário",
          "createdAt": "2026-01-15T11:00:00.000Z"
        }
      ]
    }
  ]
}
```

**Erros:**
- `401`: Token não fornecido ou inválido
- `403`: Token não pertence a este calendário
- `500`: Erro interno do servidor

**Exemplo:**
```javascript
const response = await fetch(
  '/api/calendar/demo-client/v1/posts?t=demo-token-123'
);
const data = await response.json();
console.log(data.posts);
```

---

### 2. Atualizar Status do Post

Atualiza o status de aprovação de um post.

**Endpoint:**
```
PATCH /api/posts/[postId]/status
```

**Parâmetros:**
- `postId` (path): ID do post

**Body:**
```json
{
  "status": "pending" | "approved" | "adjustments",
  "token": "TOKEN"
}
```

**Resposta de Sucesso (200):**
```json
{
  "post": {
    "id": "post-id",
    "status": "approved",
    "updatedAt": "2026-01-15T12:00:00.000Z"
  }
}
```

**Erros:**
- `400`: Status inválido
- `401`: Token não fornecido ou inválido
- `404`: Post não encontrado
- `500`: Erro interno do servidor

**Exemplo:**
```javascript
const response = await fetch('/api/posts/post-123/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'approved',
    token: 'demo-token-123'
  })
});
const data = await response.json();
```

---

### 3. Adicionar Comentário

Adiciona um comentário a um post.

**Endpoint:**
```
POST /api/posts/[postId]/comments
```

**Parâmetros:**
- `postId` (path): ID do post

**Body:**
```json
{
  "text": "Texto do comentário",
  "author": "agency" | "client",
  "token": "TOKEN"
}
```

**Resposta de Sucesso (200):**
```json
{
  "comment": {
    "id": "comment-id",
    "postItemId": "post-id",
    "author": "client",
    "text": "Texto do comentário",
    "createdAt": "2026-01-15T13:00:00.000Z"
  }
}
```

**Erros:**
- `400`: Texto ou autor inválidos
- `401`: Token não fornecido ou inválido
- `404`: Post não encontrado
- `500`: Erro interno do servidor

**Exemplo:**
```javascript
const response = await fetch('/api/posts/post-123/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Ótima arte! Aprovado.',
    author: 'client',
    token: 'demo-token-123'
  })
});
const data = await response.json();
```

---

## Tipos TypeScript

### Post
```typescript
interface Post {
  id: string;
  scheduledAt: string; // ISO 8601
  channel: string;
  feedImageUrl?: string | null;
  storiesImageUrl?: string | null;
  copyText: string;
  status: "pending" | "approved" | "adjustments";
  comments: Comment[];
}
```

### Comment
```typescript
interface Comment {
  id: string;
  author: "agency" | "client";
  text: string;
  createdAt: string; // ISO 8601
}
```

---

## Fluxo de Integração

### 1. Criar Cliente e Versão

```typescript
// Via Prisma (backend)
const client = await prisma.client.create({
  data: {
    slug: "meu-cliente",
    name: "Meu Cliente S/A"
  }
});

const version = await prisma.calendarVersion.create({
  data: {
    clientId: client.id,
    version: "v1"
  }
});
```

### 2. Criar Token de Acesso

```typescript
const shareToken = await prisma.shareToken.create({
  data: {
    token: "token-personalizado-123",
    calendarVersionId: version.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
  }
});
```

### 3. Adicionar Posts

```typescript
const post = await prisma.postItem.create({
  data: {
    calendarVersionId: version.id,
    scheduledAt: new Date("2026-01-20T15:00:00"),
    channel: "Instagram",
    feedImageUrl: "https://cdn.example.com/image.jpg",
    storiesImageUrl: "https://cdn.example.com/stories.jpg",
    copyText: "Confira nossas novidades! #marketing",
    status: "pending"
  }
});
```

### 4. Compartilhar Link

```
https://seu-dominio.com/c/meu-cliente/v1?t=token-personalizado-123
```

---

## Segurança

### Token Validation
- Tokens são validados em cada requisição
- Tokens expirados são rejeitados
- Tokens devem pertencer ao calendário correto

### Rate Limiting
Considere implementar rate limiting em produção:

```typescript
// Exemplo com middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de requisições
});
```

### CORS
Configure CORS apropriadamente se integrar com outras aplicações:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" }
        ]
      }
    ];
  }
};
```

---

## Webhook (Futuro)

Possível implementação de webhooks para notificar sobre mudanças:

```typescript
// Exemplo de payload
{
  "event": "post.status_changed",
  "data": {
    "postId": "post-id",
    "oldStatus": "pending",
    "newStatus": "approved",
    "changedAt": "2026-01-15T14:00:00.000Z"
  }
}
```

---

## Exemplos de Integração

### React Hook Personalizado

```typescript
import { useEffect, useState } from 'react';

function usePosts(clientSlug: string, versionId: string, token: string) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/calendar/${clientSlug}/${versionId}/posts?t=${token}`)
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts);
        setLoading(false);
      });
  }, [clientSlug, versionId, token]);

  return { posts, loading };
}
```

### Node.js Client

```javascript
const axios = require('axios');

class ApprooveClient {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      params: { t: token }
    });
  }

  async getPosts(clientSlug, versionId) {
    const { data } = await this.client.get(
      `/api/calendar/${clientSlug}/${versionId}/posts`
    );
    return data.posts;
  }

  async updateStatus(postId, status) {
    const { data } = await this.client.patch(
      `/api/posts/${postId}/status`,
      { status, token: this.client.defaults.params.t }
    );
    return data.post;
  }
}
```

---

## Troubleshooting

### Erro 401: Unauthorized
- Verifique se o token está correto
- Confirme que o token não está expirado
- Certifique-se de passar o token corretamente

### Erro 403: Forbidden
- Token válido mas não pertence ao calendário solicitado
- Verifique clientSlug e versionId

### Erro 500: Internal Server Error
- Verifique conexão com banco de dados
- Consulte logs do servidor
- Verifique se todas as migrations foram aplicadas

---

**Need Help?** Consulte o README.md ou entre em contato com o suporte técnico.
