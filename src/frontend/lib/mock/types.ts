// Shared domain types for the two-sided stylist <> client app.
// Distinct from catalog `Garment` in lib/mock.ts — the closet models
// *owned* garments parsed from Gmail receipts, while the catalog models
// *shoppable* items.

// ─── Chat ────────────────────────────────────────────────────────────────────

export type ChatMessageSender = 'client' | 'stylist';
export type ChatMessageKind = 'text' | 'look-share' | 'system';

export interface ChatMessage {
  id: string;
  threadId: string; // `${clientId}-${stylistHandle}`
  sender: ChatMessageSender;
  kind: ChatMessageKind;
  body: string;
  lookId?: string; // required when kind === 'look-share'
  createdAt: string; // ISO 8601
}

// ─── Closet (Gmail-derived) ──────────────────────────────────────────────────

export type ClosetCategory =
  | 'top'
  | 'bottom'
  | 'one-piece'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export interface ClosetGarment {
  id: string;
  name: string;
  brand: string;
  category: ClosetCategory;
  imageUrl: string;
  purchasedAt: string; // ISO date
  retailPriceAtPurchase: number;
  source: 'gmail';
  sourceEmailSubject: string;
  sourceRetailer: string;
}

export interface ParsedOrderEmail {
  id: string;
  subject: string;
  from: string;
  received_at: string; // ISO date-time
  retailer: string;
  order_total: number;
  garment_ids: string[]; // references into ClosetGarment[]
}

// ─── Calendar / Outlook events ───────────────────────────────────────────────
// Matches the agent's `CalEvent` shape — snake_case fields intentional so the
// mock drops directly into any agent response surface without reshaping.

export interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  start: string; // ISO date-time
  end: string; // ISO date-time
  location: string;
  dress_code: string;
  weather_hint: string;
  style_keywords: string[];
  notes: string;
  source: 'google_calendar' | 'outlook';
}

// ─── Client preferences ──────────────────────────────────────────────────────

export interface ClientPreferenceSizes {
  top: string;
  bottom: string;
  shoe: string;
}

export interface ClientPreferences {
  brands: string[];
  sizes: ClientPreferenceSizes;
  budget: string;
  aesthetic: string;
  resaleFirst: boolean;
}

// ─── AI brief payload (mirrors real agent response) ──────────────────────────

export interface AIBriefProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  retail_price: number;
  phia_price?: number;
  rationale: string;
}

export interface AIBriefProductsByEvent {
  event_id: string;
  event_title: string;
  products: AIBriefProduct[];
}

export interface AIBriefPayload {
  reply: string;
  events: CalendarEvent[];
  products_by_event: AIBriefProductsByEvent[];
  _mocked?: boolean;
}
