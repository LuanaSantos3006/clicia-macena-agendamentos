# Clicia Macena — Agendamentos

Aplicação de agendamento desenvolvida em Next.js, TypeScript, Tailwind CSS e Prisma.

## Estrutura
- Área pública da cliente
- Fluxo de agendamento
- Login administrativo
- Dashboard e áreas de agenda, clientes, serviços, horários e configurações
- API com validação de conflito de horários
- Banco PostgreSQL via Prisma

## Variáveis de ambiente
Copie `.env.example` para `.env.local` e configure:
- `DATABASE_URL`: conexão PostgreSQL
- `AUTH_SECRET`: segredo longo e aleatório para sessão
- `ADMIN_EMAIL`: e-mail da administradora
- `ADMIN_PASSWORD_HASH`: hash bcrypt da senha, nunca a senha em texto puro
- `NEXT_PUBLIC_WHATSAPP`: telefone público, quando definido

## Desenvolvimento
```bash
npm install
npx prisma db push
npm run dev
```

## Validação
```bash
npm run typecheck
npm run lint
npm run build
```

## Vercel
Configure as mesmas variáveis no projeto Vercel. O banco precisa estar acessível pela aplicação. Depois, faça o deploy da branch `main`.

> Nunca envie `.env` ou credenciais para o GitHub.
