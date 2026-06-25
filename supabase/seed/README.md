# Dados de demonstração

O seed é executado pelo cliente autenticado através da função `seedDemoWorkspace` em `src/services/seed.ts`.

Isso garante que `owner_id` seja preenchido por `auth.uid()` e que as políticas RLS sejam exercitadas durante a carga. A função recusa executar quando o workspace já possui leads, evitando duplicações acidentais.

Para usar:

1. Aplique a migration em `supabase/migrations/`.
2. Crie um usuário interno no Supabase Auth.
3. Configure `.env.local` e entre na aplicação.
4. Importe e execute `seedDemoWorkspace()` em uma ação administrativa temporária, ou pelo console de desenvolvimento.

O seed nunca usa `service_role` no navegador.
