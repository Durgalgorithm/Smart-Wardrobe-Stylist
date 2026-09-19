
export enum Category {
  TOPS = 'Tops',
  BOTTOMS = 'Bottoms',
  SHOES = 'Shoes',
  ACCESSORIES = 'Accessories',
  OUTERWEAR = 'Outerwear'
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  isSelected: boolean;
}

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface SavedOutfit {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: number;
}

export interface AvatarState {
  imageUrl: string;
  name: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
