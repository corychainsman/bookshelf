# 📚 Bookshelf

A personal reading dashboard that turns Obsidian book notes into an interactive web app — grid view, Gantt timeline, and trends charts. Hosted free on GitHub Pages.

**Live demo:** https://corychainsman.github.io/bookshelf/

---

## What it looks like

- **Grid view** — cover thumbnails with title, author, rating, format, source, dates, and color-coded topic tags
- **Timeline view** — Gantt chart of every book by reading period; pinch/scroll to zoom, color by topic/format/source/rating
- **Trends view** — charts of reading pace, ratings, topic breakdown over time
- All filters, view, zoom level, and color scheme are encoded in the URL so links are shareable and bookmarkable

---

## How it works

```
Obsidian notes (YAML frontmatter)
        ↓
  generate_books_json.py
        ↓
   public/books.json
        ↓
  Vite + React app
        ↓
  GitHub Pages
```

### 1. Obsidian notes

Each book is a Markdown file with YAML frontmatter. The script reads all `.md` files from a folder (e.g. `Books I Have Read`) and expects these fields:

```yaml
---
full_title: A Brief History of Intelligence
author:
  - Max S. Bennett
rating: 9               # 0–10
start_date: 2025-07-06
end_date: 2025-07-24
format: audiobook       # audiobook | ebook
where_i_got_it: Libby
finished: true
ISBN: '9780063286368'
image_url: https://...  # cover image (optional but nice)
recommender: null
thoughts: null
---
```

You don't need Obsidian specifically — any system that produces Markdown files with YAML frontmatter will work. The `_filename` field (the note's stem) is used as the unique ID.

### 2. Generate books.json

```bash
pip install pyyaml
python generate_books_json.py
```

Edit the two paths at the top of the script:

```python
VAULT_DIR = Path("/path/to/your/Books I Have Read")
OUT_FILE  = Path("./public/books.json")
```

Re-run this whenever you add or update a book note.

### 3. Topic assignment

Topics are stored directly in the book's YAML frontmatter as a list:

```yaml
topics:
  - Science
  - Psychology
```

`generate_books_json.py` picks them up automatically — no separate file needed. If a book has no `topics` field, it defaults to `["Uncategorized"]`.

The canonical topic list and their colors live in `src/colors.ts` — edit that file to add your own topics.

### 4. Cover images

The `image_url` field in frontmatter drives the cover art. The easiest way to populate these is with the [Google Books API](https://developers.google.com/books):

```python
import requests

def get_cover(isbn):
    r = requests.get(f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&key=YOUR_KEY")
    items = r.json().get("items", [])
    if items:
        return items[0]["volumeInfo"].get("imageLinks", {}).get("thumbnail")
```

---

## Running locally

```bash
npm install
npm run dev
```

Runs at `http://localhost:3847`. The `books.json` in `public/` is loaded at runtime so you can update it without rebuilding.

---

## Deploying to GitHub Pages

1. Fork this repo
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys automatically

The `base` in `vite.config.ts` is set to `/bookshelf/` — change it to your repo name if you fork under a different name:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

---

## Customizing

| File | What to change |
|---|---|
| `src/colors.ts` | Topic colors, format colors, rating gradient |
| `src/topicMap.ts` | Book → topic assignments |
| `src/components/FilterBar.tsx` | Filter options (e.g. add your own sources) |
| `src/index.css` | Theme variables (dark/light colors, accent) |
| `generate_books_json.py` | Input path, output path, extra fields |

---

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (trends charts)
- [GitHub Actions](https://docs.github.com/en/actions) + [GitHub Pages](https://pages.github.com/) (free hosting)
