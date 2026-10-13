# ecommerce-synthetic-data 

Servidor mínimo (Node + TypeScript, sem framework) que expõe dados sintéticos
de e-commerce (`./datasources`) como uma API REST simples, pensada para servir
de fonte de dados de teste/demonstração para integrações, pipelines de dados
e prototipagem.

## Rotas

- `GET /categories` — árvore de categorias do catálogo (departamento → categoria
  → subcategoria), cada nó com `id`, `name` e `hasChildren`.
- `GET /promotions` — campanhas promocionais (nome, descrição, período de
  vigência, se está ativa/arquivada, condições de aplicação, UTMs de origem).
- `GET /affiliates` — rede de afiliados/marketplaces parceiros; `id` é o código
  curto referenciado por `orders[].affiliateId` (~30% dos pedidos têm um
  afiliado atribuído, os demais vêm com `affiliateId: ""`).
- `GET /profiles?page=1` — perfis de clientes (dados de identidade e atributos
  descritivos: nome, contatos, documento, gênero, data de nascimento,
  preferências de comunicação). Paginado (páginas 1–11, ~200 perfis cada).
- `GET /products?page=1` — catálogo de produtos (nome, marca, categoria, preço,
  variações/SKUs, imagens). Paginado (páginas 1–27, 200 produtos cada).
- `GET /orders?page=1` — pedidos de compra (itens, valores, status, canal de
  venda, frete, cupom, reembolso quando aplicável). Paginado (páginas 1–47,
  200 pedidos cada).

- `GET /docs` — Swagger UI com todas as rotas, parâmetros e schemas de
  resposta documentados (spec OpenAPI 3.0 em `GET /openapi.json`, definida em
  [`src/openapi.ts`](src/openapi.ts) — atualize-a junto com as rotas de
  `src/server.ts`). O Swagger UI é carregado via CDN (unpkg).

Recursos paginados seguem o mesmo envelope de resposta:

```json
{
  "apiVersion": "v1",
  "resource": "orders",
  "generatedAt": "2026-06-30T23:59:59Z",
  "page": { "number": 1, "size": 200, "totalPages": 47, "totalRecords": 9341 },
  "pagination": { "hasNextPage": true, "nextPageToken": "page_2" },
  "orders": [ /* ... */ ]
}
```

## Regras básicas de geração dos dados

- `clientId` de `/orders` corresponde ao `identity.cdpId` do perfil em
  `/profiles` — permite juntar pedidos ao cliente que os fez.
- `refundedAt`/`refundValue` em `/orders` só vêm preenchidos quando `status`
  é `canceled` (sempre reembolso integral do `totalValue`).
- `origin`/`salesChannel` é o canal de venda do pedido — `"site"`/`1`,
  `"app"`/`2`, `"marketplace"`/`4`.
- Pedidos de `origin: "marketplace"` vêm com `marketPlaceOrderId` preenchido
  (id externo aleatório); nos demais canais é sempre `null`.
- `affiliateId` referencia `/affiliates` quando o pedido veio de um afiliado
  (~30% dos casos); vazio (`""`) nos demais.
- Documentos pessoais (`documentId`) em `/profiles` vêm parcialmente
  mascarados (ex.: `***.852.540-**`).
- Todos os dados são sintéticos/fictícios, gerados para fins de teste — não
  representam pessoas, produtos ou transações reais.

## Rodar local (standalone)

```bash
npm install
npm start        # http://localhost:3000
```

Ou via [`stack.sh`](stack.sh) (mesmo resultado, mas idempotente — não
reinstala/reinicia se já estiver no ar, e sabe esperar o `/health` responder
antes de devolver o controle; é o que o `ecommerce-data-pipeline` usa por baixo dos
panos):

```bash
./stack.sh up     # npm install + npm start em background
./stack.sh down   # para o processo que está ouvindo em :3000 (ou $PORT)
```

Porta customizável via `PORT` (default `3000`), ex.: `PORT=4000 ./stack.sh up`.

## Rodar com Docker (legado)

O projeto não depende mais de Docker no dia a dia (ver seção acima), mas o
`Dockerfile`/`docker-compose.yml` continuam funcionando se precisar:

```bash
docker compose up --build -d
```

`datasources/` é copiada para dentro da imagem no build — o container é
autocontido, sem depender de nenhum volume externo.
