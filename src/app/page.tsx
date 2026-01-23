
"use client";
import { useState, useEffect } from "react";
import Fuse from "fuse.js";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import { useMessages } from 'next-intl';
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
  const messages = useMessages();
  const locale = useLocale();
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
  const [translatedBreedInfo, setTranslatedBreedInfo] = useState<{[key: string]: any}>({});
  const [lastFetchedBreed, setLastFetchedBreed] = useState<string>("");
  const [aiMetadata, setAiMetadata] = useState<{provider: string; generationTime: number} | null>(null);

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
    // Debounce: wait for user to stop typing before fetching
    const timeoutId = setTimeout(() => {
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
          setLastFetchedBreed("");
          return;
        }
        
        // Create unique key for this breed request
        const breedKey = `${breed?.id || 'custom'}-${breed?.name || customBreedName}-${breed?.petType || petType}`;
        
        // Prevent duplicate requests - only fetch if breed changed
        if (breedKey === lastFetchedBreed) {
          return;
        }
        
        setLastFetchedBreed(breedKey);
        
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
            // Capture AI generation metadata if available
            if (data.aiGenerated) {
              setAiMetadata({
                provider: data.aiProvider,
                generationTime: data.generationTime
              });
            } else {
              setAiMetadata(null);
            }
          } else {
            setBreedImage(petType === "dog" ? "/breeds/placeholder_dog.jpg" : "/breeds/placeholder_cat.jpg");
            setAiMetadata(null);
          }
        } catch {
          setBreedImage(petType === "dog" ? "/breeds/placeholder_dog.jpg" : "/breeds/placeholder_cat.jpg");
        }
      }
      fetchBreedImage();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [selectedBreed, typedBreed, suggestedBreed, breeds, petType, lastFetchedBreed]);

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

  // Auto-trigger translation when locale or breed changes
  useEffect(() => {
    if (!answer || locale === 'en') return; // Only translate if there's an answer displayed
    
    let breed: BreedInfo | undefined = undefined;
    if (selectedBreed) {
      breed = breeds.find(b => b.id === selectedBreed);
    } else if (typedBreed && suggestedBreed) {
      breed = breeds.find(b => b.name === suggestedBreed);
    }
    
    if (breed) {
      const cacheKey = `${breed.id}_${locale}`;
      if (!translatedBreedInfo[cacheKey]) {
        console.log(`🔄 Translation check: breed=${breed.id}, locale=${locale}, cached=false`);
        translateBreedInfo(breed, locale);
      }
    }
  }, [locale, selectedBreed, suggestedBreed, answer, breeds]); // Re-run when locale or breed changes

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

  // Function to translate breed info using LLM
  const translateBreedInfo = async (breed: BreedInfo, targetLocale: string) => {
    // Skip if English or already translated
    const cacheKey = `${breed.id}_${targetLocale}`;
    if (targetLocale === 'en' || translatedBreedInfo[cacheKey]) {
      return translatedBreedInfo[cacheKey] || breed;
    }

    // Language names for better LLM understanding
    const languageNames: {[key: string]: string} = {
      'es': 'Spanish', 
      'fr': 'French', 
      'de': 'German', 
      'zh': 'Chinese (Simplified)',
      'zh-tw': 'Chinese (Traditional)',
      'pt': 'Portuguese', 
      'ar': 'Arabic', 
      'ja': 'Japanese', 
      'ru': 'Russian', 
      'it': 'Italian',
      'vi': 'Vietnamese'
    };

    const targetLanguage = languageNames[targetLocale] || targetLocale;
    
    console.log(`🌐 Translating ${breed.name} to ${targetLanguage} (locale: ${targetLocale})`);
    
    try {
      const translationPrompt = `Translate ONLY the VALUES (not the keys) of the following pet breed information to ${targetLanguage}. 

CRITICAL: Keep all JSON keys in English ("temperament", "description", "origin", "traits"). Only translate the values.

Return ONLY a valid JSON object with English keys and translated values:

{
  "temperament": "${breed.temperament}",
  "description": "${breed.description}",
  "origin": "${breed.origin || ''}",
  "traits": "${breed.traits?.join(', ') || ''}"
}`;

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: translationPrompt,
          breedId: breed.id,
          petType: breed.petType
        })
      });

      const data = await res.json();
      const answer = data.answer;

      console.log(`📥 Translation response for ${breed.name} (${targetLanguage}):`, answer.substring(0, 100));

      // Parse JSON from LLM response
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const translated = JSON.parse(jsonMatch[0]);
        console.log(`✅ Translation parsed successfully for ${breed.name}`);
        setTranslatedBreedInfo(prev => {
          const updated = { ...prev, [cacheKey]: translated };
          console.log(`💾 Cached translation for ${cacheKey}`);
          return updated;
        });
        return translated;
      } else {
        console.warn(`⚠️  No JSON found in translation response for ${breed.name}`);
      }
    } catch (error) {
      console.error(`❌ Translation failed for ${breed.name} (${targetLanguage}):`, error);
    }

    return breed; // Fallback to original
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <span className="text-4xl sm:text-5xl lg:text-6xl">🐾</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
              {t('app.title')}
            </h1>
          </div>
          <p className="text-base sm:text-lg text-slate-600" style={{ fontFamily: 'var(--font-body)' }}>
            {t('app.description')}
          </p>
        </div>

        {/* Pet Type Selection */}
        <div className="card mb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setPetType("dog")}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background: petType === 'dog' ? 'linear-gradient(135deg, #0078D4 0%, #1E90FF 100%)' : 'white',
                color: petType === 'dog' ? 'white' : '#64748B',
                border: petType === 'dog' ? 'none' : '2px solid #E2E8F0',
              }}
            >
              <span className="text-xl sm:text-2xl">🐕</span>
              <span className="text-sm sm:text-base">{t('petType.dog')}</span>
            </button>
            <button
              type="button"
              onClick={() => setPetType("cat")}
              className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background: petType === 'cat' ? 'linear-gradient(135deg, #0078D4 0%, #1E90FF 100%)' : 'white',
                color: petType === 'cat' ? 'white' : '#64748B',
                border: petType === 'cat' ? 'none' : '2px solid #E2E8F0',
              }}
            >
              <span className="text-xl sm:text-2xl">🐈</span>
              <span className="text-sm sm:text-base">{t('petType.cat')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="card">
          <label className="block mb-3 sm:mb-2 text-base sm:text-lg font-semibold text-blue-600">
            {t('breed.label')}:
            <span className="block sm:inline text-xs sm:text-sm font-normal text-slate-600 sm:ml-2 mt-1 sm:mt-0">{t('breed.helperText')}</span>
          </label>
          <select
            className="w-full min-h-touch p-3 sm:p-3 rounded-xl border-2 border-blue-200 text-base sm:text-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="w-full min-h-touch p-3 sm:p-3 rounded-xl border-2 border-blue-200 mb-1 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                type="text"
                value={typedBreed}
                onChange={e => setTypedBreed(e.target.value)}
                placeholder={t('breed.customPlaceholder')}
                autoComplete="off"
                autoFocus
              />
              {typedBreed && suggestedBreed && suggestedBreed.toLowerCase() !== typedBreed.toLowerCase() && (
                <div className="text-xs sm:text-sm text-blue-700 mt-2 p-3 sm:p-2 bg-blue-50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 border border-blue-200">
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
          <label className="block mb-3 sm:mb-2 text-base sm:text-lg font-semibold text-blue-600">
            {t('question.label')}:
            <span className="block sm:inline text-xs sm:text-sm font-normal text-slate-600 sm:ml-2 mt-1 sm:mt-0">{t('question.helperText')}</span>
          </label>
          <select
            className="w-full min-h-touch p-3 sm:p-3 rounded-xl border-2 border-blue-200 mb-2 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
              className="w-full min-h-touch p-3 sm:p-3 rounded-xl border-2 border-blue-200 mb-2 text-base sm:text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              type="text"
              value={customQuestion || ""}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder={t('question.customPlaceholder')}
              autoFocus
            />
          )}
          <button
            className="w-full sm:w-auto min-h-touch px-6 py-3 sm:py-2 rounded-xl text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
            style={{ 
              background: loading || !question || (question === "other" && !customQuestion?.trim()) || (selectedBreed === "other" && !typedBreed.trim()) ? '#D1D5DB' : 'linear-gradient(135deg, #0078D4 0%, #1E90FF 100%)',
              color: '#fff' 
            }}
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
            <span className="text-slate-600 leading-relaxed">
              {t('app.disclaimer')}
            </span>
          </div>
        </div>
        </div>
        {answer && (
          <div className="card" style={{ background: 'linear-gradient(135deg, #0078D4 0%, #1E90FF 100%)', color: '#FFFFFF' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="inline-block px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/30">
                    ✓ {llmProvider}
                  </span>
                  {responseTime > 0 && (
                    <span className="text-white/90">
                      {responseTime}ms
                    </span>
                  )}
                </div>
                <div className="mb-4 text-sm sm:text-base leading-relaxed text-white">
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
                    // Get cached translation (translation is triggered by useEffect)
                    const cacheKey = `${breed.id}_${locale}`;
                    const translated = translatedBreedInfo[cacheKey];
                    
                    const temperament = translated?.temperament || breed.temperament;
                    const description = translated?.description || breed.description;
                    const origin = translated?.origin || breed.origin || '';
                    const traits = translated?.traits || breed.traits?.join(", ") || '';
                    
                    // Translate "years" in lifespan
                    let lifespan = breed.lifespan;
                    const breedDetails = messages.breedDetails as any;
                    if (breedDetails && breedDetails.years) {
                      lifespan = breed.lifespan.replace(/years?/gi, breedDetails.years);
                    }
                    
                    return (
                      <div className="text-white">
                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">{breed.name}</h3>
                        <p className="mb-2 text-sm sm:text-base"><strong>{t('breedInfo.temperament')}:</strong> {temperament}</p>
                        <p className="mb-2 text-sm sm:text-base"><strong>{t('breedInfo.lifespan')}:</strong> {lifespan}</p>
                        <p className="mb-2 text-sm sm:text-base"><strong>{t('breedInfo.description')}:</strong> {description}</p>
                        {breed.origin && <p className="mb-2 text-sm sm:text-base"><strong>{t('breedInfo.origin')}:</strong> {origin}</p>}
                        {breed.traits && <p className="mb-2 text-sm sm:text-base"><strong>{t('breedInfo.traits')}:</strong> {traits}</p>}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-start justify-center lg:justify-end">
                {breedImage && (
                  <div className="w-full max-w-sm lg:max-w-none">
                    <div className="bg-gray-100 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden" style={{ maxHeight: '400px', minHeight: '250px' }}>
                      <img 
                        src={breedImage} 
                        alt="Breed" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    {/* Display AI generation metadata */}
                    {aiMetadata && (
                      <div className="mt-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="text-base">🎨</span>
                          <div>
                            <div className="font-semibold text-white">AI Generated</div>
                            <div className="text-white/80">{aiMetadata.provider}</div>
                            <div className="text-white/70">{(aiMetadata.generationTime / 1000).toFixed(1)}s generation time</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
