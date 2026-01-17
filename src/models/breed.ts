// Data model for pet breeds (dogs and cats)
export type PetType = 'dog' | 'cat';

export interface BreedInfo {
  id: string;
  name: string;
  petType: PetType;
  temperament: string;
  lifespan: string;
  description: string;
  origin?: string;
  imageUrl?: string;
  traits?: string[];
}

// Example: Add more fields as needed for future analytics
export interface UserQuestion {
  id: string;
  breedId?: string;
  petType: PetType;
  question: string;
  answer?: string;
  timestamp: string;
  answeredByAI: boolean;
}
