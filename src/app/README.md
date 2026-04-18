Start backend with:

```bash
uv run dev
```

Set environment variables in `.env` (repo root):

- `FAL_KEY=...`
- `FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

# Stylist Dashboard Feature

Stylists should be able to manage a portfolio of clients using Phia.

The stylist class links a stylist to all the clients they manage. It should be able to store metadata useful for agents who want to use that metadata to automatically make designs for customers.

The client class also links the client back to the stylist and contains all the designs the stylist made for them.

Store these classes inside utils.py

## Try-on cache

The app now caches try-on outputs by input combination (person image bytes + garment image bytes + mode/category).

- Cache backend: SQLite
- Default path: `.cache/tryon-cache.sqlite3` at repo root
- Override path: set `TRYON_CACHE_DB_PATH=/custom/path/cache.sqlite3`

When the same input combination is uploaded again, the backend returns cached outputs and skips the fal API call.
