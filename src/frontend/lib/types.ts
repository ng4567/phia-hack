export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'one-piece'
  | 'outerwear'
  | 'shoes'
  | 'accessory';

export type PhotoType = 'flat-lay' | 'on-model';

export type Condition = 'new' | 'like-new' | 'good' | 'fair';

export type LookStatus = 'draft' | 'generating' | 'ready' | 'shared';

export type PhiaMatch = {
  lowestPrice: number;
  source: string;
  sourceUrl: string;
  condition: Condition;
  savingsPercent: number;
};

export type Garment = {
  id: string;
  name: string;
  brand: string;
  category: GarmentCategory;
  retailPrice: number;
  retailUrl: string;
  imageUrl: string;
  photoType: PhotoType;
  phiaMatch?: PhiaMatch;
};

export type Sizing = {
  top: string;
  bottom: string;
  shoe: string;
};

export type Look = {
  id: string;
  clientId: string;
  createdAt: string;
  occasion?: string;
  garments: Garment[];
  tryOnImageUrl?: string;
  status: LookStatus;
};

export type Client = {
  id: string;
  name: string;
  photoUrl: string;
  sizing: Sizing;
  notes: string;
  looks: Look[];
};

export type Stylist = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
};

export type SlotId = 'head' | 'top' | 'bottom' | 'feet' | 'accessory';
