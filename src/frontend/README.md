Frontend would like:

- Homepage: Stylist dashboard
    - visualize a list of all clients and a few business KPIs
    - contain a list of chats with clients
- Client page (clicked into from dashboard)
    - message history with clients
    - send them design with their virtual avatar
- Client home
    - messages with stylist(s)
- Client design viewer
    - view styles on their virtual avatar
- Client purchase page
    - Purchase the style with Phia

## Try-on backend URL

Set `NEXT_PUBLIC_TRYON_BACKEND_URL` to your FastAPI backend address (for example `http://127.0.0.1:8000`), which should be different from the frontend address. This variable is required in production.
