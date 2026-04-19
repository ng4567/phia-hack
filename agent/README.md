# Introduction

Phia-Stylist is an AI Agent that makes personalized style recommendations based on the content in a user's open claw account. It can read information provided by data connectors like Google Drive, Google Calendar or Outlook emails to get personalized context about a user. It can use this context to generate more personalized responses, and provide a user link to styled outfits they can purchase using Phia.

The ideal frontend is a messaging app like WhatsApp, iMessage or Discord that hits an AI agent backend that can query the data and also do the research to find the styles.

# Architecture

- Frontend: Consumer messaging app (WhatsApp, Discord, Telegram, iMessage)
- Backend: FastAPI
- Agent Runtime: OpenClaw w/connectors to GSuite & M365 for emails and calendar
- LLM Provider: Microsoft Foundry
- Tools:
    - `get_user_events(source: str) -> List[CalEvent]`
        - return a list of events from a user's cal
    - `search_products(events: List[str]) -> dict`
        - return a json containing relevant products for the users events
    - `make_design(products: dict, person_image: Image) -> Image`
        - takes the products from search and an Image class containing a photo and relevant metadata and returns an Image class using the virtual try on API to 
    - `localize(img: Image, event: CalEvent) -> Image`
        - given an image of the customer with a style made for them outputted by the virtual tryon api, return an image of them wearing that style in a inputted location
    
# Features

- create styled outfits for upcoming user events
- update one's Phia closet with recipt data from their emails


# Test cURL request:

```zsh
curl -s -X POST http://127.0.0.1:8000/api/agent/message \
  -H 'Content-Type: application/json' \
  -d '{"message":"dress me for my upcoming events","source":"google_calendar"}'
```

# Stylist Agent

This agent is meant to chat within a messenger like WhatsApp or Telegram and represent an AI Phia stylist. It uses context you give it from platforms like OpenClaw to find you designs.