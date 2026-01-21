
"use client";
import { useState, useEffect } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type PetType = "dog" | "cat";
interface BreedInfo {
  id: string;
  name: string;
  petType: PetType;
  temperament: string;
  lifespan: string;
  description: string;
  origin?: string;
  imageUrl?: string;
  traits?: string[];
// ...existing code...
}

export default function Home() {
  const t = useTranslations();
  const [breeds, setBreeds] = useState<BreedInfo[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [typedBreed, setTypedBreed] = useState<string>("");
  const [petType, setPetType] = useState<PetType>("dog");
  const [question, setQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [llmProvider, setLlmProvider] = useState<string>("");
  const [responseTime, setResponseTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [suggestedBreed, setSuggestedBreed] = useState<string>("");
  const [breedImage, setBreedImage] = useState<string>("");

  // Translated questions from i18n - recreated on every render to update with language changes
  const breedFAQs = [
    t('questions.temperament'),
    t('questions.care'),
    t('questions.health'),
    t('questions.exercise'),
    t('questions.training'),
    t('questions.family'),
    t('questions.size'),
    t('questions.lifespan'),
    t('questions.grooming'),
    t('questions.living'),
  ];

  useEffect(() => {
    fetch("/api/chatbot")
      .then((res) => res.json())
      .then((data) => {
        setBreeds(data.breeds || []);
      });
  }, []);

  // Dynamic breed image fetch logic using new API route
  useEffect(() => {
    async function fetchBreedImage() {
      let breed: BreedInfo | undefined = undefined;
      let customBreedName: string | undefined = undefined;
      
      // First, try to find breed in database
      if (selectedBreed && selectedBreed !== 'other') {
        breed = breeds.find(b => b.id === selectedBreed);
      } else if (typedBreed && suggestedBreed) {
        breed = breeds.find(b => b.name === suggestedBreed);
      } else if (selectedBreed === 'other' && typedBreed) {
        // User typed a custom breed name - use it directly with current petType
        customBreedName = typedBreed;
      }
      
      // Clear image if no breed specified
      if (!breed && !customBreedName) {
        setBreedImage("");
        return;
      }
      
      // Use new API route for breed image fetching and caching
      try {
        const params = new URLSearchParams({
          breedId: breed?.id || 'custom',
          petType: breed?.petType || petType,
          breedName: breed?.name || customBreedName || '',
        });
        const res = await fetch(`/api/breed-image?${params.toString()}`);
        const data = await res.json();
        if (data && data.imageUrl) {
          setBreedImage(data.imageUrl);
        } else {
          setBreedImage(petType === "dog" ? "/breeds/placeholder_dog.jpg" : "/breeds/placeholder_cat.jpg");
        }
      } catch {
        setBreedImage(petType === "dog" ? "/breeds/placeholder_dog.jpg" : "/breeds/placeholder_cat.jpg");
      }
    }
    fetchBreedImage();
  }, [selectedBreed, typedBreed, suggestedBreed, breeds, petType]);

  // Fuzzy search for breed name correction and prefill
  useEffect(() => {
    if (typedBreed && breeds.length > 0) {
      const fuse = new Fuse(breeds.filter(b => b.petType === petType), { keys: ["name"], threshold: 0.3 });
      const result = fuse.search(typedBreed);
      setSuggestedBreed(result.length > 0 ? result[0].item.name : "");
    } else {
      setSuggestedBreed("");
    }
  }, [typedBreed, petType, breeds]);

  const handleAsk = async () => {
    setLoading(true);
    setAnswer(null);
    setLlmProvider("");
    setResponseTime(0);
    const finalQuestion = question === "other" ? customQuestion : question;
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: finalQuestion,
        breedId: selectedBreed,
        petType,
        breedName: typedBreed || undefined,
      }),
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLlmProvider(data.metadata?.provider || "Unknown");
    setResponseTime(data.metadata?.latencyMs || 0);
    setLoading(false);
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center py-10 relative overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe6f7 100%)' }}>
      {/* Decorative dog and cat images for visual appeal */}
      <Image src="/breeds/labrador.jpg" alt="Labrador" width={180} height={180} className="absolute left-0 top-0 opacity-20 rounded-full blur-lg z-0" />
      <Image src="/breeds/mainecoon.jpg" alt="Maine Coon" width={140} height={140} className="absolute right-0 top-20 opacity-20 rounded-full blur-lg z-0" />
      <Image src="/breeds/goldenretriever.jpg" alt="Golden Retriever" width={120} height={120} className="absolute left-10 bottom-10 opacity-10 rounded-full blur-lg z-0" />
      <Image src="/breeds/siamese.jpg" alt="Siamese" width={100} height={100} className="absolute right-10 bottom-0 opacity-10 rounded-full blur-lg z-0" />

      <div className="relative z-10 w-full max-w-6xl px-4">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-center text-orange-700 drop-shadow-lg" style={{ fontFamily: 'var(--font-display)' }}>
          🐾 {t('app.title')}
        </h1>
        <p className="text-base sm:text-lg text-orange-900 mb-6 text-center">{t('app.description')}</p>
        <div className="mb-6 flex gap-4 justify-center">
          <button
            className={`min-h-touch min-w-touch px-6 py-2 rounded-full shadow transition-all duration-200 text-base sm:text-lg font-semibold ${petType === "dog" ? "bg-orange-400 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
            onClick={() => setPetType("dog")}
          >
            {t('petType.dog')}
          </button>
          <button
            className={`min-h-touch min-w-touch px-6 py-2 rounded-full shadow transition-all duration-200 text-base sm:text-lg font-semibold ${petType === "cat" ? "bg-pink-400 text-white" : "bg-pink-100 text-pink-700 hover:bg-pink-200"}`}
            onClick={() => setPetType("cat")}
          >
            {t('petType.cat')}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="card">
          <label className="block mb-3 sm:mb-2 text-base sm:text-lg font-semibold" style={{ color: 'var(--primary)' }}>
            {t('breed.label')}:
            <span className="block sm:inline text-xs sm:text-sm font-normal text-gray-600 sm:ml-2 mt-1 sm:mt-0">{t('breed.helperText')}</span>
          </label>
          <select
            className="w-full min-h-touch p-3 sm:p-3 rounded-xl border border-primary text-base sm:text-lg mb-2"
            style={{ maxHeight: '300px' }}
            value={selectedBreed}
            onChange={e => {
              setSelectedBreed(e.target.value);
              if (e.target.value === "other") {
                setTypedBreed("");
              } else {
                setTypedBreed("");
              }
            }}
          >
            <option value="">{t('breed.placeholder')}</option>
            {breeds.filter(b => b.petType === petType).sort((a, b) => a.name.localeCompare(b.name)).map(breed => (
              <option key={breed.id} value={breed.id}>{t(`breeds.${breed.id}`)}</option>
            ))}
            <option value="other">✏️ {t('breed.other')}</option>
          </select>
          {selectedBreed === "other" && (
            <>
              <input
                className="w-full min-h-touch p-3 sm:p-3 rounded-xl border border-primary mb-1 text-base sm:text-lg focus:ring-2 focus:ring-orange-400"
                type="text"
                value={typedBreed}
                onChange={e => setTypedBreed(e.target.value)}
                placeholder={t('breed.customPlaceholder')}
                autoComplete="off"
                autoFocus
              />
              {typedBreed && suggestedBreed && suggestedBreed.toLowerCase() !== typedBreed.toLowerCase() && (
                <div className="text-xs sm:text-sm text-orange-700 mt-2 p-3 sm:p-2 bg-orange-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div>💡 {t('suggestions.title')} <span className="font-semibold">{suggestedBreed}</span>?</div>
                  <button
                    type="button"
                    className="min-h-touch min-w-touch w-full sm:w-auto sm:ml-auto px-3 py-2 rounded-lg bg-orange-400 hover:bg-orange-500 active:bg-orange-600 text-white text-sm font-semibold transition-colors"
                    onClick={() => setTypedBreed(suggestedBreed)}
                  >
                    {t('suggestions.useThis')}
                  </button>
                </div>
              )}
              {typedBreed && !suggestedBreed && (
                <div className="text-xs sm:text-sm text-gray-600 mt-2 p-3 sm:p-2 bg-gray-50 rounded-lg">
                  ℹ️ No exact match found. The AI will do its best to answer about "{typedBreed}".
                </div>
              )}
            </>
          )}
        </div>
        <div className="card">
          <label className="block mb-3 sm:mb-2 text-base sm:text-lg font-semibold" style={{ color: 'var(--primary)' }}>
            {t('question.label')}:
            <span className="block sm:inline text-xs sm:text-sm font-normal text-gray-600 sm:ml-2 mt-1 sm:mt-0">{t('question.helperText')}</span>
          </label>
          <select
            className="w-full min-h-touch p-3 sm:p-3 rounded-xl border border-primary mb-2 text-base sm:text-lg"
            style={{ maxHeight: '300px' }}
            value={question}
            onChange={e => setQuestion(e.target.value)}
          >
            <option value="">{t('question.placeholder')}</option>
            {breedFAQs.map((faq, idx) => (
              <option key={idx} value={faq}>{faq}</option>
            ))}
            <option value="other">✏️ {t('question.custom')}</option>
          </select>
          {question === "other" && (
            <input
              className="w-full min-h-touch p-3 sm:p-3 rounded-xl border border-primary mb-2 text-base sm:text-lg focus:ring-2 focus:ring-orange-400"
              type="text"
              value={customQuestion || ""}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder={t('question.customPlaceholder')}
              autoFocus
            />
          )}
          <button
            className="w-full sm:w-auto min-h-touch px-6 py-3 sm:py-2 rounded-xl text-base sm:text-lg font-semibold shadow transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ background: 'var(--primary)', color: '#fff' }}
            onClick={handleAsk}
            disabled={
              loading || 
              !question || 
              (question === "other" && !customQuestion?.trim()) ||
              (!selectedBreed && !typedBreed) ||
              (selectedBreed === "other" && !typedBreed?.trim())
            }
          >
            {loading ? t('actions.asking') : t('actions.ask')}
          </button>
          <div className="text-xs mt-3 sm:mt-2 flex items-start sm:items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1 sm:mt-0 flex-shrink-0"></span>
            <span className="text-gray-600 leading-relaxed">
              {t('app.disclaimer')}
            </span>
          </div>
        </div>
        </div>
        {answer && (
          <div className="card" style={{ background: 'var(--accent)', color: 'var(--text)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 font-semibold">
                    ✓ {llmProvider}
                  </span>
                  {responseTime > 0 && (
                    <span className="text-gray-600">
                      {responseTime}ms
                    </span>
                  )}
                </div>
                <div className="mb-4 text-sm sm:text-base leading-relaxed">
                  <strong>{t('answer.title')}:</strong> {answer}
                </div>
                {/* Show breed info for the selected breed only */}
                {(() => {
                  let breed: BreedInfo | undefined = undefined;
                  if (selectedBreed) {
                    breed = breeds.find(b => b.id === selectedBreed);
                  } else if (typedBreed && suggestedBreed) {
                    breed = breeds.find(b => b.name === suggestedBreed);
                  }
                  if (breed) {
                    return (
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--primary)' }}>{breed.name}</h3>
                        <p className="mb-2 text-sm sm:text-base"><strong>Temperament:</strong> {breed.temperament}</p>
                        <p className="mb-2 text-sm sm:text-base"><strong>Lifespan:</strong> {breed.lifespan}</p>
                        <p className="mb-2 text-sm sm:text-base"><strong>Description:</strong> {breed.description}</p>
                        {breed.origin && <p className="mb-2 text-sm sm:text-base"><strong>Origin:</strong> {breed.origin}</p>}
                        {breed.traits && <p className="mb-2 text-sm sm:text-base"><strong>Traits:</strong> {breed.traits.join(", ")}</p>}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-start justify-center lg:justify-end">
                {breedImage && (
                  <div className="w-full max-w-sm lg:max-w-none bg-gray-100 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden" style={{ maxHeight: '400px', minHeight: '250px' }}>
                    <img 
                      src={breedImage} 
                      alt="Breed" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
