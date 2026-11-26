# 🎬 CinemaApp — React Native + Expo

Aplicativo mobile completo para compra de ingressos de cinema, construído com **React Native / Expo** consumindo o backend **NestJS + Swagger** existente.

| | Versão |
|---|---|
| Expo SDK | **58** |
| React Native | 0.88 (New Architecture) |
| React | 19.3 |
| Expo Router | 58 |
| TypeScript | 6.0 |

---

## 📱 Funcionalidades

| Feature | Descrição |
|---|---|
| 🔐 **Autenticação** | Login, Cadastro e Recuperação de Senha com JWT |
| 🎬 **Filmes** | Listagem com busca, gênero e classificação etária |
| 🗓️ **Sessões** | Listagem com disponibilidade em tempo real |
| 🪑 **Assentos** | Mapa interativo com seleção de Inteira / Meia |
| 🍿 **Combos** | Seleção de lanches e snacks |
| 💳 **Pagamento** | Revisão do pedido + escolha da forma de pagamento |
| 🎟️ **Comprovante** | QR Code do ingresso + compartilhamento |
| 💾 **Armazenamento Local** | Ingressos salvos no dispositivo via AsyncStorage (DB Sync) |
| 🔄 **Sync** | Sincronização bidirecional com o servidor |

---

## 🏗️ Arquitetura

```
CinemaApp/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout + Auth Guard
│   ├── (auth)/                 # Rotas públicas
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                 # Rotas autenticadas (bottom tabs)
│   │   ├── filmes.tsx          # Lista de filmes
│   │   ├── sessoes.tsx         # Lista de sessões
│   │   ├── ingressos.tsx       # Meus ingressos (local DB)
│   │   └── perfil.tsx          # Perfil do usuário
│   └── checkout/               # Fluxo de compra
│       ├── sessao-picker.tsx   # 1. Escolher sessão
│       ├── assentos.tsx        # 2. Escolher assentos
│       ├── snacks.tsx          # 3. Combos de lanches
│       ├── pagamento.tsx       # 4. Pagamento
│       └── comprovante.tsx     # 5. Comprovante / QR Code
│
├── src/
│   ├── api/index.ts            # Axios + interceptors JWT + detecção do IP do backend
│   ├── store/
│   │   ├── authStore.ts        # Zustand + SecureStore (JWT)
│   │   ├── checkoutStore.ts    # Estado do carrinho
│   │   └── ticketsStore.ts     # AsyncStorage (DB local)
│   └── utils/
│       ├── theme.ts            # Design tokens (cores, espaçamentos)
│       └── format.ts           # Formatadores de data/moeda
│
└── backend-additions/          # Referência histórica (já integrado ao backend)
```

> `backend-additions/` guarda a primeira versão do código de autenticação e dos DTOs que foram levados para o NestJS. O backend em `cinema-nestjs-swagger-main/` já contém uma versão mais completa desse código, então **não é preciso copiar nada**. A pasta fica fora da checagem de TypeScript do app (`exclude` no `tsconfig.json`).

---

## 🚀 Setup do App Mobile

### 1. Instalar dependências

```bash
cd CinemaApp
npm install
```

### 2. Subir o backend

