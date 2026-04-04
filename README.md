# DLab Admin (Next.js)

Simple and responsive admin website for managing Supabase data.

## Features

- Fixed credential login (default: `admin@dlab.com` / `MMCAdmin@Dlab`)
- Add product (all key `products` schema fields)
- Delete product by ID
- Create category
- View user details (`profiles` + auth email when available)
- Delete users

## Supabase schema used

Schema was introspected via PostgREST from your project (`zzqeibxwasikdmdoijfb`), using:

- `products`
- `categories`
- `profiles`
- `product_variants` (read for schema context)

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. Run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes

- App is created in a separate folder: `dlab-admin` (outside `dlab`).
- No backend folder/schema files were modified.
- If `SUPABASE_SERVICE_ROLE_KEY` is missing, read operations may still work with anon key but user deletion/admin operations can fail due permissions.
