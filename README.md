# Checklist Diário de Empilhadeira

Web app pensado para celular. O operador lê o QR Code e preenche a inspeção pré-operacional sem precisar de login. O admin vê todas as inspeções em `/admin`.

## Stack
Next.js + Neon (Postgres serverless). Cada item tem uma ilustração em `public/pecas/<id>.svg`. Para usar fotos reais, coloque o arquivo com o mesmo nome e ajuste `imagem()` em `lib/checklist.js`.

## Como configurar
1. Crie um projeto no [Neon](https://neon.tech) e copie a connection string.
2. `cp .env.example .env.local` e preencha `DATABASE_URL` e `ADMIN_PASSWORD`.
3. `npm install`
4. `npm run db:init` cria a tabela (ou rode `schema.sql` no SQL Editor do Neon).
5. `npm run dev` para rodar localmente. Para colocar no ar, faça deploy na Vercel com as mesmas duas variáveis.

## Rotas
- `/` é o formulário público. `/?e=EMP-01` já abre com a empilhadeira preenchida.
- `/admin` pede senha e mostra a lista, os filtros e a exportação em CSV.
- `/admin/<id>` mostra o checklist completo com a assinatura (dá para imprimir).
- `/admin/qrcode` gera e imprime um QR Code para cada empilhadeira.
