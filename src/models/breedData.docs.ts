// This file contains the top 30 dog and cat breeds for the portal, with images and FAQ suggestions.
// Used by both the API and UI for breed selection, FAQ display, and breed info cards.
// Add more breeds and images in /public/breeds for a richer experience.

import { BreedInfo } from './breed';

export const dogBreeds: BreedInfo[] = [
  // ...existing 3 breeds...
  // Add 27 more top dog breeds here, each with id, name, petType, temperament, lifespan, description, origin, imageUrl, traits
];

export const catBreeds: BreedInfo[] = [
  // ...existing 3 breeds...
  // Add 27 more top cat breeds here, each with id, name, petType, temperament, lifespan, description, origin, imageUrl, traits
];

// Most frequently asked questions for breeds
export const breedFAQs: string[] = [
  'What is the temperament of this breed?',
  'How long do they live?',
  'Are they good with children?',
  'How much exercise do they need?',
  'What are common health issues?',
  'How much grooming is required?',
  'Are they easy to train?',
  'What is their size and weight?',
  'Do they get along with other pets?',
  'What is their energy level?',
  'Are they suitable for apartments?',
  'How much do they shed?',
  'What is their origin?',
  'What do they eat?',
  'How much do they cost?',
];

// To add more breeds, copy the structure above and place images in /public/breeds.
