---
name: pagedrop
description: Publish an HTML page and get a public link on pagedrop.rokartur.com. Use when the user wants a plan, report, mock or any HTML published as a page or shared by link, or says "opublikuj", "wrzuć jako stronę", "daj link".
---

1. **Build one self-contained HTML file.** Pages are served in a CSP sandbox with an opaque origin. Inline `<style>` and `<script>` run; stylesheets, images, fonts and media load from `https:` or `data:` URLs. External scripts (a Tailwind or React CDN), `fetch`, iframes, forms, cookies and `localStorage` are blocked, so inline every script and keep state in memory. Limit 10 MB. Pages are public to anyone with the link: keep secrets out.
2. **Upload.** The token stays inside the command substitution, out of any output:
   ```sh
   curl -s --data-binary @page.html -H "Authorization: Bearer $(cat ~/.config/pagedrop/token)" https://pagedrop.rokartur.com/
   ```
   It prints the page URL with a random id. To publish under a chosen name, append an id of 1 to 64 characters `A-Z a-z 0-9 _ -` (`https://pagedrop.rokartur.com/q3-plan`). Uploading to an existing id overwrites it, so updates reuse the id and the link stays the same. Use `--data-binary`; `curl -T` appends the file name to the URL.
3. **Check and report.** `curl -s -o /dev/null -w '%{http_code}' <url>` answers `200`. Give the user the URL.
