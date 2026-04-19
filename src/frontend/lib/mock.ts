// Mock data for Phia for Stylists — typed port of the mockup data.js.
// Images are placeholder URLs — Unsplash for photography.
// Styled like Phia's catalog (editorial, on-model, flat-lay).

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Stylist {
  name: string;
  handle: string;
  photoUrl: string;
}

export interface ClientSizing {
  top: string;
  bottom: string;
  shoe: string;
}

export interface Client {
  id: string;
  name: string;
  location: string;
  photoUrl: string;
  sizing: ClientSizing;
  notes: string;
  looksCount: number;
  lastUpdated: string;
  accent: string;
}

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'one-piece'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export type GarmentCondition = 'new' | 'like-new' | 'good' | 'fair';

export interface PhiaInfo {
  lowest: number;
  source: string;
  condition: GarmentCondition;
  savings: number;
}

export interface Garment {
  id: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  retailPrice: number;
  imageUrl: string;
  phia: PhiaInfo;
}

export type LookStatus = 'draft' | 'ready' | 'shared';

export interface Look {
  id: string;
  clientId: string;
  occasion: string;
  location?: string;
  createdAt: string;
  status: LookStatus;
  garmentIds: string[];
  tryOnImageUrl?: string;
  coverUrl: string;
}

export interface PhiaSourceRow {
  source: string;
  price: number;
  condition: GarmentCondition | 'new';
  size: string;
  ships: string;
  seller: string;
  best?: boolean;
  retail?: boolean;
}

export type LookHistoryKind = 'share' | 'edit' | 'note' | 'swap' | 'create';

export interface LookHistoryEntry {
  at: string;
  actor: string;
  kind: LookHistoryKind;
  label: string;
}

export interface LookTotals {
  retail: number;
  phia: number;
  savings: number;
  savingsPct: number;
  garments: Garment[];
}

export interface MockShape {
  stylist: Stylist;
  clients: Client[];
  garments: Garment[];
  looks: Record<string, Look[]>;
}

// ─── Data ───────────────────────────────────────────────────────────────────

