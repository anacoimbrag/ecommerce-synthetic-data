# ecomm-data

Servidor mínimo (Node + TypeScript, sem framework) que expõe os JSONs
sintéticos de `./datasources` como uma API HTTP simples.

## Rotas

- `GET /categories` — `datasources/categories.json` inteiro.
- `GET /promotions` — `datasources/promotions.json` inteiro.
- `GET /affiliates` — `datasources/affiliates.json` inteiro. Rede de afiliados/marketplaces
  parceiros; `id` é o código curto referenciado por `orders[].affiliateId` (~30% dos
  pedidos têm um afiliado atribuído, os demais vêm com `affiliateId: ""`).
- `GET /profiles?page=1` — devolve `datasources/cdp_customer_profiles/cdp_profiles_page_01.json`
  (páginas 1–11 já vêm pré-divididas nos arquivos de origem). Só `identity`/
  `descriptive` — pedidos e reembolsos não ficam mais embutidos aqui, ver `/orders`.
- `GET /products?page=1` — devolve `datasources/products_catalog/products_page_01.json`
  (páginas 1–27 já vêm pré-divididas nos arquivos de origem, 200 produtos cada).
- `GET /orders?page=1` — devolve `datasources/orders/orders_page_01.json`
  (páginas 1–47 já vêm pré-divididas nos arquivos de origem, 200 pedidos cada).
  Mesmos `transactionId` dos eventos `purchase` do GA4, vistos pela ótica de um
  sistema de gestão de pedidos (OMS) — `clientId` corresponde ao `identity.cdpId`
  do perfil. `refundedAt`/`refundValue` só vêm preenchidos quando `status` é
  `canceled` (sempre reembolso integral do `totalValue`); `origin`/`salesChannel`
  é o canal de venda do pedido — `"site"`/`1`, `"app"`/`2`, `"marketplace"`/`4` —
  com a proporção `site`/`app` calibrada pela distribuição real de `platform`
  (WEB/ANDROID/IOS) nos eventos `purchase` do GA4 export; pedidos `marketplace`
  não têm evento GA4 correspondente (o checkout de um marketplace externo não é
  rastreado pela propriedade GA4 da própria loja) e vêm com `marketPlaceOrderId`
  preenchido (id externo aleatório) — nos demais é sempre `null`.
  `affiliateId` referencia `/affiliates` quando o pedido veio de um afiliado
  (~30% dos casos); vazio (`""`) nos demais.

## Rodar local

```bash
npm install
npm start        # http://localhost:3000
```

## Rodar com Docker

```bash
docker network create cdp-shared-net   # uma vez só, se ainda não existir
docker compose up --build -d
```

`datasources/` é copiada para dentro da imagem no build — o container é autocontido,
sem depender de nenhum volume externo. Fica na rede `cdp-shared-net`, para que
o [agentic-cdp](../agentic-cdp) (Meltano) consiga chamar `http://ecomm-data:3000`.
