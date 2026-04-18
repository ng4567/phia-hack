export type TryOnCategory = 'tops' | 'bottoms' | 'one-pieces' | 'auto';
export type TryOnMode = 'performance' | 'balanced' | 'quality';
export type GarmentPhotoType = 'auto' | 'model' | 'flat-lay';
export type OutputFormat = 'png' | 'jpeg';

export type TryOnInput = {
  modelImage: string;
  garmentImage: string;
  category?: TryOnCategory;
  mode?: TryOnMode;
  garmentPhotoType?: GarmentPhotoType;
  numSamples?: number;
  seed?: number;
  outputFormat?: OutputFormat;
};

export type TryOnResult = {
  imageUrl: string;
  allImageUrls: string[];
  requestId: string;
};

export type JobStatus =
  | { status: 'IN_QUEUE'; queuePosition?: number }
  | { status: 'IN_PROGRESS' }
  | { status: 'COMPLETED' }
  | { status: 'FAILED'; error?: string };
