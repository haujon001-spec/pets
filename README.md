# Pet Breed Info Portal

This project is a modern Next.js web portal dedicated to dog and cat breeds, featuring an AI-powered chatbot for interactive Q&A. It is designed for scalability and future mobile app extension.

## Features
- **Breed Information:** Comprehensive profiles for dog and cat breeds (temperament, lifespan, description, origin, traits).
- **AI Chatbot:** Users can ask questions about breeds and receive AI-generated answers.
- **User Question Capture:** All questions and answers are structured for future analytics and content expansion.
- **Modern UI:** Built with Next.js, TypeScript, Tailwind CSS, and App Router.

## Project Structure
- `src/models/breed.ts`: Data models for pet breeds and user questions. 
  - `BreedInfo`: Interface for breed details.
  - `UserQuestion`: Interface for capturing user questions and answers.
- `src/app/api/chatbot/route.ts`: API route for chatbot interactions.
  - Handles GET (breed info) and POST (chatbot Q&A) requests.
  - Simulates AI response and structures user question data for analytics.
- `src/app/page.tsx`: Main portal UI.
  - Displays breed info, allows breed selection, and provides chatbot interface.
  - Handles user input and displays AI answers.

## How to Test
1. Run the development server:
   ```bash
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.
3. Select a pet type (dog or cat), choose a breed, and ask questions using the chatbot interface.
4. View breed information and AI-generated answers.

## Comments & Code Documentation
- All major files include comments explaining their purpose and key logic.
- Data models and API logic are documented for clarity and future extension.

## Next Steps
- Implement persistent storage for user questions and analytics.
- Expand breed database and improve AI integration.
- Prepare for mobile app extension.

## Breed Data and FAQ

- The breed data is defined in `src/models/breedData.ts`.
- This file contains the top 30 dog and cat breeds, each with:
  - `id`, `name`, `petType`, `temperament`, `lifespan`, `description`, `origin`, `imageUrl`, `traits`.
- Breed images are stored in `/public/breeds/` and referenced by `imageUrl`.
- The `breedFAQs` array contains the most frequently asked questions, shown as quick-select buttons in the UI.
- The API and UI use this data for breed selection, FAQ display, and breed info cards.
- If a breed is not found, users can type a breed name and the system will suggest the closest match using fuzzy search (Fuse.js).

### Example Breed Entry
```ts
{
  id: 'labrador',
  name: 'Labrador Retriever',
  petType: 'dog',
  temperament: 'Gentle, Intelligent, Outgoing',
  lifespan: '10-12 years',
  description: 'Labradors are friendly, outgoing, and high-spirited companions.',
  origin: 'Canada',
  imageUrl: '/breeds/labrador.jpg',
  traits: ['Family-friendly', 'Active', 'Trainable'],
}
```

### FAQ Example
```ts
'What is the temperament of this breed?'
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## LLM Integration (OpenRouter.ai)

- The chatbot now uses OpenRouter.ai to provide real AI answers.
- The API key is read from the environment variable `OPENROUTER_API_KEY`.
- To use your own key, set it in your environment or in a `.env.local` file:
  ```env
  OPENROUTER_API_KEY=sk-...yourkey...
  ```
- The API route sends the user's question (and breed context) to OpenRouter's GPT-3.5-turbo model.
- The system prompt ensures answers are concise and accurate for pet breed information.
- If the API call fails, a helpful error message is returned.

---