export const MOCK: MockShape = {
  stylist: {
    name: 'Jess Martell',
    handle: '@jess.styles',
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces',
  },

  clients: [
    {
      id: 'sarah',
      name: 'Phoebe Gates',
      location: 'New York, NY',
      photoUrl: '/clients/phoebe.png',
      sizing: { top: 'XS', bottom: '24', shoe: '7' },
      notes:
        'Romantic-feminine with a resale-first rule. Lives in Oscar de la Renta, Miu Miu, Chloé — ribbons, bows, tea-length florals. Mix designer with vintage; never new fast-fashion. Press days lean polished.',
      looksCount: 12,
      lastUpdated: '2 days ago',
      accent: '#C8B89E',
    },
    {
      id: 'maya',
      name: 'Sophia Kianni',
      location: 'New York, NY',
      photoUrl: '/clients/sophia.png',
      sizing: { top: 'XS', bottom: '25', shoe: '7.5' },
      notes:
        'Modern minimalist with an editorial streak. Sharp suiting for UN and climate panels; saturated column dresses for press. Loves a clean line, a strong shoulder, and jewel tones — emerald, oxblood, cobalt.',
      looksCount: 7,
      lastUpdated: '5 days ago',
      accent: '#B59B7C',
    },
  ],

  // Garments catalog — mix of flat-lay and on-model, varied brands/prices
  garments: [
    {
      id: 'g1',
      name: 'Aiko Silk Slip Dress',
      brand: 'Reformation',
      category: 'one-piece',
      retailPrice: 298,
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop',
      phia: { lowest: 142, source: 'Vestiaire Collective', condition: 'like-new', savings: 52 },
    },
    {
      id: 'g2',
      name: 'The Way-High Jean',
      brand: 'Agolde',
      category: 'bottom',
      retailPrice: 228,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=800&fit=crop',
      phia: { lowest: 89, source: 'Poshmark', condition: 'good', savings: 61 },
    },
    {
      id: 'g3',
      name: 'Ines Leather Jacket',
      brand: 'Acne Studios',
      category: 'outerwear',
      retailPrice: 1800,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=800&fit=crop',
      phia: { lowest: 620, source: 'The RealReal', condition: 'like-new', savings: 66 },
    },
    {
      id: 'g4',
      name: 'Cashmere Crewneck',
      brand: 'Toteme',
      category: 'top',
      retailPrice: 495,
      imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop',
      phia: { lowest: 178, source: 'ThredUp Luxe', condition: 'like-new', savings: 64 },
    },
    {
      id: 'g5',
      name: 'Western Boot in Tobacco',
      brand: 'R13',
      category: 'shoes',
      retailPrice: 890,
      imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&h=800&fit=crop',
      phia: { lowest: 340, source: 'Grailed', condition: 'good', savings: 62 },
    },
    {
      id: 'g6',
      name: 'Oversized Oxford Shirt',
      brand: 'The Frankie Shop',
      category: 'top',
      retailPrice: 195,
      imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&h=800&fit=crop',
      phia: { lowest: 62, source: 'Depop', condition: 'good', savings: 68 },
    },
    {
      id: 'g7',
      name: 'Wide-Leg Trouser',
      brand: 'Khaite',
      category: 'bottom',
      retailPrice: 780,
      imageUrl: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=600&h=800&fit=crop',
      phia: { lowest: 245, source: 'Vestiaire Collective', condition: 'like-new', savings: 69 },
    },
    {
      id: 'g8',
      name: 'Silk Scarf, Hand-Rolled',
      brand: 'Lemaire',
      category: 'accessory',
      retailPrice: 340,
      imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&h=800&fit=crop',
      phia: { lowest: 118, source: 'Vestiaire Collective', condition: 'new', savings: 65 },
    },
    {
      id: 'g9',
      name: 'Knit Bralette',
      brand: 'Éterne',
      category: 'top',
      retailPrice: 128,
      imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&h=800&fit=crop',
      phia: { lowest: 48, source: 'Poshmark', condition: 'new', savings: 63 },
    },
    {
      id: 'g10',
      name: 'Slouchy Hobo Bag',
      brand: 'The Row',
      category: 'accessory',
      retailPrice: 1490,
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop',
      phia: { lowest: 580, source: 'The RealReal', condition: 'like-new', savings: 61 },
    },
    {
      id: 'g11',
      name: 'Cowboy-Cut Denim Jacket',
      brand: 'Wrangler',
      category: 'outerwear',
      retailPrice: 118,
      imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&h=800&fit=crop',
      phia: { lowest: 42, source: 'eBay', condition: 'good', savings: 64 },
    },
    {
      id: 'g12',
      name: 'Satin Slip Skirt',
      brand: 'Sablyn',
      category: 'bottom',
      retailPrice: 395,
      imageUrl: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=600&h=800&fit=crop',
      phia: { lowest: 145, source: 'The RealReal', condition: 'like-new', savings: 63 },
    },
    {
      id: 'g13',
      name: 'Suede Mule',
      brand: 'Staud',
      category: 'shoes',
      retailPrice: 345,
      imageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600&h=800&fit=crop',
      phia: { lowest: 118, source: 'Poshmark', condition: 'like-new', savings: 66 },
    },
    {
      id: 'g14',
      name: 'Linen Button-Up',
      brand: 'COS',
      category: 'top',
      retailPrice: 125,
      imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=800&fit=crop',
      phia: { lowest: 38, source: 'Depop', condition: 'good', savings: 70 },
    },
    {
      id: 'g15',
      name: 'Gold Hoop, Medium',
      brand: 'Mejuri',
      category: 'accessory',
      retailPrice: 168,
      imageUrl: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop',
      phia: { lowest: 72, source: 'Poshmark', condition: 'new', savings: 57 },
    },
    {
      id: 'g16',
      name: 'Verdant Silk Slip Dress',
      brand: 'Cecilie Bahnsen',
      category: 'one-piece',
      retailPrice: 385,
      imageUrl: '/garments/green-dress.jpg',
      phia: { lowest: 168, source: 'Vestiaire Collective', condition: 'like-new', savings: 56 },
    },
  ],

  // Pre-built looks for the demo.
  // Note: `clientId` is added here (the mockup references it at runtime but
  // didn't set it on the source objects in data.js). See the FIX note in T1.
  looks: {
    sarah: [
      {
        id: 'look-sarah-1',
        clientId: 'sarah',
        occasion: 'Rooftop engagement party',
        location: 'DUMBO, next Saturday',
        createdAt: '2 days ago',
        status: 'ready',
        garmentIds: ['g1', 'g3', 'g13', 'g15', 'g8'],
        tryOnImageUrl:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&h=1200&fit=crop',
        coverUrl:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&h=800&fit=crop',
      },
      {
        id: 'look-sarah-2',
        clientId: 'sarah',
        occasion: 'Monday editorial shoot',
        location: 'Soho studio',
        createdAt: '1 week ago',
        status: 'shared',
        garmentIds: ['g6', 'g7', 'g10', 'g13'],
        coverUrl:
          'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&h=800&fit=crop',
      },
      {
        id: 'look-sarah-3',
        clientId: 'sarah',
        occasion: 'Weekend in Hudson',
        location: 'Upstate, late April',
        createdAt: '2 weeks ago',
        status: 'shared',
        garmentIds: ['g4', 'g2', 'g5', 'g11'],
        coverUrl:
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=800&fit=crop',
      },
      {
        id: 'look-sarah-4',
        clientId: 'sarah',
        occasion: 'Thursday client dinner',
        location: 'Estela, NoHo',
        createdAt: '3 weeks ago',
        status: 'draft',
        garmentIds: ['g12', 'g9', 'g13'],
        coverUrl:
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop',
      },
    ],
    maya: [
      {
        id: 'look-maya-1',
        clientId: 'maya',
        occasion: 'Desert weekend, Joshua Tree',
        createdAt: '5 days ago',
        status: 'shared',
        garmentIds: ['g11', 'g2', 'g5', 'g14'],
        coverUrl:
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=800&fit=crop',
      },
      {
        id: 'look-maya-2',
        clientId: 'maya',
        occasion: 'Gallery opening, Culver City',
        createdAt: '2 weeks ago',
        status: 'shared',
        garmentIds: ['g3', 'g7', 'g10'],
        coverUrl:
          'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop',
      },
    ],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getGarment(id: string): Garment | undefined {
  return MOCK.garments.find((g) => g.id === id);
}

export function getLook(id: string): Look | null {
  for (const arr of Object.values(MOCK.looks)) {
    const l = arr.find((x) => x.id === id);
    if (l) return l;
  }
  return null;
}

export function getClient(id: string): Client | undefined {
  return MOCK.clients.find((c) => c.id === id);
}

export function getLooksFor(clientId: string): Look[] {
  return MOCK.looks[clientId] || [];
}

// Extra phia sources per garment for the Item Detail / Swap panel
export function phiaSources(garment: Garment): PhiaSourceRow[] {
  const base = garment.phia.lowest;
  const retail = garment.retailPrice;
  return [
    {
      source: garment.phia.source,
      price: base,
      condition: garment.phia.condition,
      size: 'S',
      ships: '2-day',
      seller: 'Verified',
      best: true,
    },
    {
      source: 'Poshmark',
      price: Math.round(base * 1.12),
      condition: 'like-new',
      size: 'S',
      ships: '4-day',
      seller: '@curated.closet',
    },
    {
      source: 'The RealReal',
      price: Math.round(base * 1.24),
      condition: 'new',
      size: 'XS/S',
      ships: '3-day',
      seller: 'Consigned',
    },
    {
      source: 'Vestiaire',
      price: Math.round(base * 1.36),
      condition: 'like-new',
      size: 'S',
      ships: '7-day',
      seller: 'Paris',
    },
    {
      source: 'eBay',
      price: Math.round(base * 1.48),
      condition: 'good',
      size: 'S',
      ships: '5-day',
      seller: '@resale.rack',
    },
    {
      source: 'Retail (full price)',
      price: retail,
      condition: 'new',
      size: 'S',
      ships: '2-day',
      seller: 'Brand.com',
      retail: true,
    },
  ];
}

// Version history — who edited the look and when
export function lookHistory(_lookId: string): LookHistoryEntry[] {
  return [
    { at: '2d ago', actor: 'Jess', kind: 'share', label: 'Shared with Sarah' },
    { at: '2d ago', actor: 'Jess', kind: 'edit', label: 'Added Lemaire scarf' },
    { at: '3d ago', actor: 'Sarah', kind: 'note', label: 'Asked for a slingback instead of the mule' },
    { at: '3d ago', actor: 'Jess', kind: 'swap', label: 'Swapped Reformation Juliette → Aiko slip' },
    { at: '3d ago', actor: 'Jess', kind: 'create', label: 'Started the board' },
  ];
}

// Alternative garments for swap suggestions, by category
export function swapsFor(garment: Garment): Garment[] {
  return MOCK.garments
    .filter((g) => g.id !== garment.id && g.category === garment.category)
    .slice(0, 4);
}

export function lookTotals(look: Look): LookTotals {
  const garments = look.garmentIds
    .map((id) => getGarment(id))
    .filter((g): g is Garment => Boolean(g));
  const retail = garments.reduce((s, g) => s + g.retailPrice, 0);
  const phia = garments.reduce((s, g) => s + g.phia.lowest, 0);
  return {
    retail,
    phia,
    savings: retail - phia,
    savingsPct: retail > 0 ? Math.round(((retail - phia) / retail) * 100) : 0,
    garments,
  };
}
