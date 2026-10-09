# Kopi Senja

One-page website for a fictional coffee shop in Batu, East Java. Plain HTML, CSS, and vanilla
JavaScript. No build step, no backend, no runtime dependencies.

## Files

```
index.html            the whole page
css/style.css         design tokens, layout, components
js/main.js            nav, menu tabs, scroll reveals, opening-hours status
assets/fonts/         self-hosted Archivo + Karla (woff2, font-display: swap)
assets/img/           photography
assets/favicon.svg
```

## Local preview

Open `index.html` directly, or serve the folder:

```
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository.
2. Repository **Settings** > **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save. The site appears at `https://<user>.github.io/<repo>/`.

All asset paths are relative, so the site works from a repository subpath as well as a custom
domain. `.nojekyll` keeps GitHub from running Jekyll over the files.

## Editing

- Prices, menu items: `index.html`, inside the `role="tabpanel"` blocks.
- Opening hours: the `SCHEDULE` map at the top of `js/main.js` (minutes from midnight) and the
  matching rows in `index.html`.
- WhatsApp number: every `https://wa.me/6281233119087` link (number written in international
  format without `+` or spaces).
- Photos: Unsplash, used under the Unsplash License.

## Accessibility notes

- Semantic landmarks, one `h1`, labelled sections, skip link.
- Menu categories follow the WAI-ARIA tabs pattern (arrow keys, Home, End).
- Opening status and today's row are computed in `Asia/Jakarta` and announced via `role="status"`.
- Colour contrast checked in both light and dark themes; `prefers-reduced-motion` disables all
  movement; focus is always visible.
