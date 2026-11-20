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

## Integração com Google Calendar

A conexão usa OAuth somente para leitura. Depois de configurar as credenciais, entre na área administrativa, abra **Configurações** e clique em **Conectar Google Calendar**. Autorize a conta que contém a agenda. Eventos com horário serão importados como agendamentos pendentes; quando o nome do serviço do app aparecer no título do evento, o app também associa o valor cadastrado para permitir o lançamento financeiro após a confirmação do pagamento. A sincronização roda ao abrir a seção **Agenda** e também pode ser iniciada em Configurações.

### Configuração necessária no Google Cloud e na hospedagem

1. No Google Cloud Console, habilite a **Google Calendar API** e crie um OAuth Client ID do tipo **Web application**.
2. Em **Authorized redirect URIs**, adicione o endereço do app terminado em `/api/admin/google-calendar/callback` (por exemplo, `https://clicia-macena-agendamentos.vercel.app/api/admin/google-calendar/callback`). Para uma prévia, adicione também o callback do domínio daquela prévia.
3. Adicione estas variáveis ao ambiente Vercel do app: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`. Gere a última com `openssl rand -base64 32`. `GOOGLE_REDIRECT_URI` é opcional; se ficar vazio, o app usa o domínio que iniciou a conexão.
4. O escopo solicitado é somente leitura da agenda. Em modo de teste do consentimento OAuth, inclua a conta Clicia como usuária de teste.

Nunca coloque o segredo OAuth ou a chave de criptografia no código ou no GitHub.
