# Origami Command Center

Plataforma comercial interna da Origami Labs, com Supabase Auth, PostgreSQL, RLS por usuário e modo demonstração local.

## Configuração local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Preencha `.env.local` sem versioná-lo:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_OU_PUBLISHABLE
```

Nunca use `service_role` ou secret key no frontend.

## Banco e autenticação

1. Crie um projeto no Supabase.
2. Abra **SQL Editor** e execute [202606240001_initial_command_center.sql](supabase/migrations/202606240001_initial_command_center.sql).
3. Em **Authentication → Users**, crie manualmente o usuário interno da Origami Labs.
4. Desative cadastro público nas configurações de Auth se ele estiver habilitado.
5. Configure `.env.local`, reinicie o Vite e entre com e-mail e senha.

A migration cria `profiles`, `leads`, `activities`, `interactions`, `proposals`, `projects` e `settings_options`, além de índices, triggers e políticas RLS. Todas as entidades comerciais têm `owner_id`; usuários só acessam linhas cujo proprietário é `auth.uid()`.

## Dados de demonstração

Sem `.env.local`, a tela de login oferece um modo demo local. Para popular um Supabase real, use `seedDemoWorkspace()` de `src/services/seed.ts` após autenticar em um workspace vazio. Consulte [supabase/seed/README.md](supabase/seed/README.md).

## Qualidade

```bash
npm test
npm run build
npm run lint
npm audit --audit-level=high
```

## Estrutura relevante

- `src/auth/`: sessão, login e proteção do app.
- `src/services/`: operações Supabase e mapeadores.
- `src/store/`: estado compartilhado com Supabase ou fallback demo.
- `supabase/migrations/`: schema, RLS e grants.
- `public/brand/`: logo usada na sidebar e autenticação.
