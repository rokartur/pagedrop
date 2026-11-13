# pagedrop

Publish a static HTML page and get a link back. A self-hosted take on
[postplan.dev](https://postplan.dev): one Bun file, pages on disk, one token.

```sh
# new page, random id
curl --data-binary @plan.html -H "Authorization: Bearer $PAGEDROP_TOKEN" https://pagedrop.rokartur.com/
# https://pagedrop.rokartur.com/k3x9Q2mf

# overwrite it, or publish under a chosen name
curl --data-binary @plan.html -H "Authorization: Bearer $PAGEDROP_TOKEN" https://pagedrop.rokartur.com/k3x9Q2mf
curl --data-binary @plan.html -H "Authorization: Bearer $PAGEDROP_TOKEN" https://pagedrop.rokartur.com/q3-plan
```

Use `--data-binary`, not `curl -T`: on a URL ending in `/`, `-T` appends the
file name to the path.

Ids are 1 to 64 characters of `A-Z a-z 0-9 _ -`. Pages are public to anyone
with the link. They are served with a `sandbox` Content-Security-Policy: inline
scripts and styles run, but with an opaque origin, and external scripts, fetch,
frames and forms are blocked. Images, fonts and media load from any `https:` or
`data:` URL.

## Environment

- `PAGEDROP_TOKEN` (required): the upload token.
- `PUBLIC_URL`: base of returned links, e.g. `https://pagedrop.rokartur.com`.
  Defaults to the request origin.
- `DATA_DIR`: where pages live, `/data` by default. Mount a volume there.
- `PORT`: `3000` by default.

```sh
bun test
PAGEDROP_TOKEN=dev DATA_DIR=./data bun server.ts
```
