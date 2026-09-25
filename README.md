# Site do Paulo Mayer — com painel de admin (Cloudflare Pages)

Este projeto é o site completo do Paulo Mayer (home, sobre, shows, vídeos,
fotos, repertório, contratação) **mais** uma seção "Agenda" pública e um
painel de administração em `/admin` pra você (ou o próprio Paulo Mayer)
cadastrar as próximas datas — sem precisar mexer em código.

Por que Cloudflare e não o link do Claude: o link do Claude é ótimo pra
pré-visualizar e ajustar o design, mas não tem como rodar um servidor de
verdade nele nem deixá-lo público com banco de dados sem exigir conta
Claude de quem for editar. Aqui, o site inteiro (design, textos, fotos)
é exatamente o que já estava no Claude — só que agora rodando num
servidor de verdade, com uma senha de admin de verdade.

## Estrutura de pastas

```
paulo-mayer-site/
├── public/                 ← tudo que o navegador carrega (site público)
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js          ← WHATSAPP_NUMBER, VIDEOS[], GALLERY[] ficam aqui
│   ├── images/              (as duas fotos já usadas no site)
│   └── admin/               (painel de administração)
│       ├── index.html
│       ├── admin.css
│       └── admin.js
├── functions/               ← o "servidor" (Cloudflare Pages Functions)
│   ├── api/
│   │   ├── shows.js         (GET/POST/PUT/DELETE da agenda)
│   │   ├── login.js
│   │   └── logout.js
│   └── _lib/
│       ├── auth.js          (sessão/senha)
│       └── store.js         (leitura/gravação no KV)
├── wrangler.toml
└── README.md                ← este arquivo
```

## O que você precisa ter

Uma conta na [Cloudflare](https://dash.cloudflare.com/sign-up) (grátis
pro que a gente precisa aqui). Como você já usa Cloudflare Workers AI
no simulador da Zara, é a mesma conta.

## Passo a passo do deploy

### 1. Criar o projeto no Cloudflare Pages

A forma mais simples de manter isso atualizado no futuro é conectar um
repositório Git:

1. Suba esta pasta pra um repositório no GitHub (pode ser privado).
2. No dashboard da Cloudflare: **Workers & Pages → Create → Pages →
   Connect to Git** e escolha o repositório.
3. Configurações de build:
   - **Framework preset:** None
   - **Build command:** (deixe em branco)
   - **Build output directory:** `public`
4. Clique em **Save and Deploy**.

Alternativa sem Git (linha de comando, via Wrangler — o mesmo CLI que
você já usa pros Workers):

```bash
npm install -g wrangler
wrangler login
cd paulo-mayer-site
wrangler pages deploy public --project-name=paulo-mayer
```

O Wrangler detecta a pasta `functions/` automaticamente (ela precisa
ficar do lado de fora de `public/`, exatamente como está aqui).

> Atenção: se você fizer upload manual da pasta pelo dashboard (arrastar
> e soltar, sem Git e sem Wrangler), o Cloudflare publica só os arquivos
> estáticos — o painel de admin e a agenda pública **não funcionam**
> nesse modo, porque a pasta `functions/` não é enviada. Use Git ou
> Wrangler.

### 2. Criar o KV namespace (onde a lista de shows fica salva)

1. No dashboard: **Workers & Pages → KV → Create a namespace**.
2. Nome sugerido: `paulo-mayer-shows`.
3. Volte no seu projeto Pages: **Settings → Functions → KV namespace
   bindings → Add binding**.
   - **Variable name:** `SHOWS_KV` (tem que ser exatamente esse nome)
   - **KV namespace:** selecione o `paulo-mayer-shows` que você criou

### 3. Configurar a senha do painel

Ainda em **Settings** do projeto → **Environment variables** → **Add
variable** (marque como **Encrypt**, pra ficar como "secret"):

| Nome | Valor |
|---|---|
| `ADMIN_PASSWORD` | a senha que o Paulo Mayer vai digitar em `/admin` |
| `SESSION_SECRET` | uma string aleatória longa, só pra assinar o login — não precisa decorar. Gere uma com `openssl rand -hex 32` no terminal, ou qualquer gerador de senha forte |

Adicione as duas tanto em **Production** quanto em **Preview** (se for
usar preview deploys). Depois de salvar, faça um novo deploy pra elas
entrarem em vigor (**Deployments → ... → Retry deployment**, ou um novo
`git push`/`wrangler pages deploy`).

Pra trocar a senha depois, é só editar `ADMIN_PASSWORD` aqui e fazer
outro deploy — não precisa mexer em código.

### 4. Pronto — acessar o painel

`https://SEUSITE.pages.dev/admin` (ou no seu domínio próprio, se
configurar um — **Custom domains** no mesmo projeto Pages).

Faça login com a senha do passo 3. De lá dá pra cadastrar, editar e
excluir shows (data, horário, local, cidade, link de ingresso opcional,
observação interna). O que for cadastrado com data de hoje em diante
aparece automaticamente na seção **Agenda** do site público — não
precisa publicar nada manualmente.

## Campos de cada show

| Campo | Obrigatório? | Onde aparece |
|---|---|---|
| Data | sim | Define a ordem e se aparece no site (só datas futuras) |
| Horário | não | Ao lado da cidade, no site público |
| Local | sim | Nome do lugar/casa/evento |
| Cidade | não | Ao lado do horário |
| Link de ingressos | não | Vira um botão "Ingressos" no site (se preenchido) |
| Observação | não | Só aparece no painel, uso interno — não é exibida no site |

## O que ainda falta preencher no site

Isso é o mesmo site que já estava no Claude, então as mesmas pendências
seguem valendo (procure pelos comentários `<!-- ... -->` no topo de
`public/index.html` pra achar cada uma no código):

- Número de WhatsApp real (`public/js/main.js`, `WHATSAPP_NUMBER`)
- Ficha do artista e texto de trajetória (seção "Sobre")
- Formatos de evento atendidos (seção "O Show")
- Vídeos reais (`VIDEOS[]` em `public/js/main.js`)
- Fotos da galeria (`GALLERY[]` em `public/js/main.js`)
- Repertório/estilos musicais
- Outras redes sociais além do Instagram

## Testando localmente (opcional)

Se quiser testar tudo — inclusive login e agenda — antes de publicar:

```bash
wrangler kv namespace create SHOWS_KV
# copie o "id" que aparecer e cole no wrangler.toml
wrangler pages dev public --kv SHOWS_KV
```

Isso sobe o site em `http://localhost:8788` com o backend funcionando de
verdade (local). Pra testar o login localmente, defina as variáveis num
arquivo `.dev.vars` na raiz do projeto:

```
ADMIN_PASSWORD=uma_senha_de_teste
SESSION_SECRET=qualquer_string_longa_aleatoria
```

## Sobre a segurança do painel

A senha é única (compartilhada com quem for administrar) e o cookie de
sessão dura 8 horas. É simples de propósito — sem contas de usuário —
porque o Paulo Mayer não precisa de conta Cloudflare/Claude pra usar.
Pra esse tamanho de site (uma pessoa administrando a própria agenda),
isso é proporcional; se um dia fizer sentido ter múltiplos
administradores com senhas separadas, dá pra evoluir depois.