O app precisa do backend rodando na porta `3000`. O passo a passo está no [README da raiz](../README.md#backend). Em resumo:

```bash
cd ../cinema-nestjs-swagger-main
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed          # cria dados de teste e o usuário admin@cinema.com / senha123
npm run start:dev
```

O backend escuta em `0.0.0.0:3000` e tem CORS liberado, então aceita conexões do celular na rede local.

### 3. Rodar o app

```bash
npx expo start --lan
```

Abra o app no celular com o **Expo Go** (versão atual da loja, que suporta o SDK 58):
- **Android:** escaneie o QR Code pelo Expo Go.
- **iPhone:** escaneie o QR Code pela câmera.

Também dá para digitar o endereço direto no Expo Go, em *Enter URL manually*: `exp://<IP do PC>:8081`.

O celular e o PC precisam estar **na mesma rede Wi-Fi**. Se o celular não conectar, verifique se o Firewall do Windows permite o **Node.js** em redes privadas.

### Endereço do backend (automático)

Não é preciso editar o IP do backend no código. O `src/api/index.ts` descobre o IP do PC pelo próprio Expo (`Constants.expoConfig.hostUri`) e monta `http://<IP do PC>:3000`. A ordem de prioridade é:

1. A variável de ambiente `EXPO_PUBLIC_API_URL`, se estiver definida.
2. O IP do PC que está rodando o Expo.
3. `http://10.0.2.2:3000`, que é o endereço do PC visto de dentro do emulador Android.

Para apontar para outro servidor, como um backend hospedado ou outra máquina, crie um arquivo `.env` em `CinemaApp/`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

Depois reinicie o Expo com `npx expo start --clear`.

### 4. Verificações

```bash
npx tsc --noEmit        # checagem de tipos (deve terminar sem erros)
npx expo-doctor         # saúde do projeto e compatibilidade das dependências
```

Ao adicionar uma biblioteca nativa, prefira `npx expo install <pacote>` a `npm install`. Assim a versão instalada é compatível com o SDK 58.

---

## 🔐 Fluxo de Autenticação JWT

```
App Mobile              NestJS Backend
    │                        │
    │── POST /auth/register ─►│
    │◄─ { access_token, user }│
    │                        │
    │── POST /auth/login ────►│
    │◄─ { access_token, user }│
    │                        │
    │  [token salvo em        │
    │   SecureStore]          │
    │                        │
    │── GET /filme ──────────►│
    │   Authorization: Bearer │
    │◄─ [...filmes]           │
```

---

## 💾 Armazenamento Local (DB Sync)

Os ingressos são salvos localmente no dispositivo via **AsyncStorage** para funcionar offline:

```
Compra bem-sucedida
       │
       ▼
API cria Ingresso + Pedido
       │
       ▼
ticketsStore.addTicket() → AsyncStorage (@cinema:tickets)
       │
       ▼
Disponível offline na aba "Ingressos"
```

**Sincronização com servidor:**
```ts
// Chame após login para sincronizar histórico
const { data } = await pedidosApi.getAll();
await syncWithServer(data);
```

---

## 📦 Dependências Principais

| Pacote | Uso |
|---|---|
| `expo-router` | Navegação file-based |
| `expo-secure-store` | Armazenamento seguro do JWT |
| `@react-native-async-storage/async-storage` | DB local dos ingressos |
| `zustand` | State management global |
| `axios` | HTTP client com interceptors |
| `expo-linear-gradient` | Gradientes da UI |
| `react-native-safe-area-context` | Áreas seguras (barra de status, barra de navegação, notch) |
| `react-native-toast-message` | Notificações |
| `date-fns` | Formatação de datas em pt-BR |

---

## 🎨 Design System

O app usa um tema escuro cinematográfico definido em `src/utils/theme.ts`:

- **Background**: `#0A0A0F` (preto profundo)
- **Primary**: `#E50914` (vermelho cinema)
- **Accent**: `#FFD700` (dourado para preços)
- **Cards**: `#12121A` com bordas `#2A2A3E`

### Áreas seguras (edge-to-edge)

Nas versões recentes do Expo (incluindo o SDK 58), o Android desenha o app **por trás da barra de status e da barra de navegação** (modo edge-to-edge). Por isso as telas não usam espaçamentos fixos no topo ou na base, e sim o `SafeAreaView` de `react-native-safe-area-context`, que soma o tamanho real dessas barras ao padding de cada elemento:

| Tipo de tela | Como foi aplicado |
|---|---|
| Abas (Filmes, Sessões, Ingressos, Perfil) | `<SafeAreaView edges={['top']}>` na raiz. A barra de abas cuida da parte de baixo. |
| Barra de abas (`app/(tabs)/_layout.tsx`) | `height` e `paddingBottom` somam `useSafeAreaInsets().bottom`. |
| Checkout com rodapé fixo (Assentos, Lanches, Pagamento) | `edges={['top']}` na raiz, e o próprio rodapé é um `<SafeAreaView edges={['bottom']}>`, para o fundo dele se estender sob a barra de navegação. |
| Checkout sem rodapé fixo (Escolha de sessão, Comprovante) | `edges={['top', 'bottom']}` na raiz. |
| Login, Cadastro, Recuperar senha | `SafeAreaView` **dentro** do `LinearGradient`, para o gradiente ocupar a tela inteira. |

**Ao criar uma tela nova,** importe o `SafeAreaView` de `react-native-safe-area-context` (não o de `react-native`) e escolha as bordas (`edges`) conforme a tabela acima. Não use `paddingTop` fixo para desviar da barra de status.

> O `StatusBar` do `expo-status-bar` não aceita mais `backgroundColor`: no modo edge-to-edge, a barra de status é transparente e mostra o fundo da própria tela.

---

## 🗺️ Fluxo de Compra

```
Filmes → [Selecionar Filme]
   └─► Sessão Picker → [Selecionar Sessão]
          └─► Assentos → [Selecionar Assentos + Tipo]
                 └─► Snacks → [Adicionar Combos]
                        └─► Pagamento → [Confirmar]
                               └─► Comprovante (QR Code)
                                      └─► Salvo em "Meus Ingressos"
```
