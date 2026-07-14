# ecomm-data

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

## Rodar local

```bash
npm install
npm start        # http://localhost:3000
```

## Rodar com Docker

```bash
docker compose up --build -d
```

`datasources/` é copiada para dentro da imagem no build — o container é
autocontido, sem depender de nenhum volume externo.
