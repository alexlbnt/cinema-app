# 🎬 Cinema App — Sistema Completo

Sistema de cinema com backend NestJS, frontend web React e app mobile React Native (Expo), compartilhando o mesmo banco de dados.

## 📁 Estrutura

```
app-cinema/
├── cinema-nestjs-swagger-main/   # Backend NestJS + Prisma + JWT
│   └── frontend/                 # Frontend Web (React + Vite)
└── CinemaApp/                    # App Mobile (React Native + Expo)
```

## 🚀 Setup Rápido

### Backend
```bash
cd cinema-nestjs-swagger-main
npm install
npx prisma migrate dev
npx prisma generate
npx ts-node prisma/seed.ts   # popula com dados de teste
npm run start:dev
```
API: `http://localhost:3000` | Swagger: `http://localhost:3000/api`

### Frontend Web
```bash
cd cinema-nestjs-swagger-main/frontend
npm install
npm run dev
```
Acesso: `http://localhost:5173`

### App Mobile
```bash
cd CinemaApp
npm install
npx expo start
```
Escaneie o QR Code com o app **Expo Go**.

## 🔐 Conta de Teste

- **E-mail:** admin@cinema.com
- **Senha:** senha123

## 🛠️ Stack

- **Backend:** NestJS, Prisma, SQLite, JWT, Swagger
- **Frontend Web:** React, Vite
- **Mobile:** React Native, Expo, Expo Router, Zustand, AsyncStorage

## 📚 Documentação

Veja os READMEs específicos:
- [`cinema-nestjs-swagger-main/README.md`](./cinema-nestjs-swagger-main/README.md)
- [`CinemaApp/README.md`](./CinemaApp/README.md)
