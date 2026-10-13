// Especificação OpenAPI 3.0 da API, servida em /openapi.json e renderizada pelo
// Swagger UI em /docs. Mantenha em sincronia com as rotas de server.ts.

const pageParam = {
  name: "page",
  in: "query",
  required: false,
  description: "Número da página (1-based). Valores inválidos caem para 1.",
  schema: { type: "integer", minimum: 1, default: 1 },
};

const pageNotFound = {
  description: "Página fora do intervalo disponível.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { error: "page 99 not found" },
    },
  },
};

function pagedEnvelope(resource: string, key: string, itemRef: string) {
  return {
    type: "object",
    required: ["apiVersion", "resource", "generatedAt", "page", "pagination", key],
    properties: {
      apiVersion: { type: "string", example: "v1" },
      resource: { type: "string", example: resource },
      generatedAt: { type: "string", format: "date-time", example: "2026-06-30T23:59:59Z" },
      page: { $ref: "#/components/schemas/PageInfo" },
      pagination: { $ref: "#/components/schemas/Pagination" },
      [key]: { type: "array", items: { $ref: itemRef } },
    },
  };
}

function jsonResponse(description: string, schema: object) {
  return { description, content: { "application/json": { schema } } };
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "ecommerce-synthetic-data",
    version: "1.0.0",
    description:
      "Dados sintéticos de e-commerce (catálogo, clientes, pedidos, promoções e afiliados) " +
      "expostos como API REST somente leitura, para testes, pipelines de dados e prototipagem.\n\n" +
      "**Todos os dados são fictícios** — não representam pessoas, produtos ou transações reais.\n\n" +
      "Relações entre recursos:\n" +
      "- `orders[].clientId` → `profiles[].identity.cdpId`\n" +
      "- `orders[].affiliateId` → `affiliates[].id` (~30% dos pedidos; vazio nos demais)\n" +
      "- `orders[].coupon` → `promotions[].utmiCampaign`\n" +
      "- `orders[].items[].itemId` → `products[].items[].itemId`",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    { name: "Catálogo", description: "Produtos e árvore de categorias" },
    { name: "Clientes", description: "Perfis de clientes (CDP)" },
    { name: "Vendas", description: "Pedidos, promoções e afiliados" },
    { name: "Infra", description: "Saúde do serviço" },
  ],
  paths: {
    "/categories": {
      get: {
        tags: ["Catálogo"],
        summary: "Árvore de categorias",
        description: "Hierarquia departamento → categoria → subcategoria do catálogo.",
        operationId: "listCategories",
        responses: {
          "200": jsonResponse("Lista de departamentos (nós raiz).", {
            type: "array",
            items: { $ref: "#/components/schemas/Category" },
          }),
        },
      },
    },
    "/products": {
      get: {
        tags: ["Catálogo"],
        summary: "Catálogo de produtos (paginado)",
        description: "Produtos com marca, categoria, faixa de preço, SKUs e imagens. Páginas 1–27, 200 produtos cada.",
        operationId: "listProducts",
        parameters: [pageParam],
        responses: {
          "200": jsonResponse("Página de produtos.", { $ref: "#/components/schemas/ProductsPage" }),
          "404": pageNotFound,
        },
      },
    },
    "/profiles": {
      get: {
        tags: ["Clientes"],
        summary: "Perfis de clientes (paginado)",
        description:
          "Identidade e atributos descritivos dos clientes. Páginas 1–11, ~200 perfis cada. " +
          "`documentId` vem parcialmente mascarado.",
        operationId: "listProfiles",
        parameters: [pageParam],
        responses: {
          "200": jsonResponse("Página de perfis.", { $ref: "#/components/schemas/ProfilesPage" }),
          "404": pageNotFound,
        },
      },
    },
    "/orders": {
      get: {
        tags: ["Vendas"],
        summary: "Pedidos (paginado)",
        description:
          "Pedidos de compra com itens, valores, status, canal de venda, frete, cupom e reembolso. " +
          "Páginas 1–47, 200 pedidos cada.",
        operationId: "listOrders",
        parameters: [pageParam],
        responses: {
          "200": jsonResponse("Página de pedidos.", { $ref: "#/components/schemas/OrdersPage" }),
          "404": pageNotFound,
        },
      },
    },
    "/promotions": {
      get: {
        tags: ["Vendas"],
        summary: "Campanhas promocionais",
        operationId: "listPromotions",
        responses: {
          "200": jsonResponse("Lista de promoções.", {
            type: "array",
            items: { $ref: "#/components/schemas/Promotion" },
          }),
        },
      },
    },
    "/affiliates": {
      get: {
        tags: ["Vendas"],
        summary: "Afiliados e marketplaces parceiros",
        operationId: "listAffiliates",
        responses: {
          "200": jsonResponse("Lista de afiliados.", {
            type: "array",
            items: { $ref: "#/components/schemas/Affiliate" },
          }),
        },
      },
    },
    "/health": {
      get: {
        tags: ["Infra"],
        summary: "Health check",
        operationId: "health",
        responses: {
          "200": jsonResponse("Serviço no ar.", {
            type: "object",
            properties: { status: { type: "string", example: "ok" } },
          }),
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      PageInfo: {
        type: "object",
        properties: {
          number: { type: "integer", example: 1 },
          size: { type: "integer", example: 200 },
          totalPages: { type: "integer", example: 47 },
          totalRecords: { type: "integer", example: 9341 },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          hasNextPage: { type: "boolean", example: true },
          nextPageToken: {
            type: "string",
            nullable: true,
            example: "page_2",
            description: "Token da próxima página no formato `page_<n>`; use `n` no parâmetro `page`.",
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Masculino" },
          hasChildren: { type: "boolean" },
          children: {
            type: "array",
            description: "Subcategorias; presente quando `hasChildren` é `true`.",
            items: { $ref: "#/components/schemas/Category" },
          },
        },
      },
      Affiliate: {
        type: "object",
        properties: {
          id: { type: "string", example: "LNG", description: "Código curto referenciado por `orders[].affiliateId`." },
          name: { type: "string", example: "Lengow" },
          followUpEmail: { type: "string", format: "email", example: "parceiros@lengow.com" },
          storeHandle: { type: "string", example: "lojadolengow" },
          comission: { type: "number", format: "float", example: 0.05, description: "Comissão (fração, 0.05 = 5%)." },
        },
      },
      Promotion: {
        type: "object",
        properties: {
          lastModifiedUtc: { type: "string", format: "date-time" },
          name: { type: "string", example: "Black Friday - 30% OFF em Toda Loja" },
          description: { type: "string" },
          type: { type: "string", enum: ["regular", "progressive"] },
          utmSource: { type: "string", example: "blackfriday" },
          utmiCampaign: {
            type: "string",
            example: "black-friday-30-off",
            description: "Identificador da campanha; é o valor que aparece em `orders[].coupon`.",
          },
          isActive: { type: "boolean" },
          isArchived: { type: "boolean" },
          hasMaxPricePerItem: { type: "boolean" },
          conditionsIds: { type: "array", items: { type: "string", format: "uuid" } },
          maxUsage: { type: "integer", description: "Limite de usos (0 = ilimitado)." },
        },
      },
      Profile: {
        type: "object",
        properties: {
          identity: {
            type: "object",
            properties: {
              userPseudoId: { type: "string", example: "fc46d5c8f4f8ec3e" },
              cdpId: { type: "string", format: "uuid", description: "Chave do cliente; referenciada por `orders[].clientId`." },
              firstName: { type: "string", example: "Beatriz" },
              lastName: { type: "string", example: "Alves" },
              emails: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    address: { type: "string", format: "email" },
                    isPrimary: { type: "boolean" },
                    verified: { type: "boolean" },
                  },
                },
              },
              phones: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    number: { type: "string", example: "+5511969838454" },
                    type: { type: "string", example: "mobile" },
                    verified: { type: "boolean" },
                  },
                },
              },
              documentId: { type: "string", example: "***.852.540-**", description: "Documento parcialmente mascarado." },
              documentType: { type: "string", example: "CPF" },
            },
          },
          descriptive: {
            type: "object",
            properties: {
              gender: { type: "string", enum: ["Feminino", "Masculino", "Nao informado"] },
              birthDate: { type: "string", format: "date", example: "1986-04-05" },
              communicationPreferences: {
                type: "object",
                properties: {
                  emailOptIn: { type: "boolean" },
                  smsOptIn: { type: "boolean" },
                  pushOptIn: { type: "boolean" },
                  whatsappOptIn: { type: "boolean" },
                },
              },
              languagePreference: { type: "string", example: "pt-BR" },
            },
          },
        },
      },
      PriceRange: {
        type: "object",
        properties: {
          highPrice: { type: "number", example: 226.26 },
          lowPrice: { type: "number", example: 226.26 },
        },
      },
      ProductItem: {
        type: "object",
        description: "SKU (variação) de um produto.",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
          description: "Valores de cada variação listada em `variations` (ex.: `Tamanho: [\"PP\"]`, `Cor: [\"Azul\"]`).",
        },
        properties: {
          itemId: { type: "string", example: "5010637" },
          name: { type: "string", example: "PP Azul" },
          nameComplete: { type: "string", example: "Body Manga Longa 26 PP Azul" },
          measurementUnit: { type: "string", example: "un" },
          unitMultiplier: { type: "number", example: 1 },
          variations: { type: "array", items: { type: "string" }, example: ["Tamanho", "Cor"] },
          ean: { type: "string", example: "7890000010637" },
          isKit: { type: "boolean" },
          attachments: { type: "array", items: { type: "object" } },
          sellers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sellerId: { type: "string", example: "1" },
                sellerName: { type: "string", example: "VTEX" },
                addToCartLink: { type: "string" },
                sellerDefault: { type: "boolean" },
              },
            },
          },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                imageId: { type: "string" },
                cacheId: { type: "string" },
                imageTag: { type: "string" },
                imageLabel: { type: "string" },
                imageText: { type: "string" },
                imageUrl: { type: "string", format: "uri" },
              },
            },
          },
        },
      },
      Product: {
        type: "object",
        properties: {
          productId: { type: "string", example: "2003546" },
          productName: { type: "string", example: "Body Manga Longa 26" },
          productReference: { type: "string", example: "BODY-MANGA-LONGA-26" },
          description: { type: "string" },
          brand: { type: "string", example: "Torque Wear" },
          brandId: { type: "integer", example: 3005 },
          link: { type: "string", example: "/body-manga-longa-26/p" },
          categories: { type: "array", items: { type: "string" }, example: ["/Infantil/Roupas Bebe/Body/"] },
          categoryId: { type: "string", example: "37", description: "Id da categoria folha (ver `/categories`)." },
          categoriesIds: { type: "array", items: { type: "string" }, example: ["/35/36/37/"] },
          priceRange: {
            type: "object",
            properties: {
              sellingPrice: { $ref: "#/components/schemas/PriceRange" },
              listPrice: { $ref: "#/components/schemas/PriceRange" },
            },
          },
          productClusters: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "string" }, name: { type: "string", example: "Lancamentos" } },
            },
          },
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                originalName: { type: "string" },
                values: { type: "array", items: { type: "string" } },
              },
            },
          },
          items: { type: "array", items: { $ref: "#/components/schemas/ProductItem" } },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          itemId: { type: "string", example: "5014792", description: "SKU; corresponde a `products[].items[].itemId`." },
          itemName: { type: "string" },
          brand: { type: "string" },
          category: { type: "string" },
          variant: { type: "string", example: "Unico / Marrom" },
          quantity: { type: "integer", example: 1 },
          price: { type: "number", example: 37.85 },
        },
      },
      Order: {
        type: "object",
        properties: {
          orderId: { type: "string", example: "T202606302321579257" },
          creationDate: { type: "string", format: "date-time" },
          clientName: { type: "string" },
          clientId: { type: "string", format: "uuid", description: "Corresponde a `profiles[].identity.cdpId`." },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          totalItems: { type: "integer" },
          totalValue: { type: "number", example: 97.63 },
          revenue: { type: "number", example: 82.73 },
          shippingValue: { type: "number", example: 14.9 },
          taxValue: { type: "number", example: 0 },
          currencyCode: { type: "string", example: "BRL" },
          paymentNames: {
            type: "string",
            enum: ["Cartão de Crédito", "Cartão de Débito", "Pix", "Boleto Bancário"],
          },
          status: { type: "string", enum: ["payment-approved", "handling", "invoice", "invoiced", "canceled"] },
          statusDescription: {
            type: "string",
            enum: ["Pagamento Aprovado", "Preparando Entrega", "Faturando", "Faturado", "Cancelado"],
          },
          origin: { type: "string", enum: ["site", "app", "marketplace"] },
          salesChannel: {
            type: "integer",
            enum: [1, 2, 4],
            description: "Código do canal: 1 = site, 2 = app, 4 = marketplace.",
          },
          marketPlaceOrderId: {
            type: "string",
            nullable: true,
            description: "Id externo; preenchido só quando `origin` é `marketplace`.",
          },
          affiliateId: {
            type: "string",
            description: "Código em `/affiliates`, ou `\"\"` quando o pedido não veio de afiliado.",
          },
          coupon: {
            type: "string",
            nullable: true,
            example: "black-friday-30-off",
            description: "Cupom aplicado; corresponde a `promotions[].utmiCampaign`.",
          },
          workflowInErrorState: { type: "boolean" },
          workflowInRetry: { type: "boolean" },
          orderIsComplete: { type: "boolean" },
          authorizedDate: { type: "string", format: "date-time", nullable: true },
          ShippingEstimatedDate: { type: "string", format: "date-time", nullable: true },
          ShippingEstimatedDateMax: { type: "string", format: "date-time", nullable: true },
          ShippingEstimatedDateMin: { type: "string", format: "date-time", nullable: true },
          refundedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Preenchido só quando `status` é `canceled`.",
          },
          refundValue: {
            type: "number",
            nullable: true,
            description: "Reembolso integral de `totalValue`; preenchido só quando `status` é `canceled`.",
          },
        },
      },
      ProductsPage: pagedEnvelope("products", "products", "#/components/schemas/Product"),
      ProfilesPage: pagedEnvelope("customer_profiles", "profiles", "#/components/schemas/Profile"),
      OrdersPage: pagedEnvelope("orders", "orders", "#/components/schemas/Order"),
    },
  },
};
