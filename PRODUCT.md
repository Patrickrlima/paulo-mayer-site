# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Contratantes de todos os nichos de evento, sem um público dominante:

- noivos e festas particulares (casamento, aniversário, formatura);
- empresas e produtores de eventos corporativos;
- casas noturnas e bares que fecham datas;
- organizadores de eventos públicos.

Público secundário: fãs e seguidores que consultam a agenda de shows e acompanham o artista.

Usuário administrativo: Paulo Mayer (ou quem ele designar), que cadastra datas da agenda em `/admin` sem mexer em código.

## Product Purpose

Site oficial do cantor Paulo Mayer. O objetivo principal é gerar pedidos de orçamento para eventos: o visitante entende quem é o artista, vê o artista ao vivo (vídeos, fotos, repertório) e envia um pedido de contratação. Sucesso = contatos qualificados chegando pelo WhatsApp com os dados do evento já preenchidos.

Objetivo secundário: divulgar as apresentações públicas confirmadas (agenda).

## Positioning

Paulo Mayer é um cantor de **Osório, RS**, com **mais de 20 anos de carreira**. O repertório reúne **música gauchesca, sertaneja e tradicional**. O show se adapta ao evento: voz e violão, com gaita, com banda, solo ou em dupla. Essa combinação de raiz gaúcha, longa estrada e formato flexível é o diferencial que outros cantores de evento não podem alegar.

## Operating Context

- A contratação acontece pelo WhatsApp: o formulário (nome, WhatsApp, e-mail, tipo de evento, cidade, data, nº de convidados, mensagem) monta uma mensagem e abre o WhatsApp. Não existe backend de leads.
- Tipos de evento oferecidos no formulário: casamento, festa particular, evento corporativo, casa noturna/bar, formatura, evento público, outro.
- O Instagram @cantorpaulomayer é a principal referência pública do artista e o canal social oficial.
- A agenda é lida em tempo real de `/api/shows` e editada num painel `/admin` protegido por senha.

## Capabilities and Constraints

- Site estático (HTML/CSS/JS puro em `public/`) servido por Cloudflare Workers com assets estáticos (`src/index.js`, `wrangler.toml`); a agenda fica no Workers KV (`SHOWS_KV`). O deploy é feito por GitHub Actions (`.github/workflows/deploy.yml`).
- Não há framework nem etapa de build; o código deve continuar editável por não especialistas (a configuração de conteúdo fica em `public/js/main.js`: `WHATSAPP_NUMBER`, `VIDEOS[]`, `GALLERY[]`).
- Idioma: português do Brasil.
- Hoje o site está em "modo rascunho", com espaços reservados sinalizados para os dados reais pendentes.

## Brand Commitments

- Nome artístico: **Paulo Mayer**, cantor de Osório, RS, com mais de 20 anos de carreira.
- Estilo: música gauchesca, sertaneja e tradicional.
- Formatos de show: voz e violão, com gaita, com banda, solo ou em dupla, entre outros. A lista não é fechada; o formato é ajustado a cada evento.
- Instagram oficial: @cantorpaulomayer.
- Nenhuma informação específica do artista pode ser inventada; conteúdo pendente aparece como espaço reservado sinalizado.

## Evidence on Hand

Existe:

- dois retratos: `public/images/hero-portrait.webp` e `public/images/sobre-retrato.webp`;
- fotos de show (confirmado que existem; ainda não foram adicionadas ao repositório);
- número real de WhatsApp (ainda não aplicado; `WHATSAPP_NUMBER` continua com um valor de exemplo);
- repertório (existe; ainda não foi publicado).

Não existe (não fabricar):

- **depoimentos de clientes**, então não há seção de prova social;
- vídeos ao vivo confirmados;
- outras redes além do Instagram.

## Product Principles

1. **Tudo leva à contratação.** Cada seção deve aproximar o visitante do pedido de orçamento pelo WhatsApp.
2. **Nada inventado.** Só aparecem fatos, mídias e provas confirmados; o que está pendente é sinalizado de forma honesta.
3. **Ver para contratar.** Evidência real do artista ao vivo (fotos, vídeos, repertório) vale mais que qualquer adjetivo.
4. **Atender todos os tipos de evento.** A comunicação serve do casamento ao corporativo sem se prender a um único nicho.
5. **Fácil de manter.** O artista atualiza agenda e conteúdo sem desenvolvedor.
