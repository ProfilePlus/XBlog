# XBlog Object Storage

XBlog now treats object storage as a first-class runtime dependency for admin cover uploads.

## Local development

Use the built-in MinIO stack:

```powershell
pnpm dev:storage
pnpm dev:api
pnpm dev:admin
```

Current local ports:

- API: `http://127.0.0.1:4000`
- MinIO API: `http://127.0.0.1:9000`
- MinIO console: `http://127.0.0.1:9001`

The local stack uses:

- `OBJECT_STORAGE_DRIVER=s3`
- `OBJECT_STORAGE_S3_PROVIDER=minio`
- `OBJECT_STORAGE_S3_ENDPOINT=http://127.0.0.1:9000`
- `OBJECT_STORAGE_S3_BUCKET=xblog-assets`
- `OBJECT_STORAGE_S3_FORCE_PATH_STYLE=true`

Validation commands:

```powershell
pnpm dev:storage
pnpm storage:doctor
pnpm --filter @xblog/api object-storage:verify
```

`pnpm storage:doctor` prints the same readiness/missing-env/live-check summary that the admin `/storage` page now shows in the browser. It exits non-zero when config is incomplete or the live check fails, so it is safe to use in deployment runbooks.

## Provider contract

`OBJECT_STORAGE_DRIVER=local`

- Keeps the old API-served file path for simple local fallback.

`OBJECT_STORAGE_DRIVER=s3`

- Uses the S3-compatible presign flow.
- Requires:
  - `OBJECT_STORAGE_S3_BUCKET`
  - `OBJECT_STORAGE_S3_ACCESS_KEY_ID`
  - `OBJECT_STORAGE_S3_SECRET_ACCESS_KEY`

Optional / provider-specific:

- `OBJECT_STORAGE_S3_PROVIDER=aws`
  - `OBJECT_STORAGE_S3_ENDPOINT` may be omitted.
  - `OBJECT_STORAGE_S3_REGION` must be a real AWS region.
  - Public URL defaults to standard S3 bucket URLs if `OBJECT_STORAGE_PUBLIC_BASE_URL` is empty.

- `OBJECT_STORAGE_S3_PROVIDER=r2`
  - `OBJECT_STORAGE_S3_ENDPOINT` is required.
  - `OBJECT_STORAGE_PUBLIC_BASE_URL` is required.
  - `OBJECT_STORAGE_S3_REGION` usually stays `auto`.

- `OBJECT_STORAGE_S3_PROVIDER=minio`
  - `OBJECT_STORAGE_S3_ENDPOINT` is required.
  - `OBJECT_STORAGE_S3_FORCE_PATH_STYLE=true` is recommended.
  - `OBJECT_STORAGE_PUBLIC_BASE_URL` is optional; if omitted, it is derived from the endpoint.

- `OBJECT_STORAGE_S3_PROVIDER=generic`
  - Use for other S3-compatible targets.
  - `OBJECT_STORAGE_S3_ENDPOINT` is required.
  - `OBJECT_STORAGE_PUBLIC_BASE_URL` is recommended when the public object URL differs from the signing endpoint.

## Example env blocks

### AWS S3

```env
OBJECT_STORAGE_DRIVER=s3
OBJECT_STORAGE_S3_PROVIDER=aws
OBJECT_STORAGE_PUBLIC_BASE_URL=
OBJECT_STORAGE_S3_REGION=ap-southeast-1
OBJECT_STORAGE_S3_ENDPOINT=
OBJECT_STORAGE_S3_BUCKET=my-xblog-assets
OBJECT_STORAGE_S3_ACCESS_KEY_ID=...
OBJECT_STORAGE_S3_SECRET_ACCESS_KEY=...
OBJECT_STORAGE_S3_FORCE_PATH_STYLE=false
```

### Cloudflare R2

```env
OBJECT_STORAGE_DRIVER=s3
OBJECT_STORAGE_S3_PROVIDER=r2
OBJECT_STORAGE_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
OBJECT_STORAGE_S3_REGION=auto
OBJECT_STORAGE_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
OBJECT_STORAGE_S3_BUCKET=my-xblog-assets
OBJECT_STORAGE_S3_ACCESS_KEY_ID=...
OBJECT_STORAGE_S3_SECRET_ACCESS_KEY=...
OBJECT_STORAGE_S3_FORCE_PATH_STYLE=false
```

### MinIO

```env
OBJECT_STORAGE_DRIVER=s3
OBJECT_STORAGE_S3_PROVIDER=minio
OBJECT_STORAGE_PUBLIC_BASE_URL=http://127.0.0.1:9000/xblog-assets
OBJECT_STORAGE_S3_REGION=us-east-1
OBJECT_STORAGE_S3_ENDPOINT=http://127.0.0.1:9000
OBJECT_STORAGE_S3_BUCKET=xblog-assets
OBJECT_STORAGE_S3_ACCESS_KEY_ID=xblogminio
OBJECT_STORAGE_S3_SECRET_ACCESS_KEY=xblogminio123
OBJECT_STORAGE_S3_FORCE_PATH_STYLE=true
```
