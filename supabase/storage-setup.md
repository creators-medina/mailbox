# Supabase Storage Bucket Setup

Storage buckets are not created in SQL migrations. Run these steps once in the
Supabase dashboard or via the Supabase CLI after applying migrations.

## Buckets

### `mail-envelope-images`
- **Purpose:** Envelope exterior photos (admin-uploaded, customer-viewable via signed URL)
- **Public:** No
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`
- **Max file size:** 10 MB

### `mail-scans`
- **Purpose:** Scanned mail content PDFs and images
- **Public:** No
- **Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`
- **Max file size:** 50 MB

## Access Rules

Both buckets use **private access only** (no public URLs). All file access is
via **signed URLs** generated server-side.

### RLS Policies to apply in Supabase dashboard

**`mail-envelope-images` — SELECT (download)**
```sql
-- Customers can download envelope images for their own mail
((bucket_id = 'mail-envelope-images') and (
  exists (
    select 1 from public.mail_items mi
    join public.customers c on c.id = mi.customer_id
    where c.profile_id = auth.uid()
      and mi.envelope_image_url like '%' || storage.objects.name || '%'
  )
  or public.is_admin()
))
```

**`mail-envelope-images` — INSERT/UPDATE/DELETE**
```sql
-- Admins only
(bucket_id = 'mail-envelope-images') and public.is_admin()
```

**`mail-scans` — SELECT (download)**
```sql
-- Customers can download scans for their own mail
((bucket_id = 'mail-scans') and (
  exists (
    select 1 from public.mail_items mi
    join public.customers c on c.id = mi.customer_id
    where c.profile_id = auth.uid()
      and mi.scanned_document_url like '%' || storage.objects.name || '%'
  )
  or public.is_admin()
))
```

**`mail-scans` — INSERT/UPDATE/DELETE**
```sql
-- Admins only
(bucket_id = 'mail-scans') and public.is_admin()
```

## CLI Setup (alternative to dashboard)

```bash
supabase storage create mail-envelope-images --public=false
supabase storage create mail-scans --public=false
```

Then apply the RLS policies above via the Supabase dashboard SQL editor.
