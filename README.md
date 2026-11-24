# 🌙 SYNCHRO

Aplicativo mobile para casais, amigos e famílias guardarem **momentos**, **memórias** e **descobertas** em um **espaço compartilhado**, e vê-los virar estrelas e constelações no **Universo**. Mascote: **NOX** 🐈‍⬛.

Projeto Final — Desenvolvimento de Dispositivos Móveis II (INFONET).

## Requisitos do projeto × solução

| Requisito | Solução |
|---|---|
| Front-end em React Native | Expo (template `blank`, JavaScript) — pasta `mobile/` |
| Back-end Node.js/Express | Express + JWT — pasta `backend/` |
| Banco de dados (relacional, local ou hospedado) | **SQLite** local (arquivo `backend/data/synchro.db`, criado automaticamente) |
| Repositório no GitHub + README | este repositório |

## Funcionalidades
- Cadastro, login e sessão (JWT guardado com `expo-secure-store`; senhas com bcrypt)
- **Espaços compartilhados**: criar, entrar por código de convite, listar participantes, remover/sair, excluir (apenas administrador)
- **Momentos** (eventos): criar, marcar como realizado, excluir
- **Memórias**: criar com data, local e categoria; excluir
- **Descobertas** (lista de desejos): criar, concluir e transformar em memória
- **Universo**: cada memória, momento realizado e descoberta concluída vira uma estrela, agrupada em constelações por trimestre (posição determinística)
- Permissões no servidor: só participantes acessam o conteúdo de um espaço (403 caso contrário)

## Como rodar

Pré-requisitos: **Node.js 20+** e o app **Expo Go** no celular (celular e computador na **mesma rede Wi-Fi**).

### 1) Backend
```bash
cd backend
npm install
npm start
```
Abre em `http://localhost:3333/api` (teste: `http://localhost:3333/api/health`). O banco SQLite é criado sozinho — nada para instalar.

Testes automáticos (fluxo completo + permissões): `npm test`

> Windows: se o celular não conectar, libere a porta **3333** no firewall (ou permita o Node.js em redes privadas).

### 2) App
Em outro terminal:
```bash
cd mobile
npm install
npx expo start
```
Escaneie o QR Code com o Expo Go. O app descobre sozinho o IP do computador e usa a porta 3333.
Se necessário, force o endereço da API:
```bash
# Linux/macOS
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333/api npx expo start
# Windows (PowerShell)
$env:EXPO_PUBLIC_API_URL="http://192.168.0.10:3333/api"; npx expo start
```
Emulador Android: use `http://10.0.2.2:3333/api`.

### Primeiro uso
1. Crie uma conta → crie um espaço (você vira administrador e recebe um código).
2. Em outro aparelho/conta, use **Entrar com código** para participar.
3. Cadastre momentos, memórias e descobertas; veja as estrelas na aba **Universo**.

## Estrutura
```
backend/  src/{app,server,db,auth}.js  src/routes/{auth,spaces,items,universe}.js  tests/api.test.js
mobile/   App.js  src/{api,theme,ui}.js  src/{Auth,Spaces,Space}Screen.js  src/{Items,Universe}Tab.js
```

## API (resumo)
`POST /api/auth/register|login` · `GET /api/auth/me` · `GET|POST /api/spaces` · `POST /api/spaces/join` · `GET|DELETE /api/spaces/:id` · `DELETE /api/spaces/:id/members/:userId` · `GET|POST /api/spaces/:id/{events|memories|discoveries}` · `PATCH|DELETE /api/{events|memories|discoveries}/:id` · `POST /api/discoveries/:id/to-memory` · `GET /api/spaces/:id/universe`

## Limitações conhecidas
- Sem upload de fotos nem notificações push (fora do escopo desta versão).
- Backend com SQLite local, pensado para demonstração; para produção, trocar o `JWT_SECRET` (variável de ambiente) e hospedar o servidor.
- O app foi validado por empacotamento (`expo export`) e o backend por testes automatizados; teste no seu aparelho antes da apresentação.
