
"use client";
import { useState, useEffect } from "react";
import Fuse from "fuse.js";

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
}

export default function Home() {
  const [breeds, setBreeds] = useState<BreedInfo[]>([]);
  const [breedFAQs, setBreedFAQs] = useState<string[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [typedBreed, setTypedBreed] = useState<string>("");
  const [petType, setPetType] = useState<PetType>("dog");
  const [question, setQuestion] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestedBreed, setSuggestedBreed] = useState<string>("");

  useEffect(() => {
    fetch("/api/chatbot")
      .then((res) => res.json())
      .then((data) => {
        setBreeds(data.breeds || []);
        setBreedFAQs(data.breedFAQs || []);
      });
  }, []);

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
    setLoading(false);
  };

  return (
    <div className="min-h-screen font-sans flex flex-col items-center py-10" style={{ background: 'var(--background)' }}>
      <h1 className="text-5xl font-extrabold mb-6" style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
        🐾 Pet Breed Info Portal
      </h1>
      <div className="mb-8 flex gap-4">
        <button
          className={`px-6 py-2 rounded-xl shadow transition-all duration-200 text-lg font-semibold ${petType === "dog" ? "bg-primary text-white scale-105" : "bg-accent text-text hover:scale-105"}`}
          style={petType === "dog" ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--accent)', color: 'var(--text)' }}
          onClick={() => setPetType("dog")}
        >
          🐶 Dogs
        </button>
        <button
          className={`px-6 py-2 rounded-xl shadow transition-all duration-200 text-lg font-semibold ${petType === "cat" ? "bg-primary text-white scale-105" : "bg-accent text-text hover:scale-105"}`}
          style={petType === "cat" ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--accent)', color: 'var(--text)' }}
          onClick={() => setPetType("cat")}
        >
          🐱 Cats
        </button>
      </div>
      <div className="mb-6 w-full max-w-xl card">
        <label className="block mb-2 text-lg font-semibold" style={{ color: 'var(--primary)' }}>Select or Type Breed:</label>
        <select
          className="w-full p-3 rounded-xl border border-primary text-lg mb-2"
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
          <option value="">-- Choose a breed --</option>
          {breeds.filter(b => b.petType === petType).sort((a, b) => a.name.localeCompare(b.name)).map(breed => (
            <option key={breed.id} value={breed.id}>{breed.name}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {selectedBreed === "other" && (
          <>
            <input
              className="w-full p-3 rounded-xl border border-primary mb-1 text-lg"
              type="text"
              value={typedBreed}
              onChange={e => setTypedBreed(e.target.value)}
              placeholder="Type your breed name..."
              autoComplete="on"
            />
            {typedBreed && suggestedBreed && suggestedBreed.toLowerCase() !== typedBreed.toLowerCase() && (
              <div className="text-sm text-orange-700 mt-1 flex items-center gap-2">
                Did you mean: <span className="font-semibold">{suggestedBreed}</span>?
                <button
                  type="button"
                  className="ml-2 px-2 py-1 rounded bg-orange-200 hover:bg-orange-300 text-orange-900 text-xs"
                  onClick={() => setTypedBreed(suggestedBreed)}
                >
                  Use this
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mb-6 w-full max-w-xl card">
        <label className="block mb-2 text-lg font-semibold" style={{ color: 'var(--primary)' }}>Ask a question about this breed:</label>
        <select
          className="w-full p-3 rounded-xl border border-primary mb-2 text-lg"
          value={question}
          onChange={e => setQuestion(e.target.value)}
        >
          <option value="">-- Select a question --</option>
          {breedFAQs.map((faq, idx) => (
            <option key={idx} value={faq}>{faq}</option>
          ))}
          <option value="other">Other</option>
        </select>
        {question === "other" && (
          <input
            className="w-full p-3 rounded-xl border border-primary mb-2 text-lg"
            type="text"
            value={customQuestion || ""}
            onChange={e => setCustomQuestion(e.target.value)}
            placeholder="Type your question about this breed..."
          />
        )}
        <button
          className="px-6 py-2 rounded-xl font-semibold shadow transition-all duration-200"
          style={{ background: 'var(--primary)', color: '#fff' }}
          onClick={handleAsk}
          disabled={loading || !question || (!selectedBreed && !typedBreed)}
        >
          {loading ? "Asking..." : "Ask"}
        </button>
        <div className="text-xs text-red-600 mt-2">
          Note: Answers are AI-generated by <strong>OpenAI GPT-3.5-turbo</strong> via <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a> and may not be accurate. For informational purposes only.
        </div>
      </div>
      {answer && (
        <div className="w-full max-w-xl card" style={{ background: 'var(--accent)', color: 'var(--text)' }}>
          <strong>Answer:</strong> {answer}
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
                <div className="mt-4">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--primary)' }}>{breed.name}</h3>
                  <p><strong>Temperament:</strong> {breed.temperament}</p>
                  <p><strong>Lifespan:</strong> {breed.lifespan}</p>
                  <p><strong>Description:</strong> {breed.description}</p>
                  {breed.origin && <p><strong>Origin:</strong> {breed.origin}</p>}
                  {breed.traits && <p><strong>Traits:</strong> {breed.traits.join(", ")}</p>}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}
