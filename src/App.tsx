import React, { useState } from 'react';
// El import de "Announcer" ha sido eliminado porque no era la solución correcta.
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Wand2, Plus, X as CloseIcon } from 'lucide-react';
import { SigilBlock } from './SigilBlock';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY is not defined in .env file");
}
const genAI = new GoogleGenerativeAI(apiKey);

interface Position { x: number; y: number; }
interface Sigil { id: string; content: string; position: Position; }

function App() {
  const [sigils, setSigils] = useState<Sigil[]>([
    { id: 'sigil-1', content: 'A lone knight', position: { x: 50, y: 50 } },
    { id: 'sigil-2', content: 'in a dark forest', position: { x: 250, y: 150 } },
    { id: 'sigil-3', content: 'under a crimson moon', position: { x: 100, y: 300 } }
  ]);
  const [editingSigilId, setEditingSigilId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultText, setResultText] = useState(""); 
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (delta.x !== 0 || delta.y !== 0) {
      setSigils(prevSigils => 
        prevSigils.map(sigil => 
          sigil.id === active.id 
            ? { ...sigil, position: { x: sigil.position.x + delta.x, y: sigil.position.y + delta.y } }
            : sigil
        )
      );
    }
  };

  const handleAddNewSigil = () => {
    const newSigil: Sigil = {
      id: `sigil-${Date.now()}`,
      content: 'New instruction...',
      position: { x: 20, y: 20 }
    };
    setSigils(prevSigils => [...prevSigils, newSigil]);
  };

  const handleDeleteSigil = (idToDelete: string) => {
    setSigils(prevSigils => prevSigils.filter(sigil => sigil.id !== idToDelete));
  };
  
  const handleUpdateContent = (idToUpdate: string, newContent: string) => {
    setSigils(prevSigils => 
      prevSigils.map(sigil => 
        sigil.id === idToUpdate
          ? { ...sigil, content: newContent }
          : sigil
      )
    );
  };

  const handleCastSpell = async () => {
    setLoading(true);
    const sortedSigils = [...sigils].sort((a, b) => a.position.y - b.position.y);
    const basePrompt = sortedSigils.map(sigil => sigil.content).join(' ');
    const fullPrompt = `Describe, in a mystical and epic tone, the image that would be generated from the following concept: ${basePrompt}`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();
      setResultText(text);
      setShowResultModal(true);
    } catch (error) {
      console.error("Error calling API:", error);
      setResultText("The spell failed. The connection to the oracle was lost.");
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 flex flex-col items-center p-8 font-sans text-white">
      <header className="w-full max-w-5xl flex items-center justify-center mb-8 px-4 space-x-4"> 
        <div className="text-right">
          <p className="text-xl font-bold text-purple-400 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
            THIS IS
          </p>
          <p className="text-5xl font-extrabold text-purple-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]">
            SIGIL
          </p>
        </div> 
        <div className="flex-shrink-0">
          <img src="/sigil.png" alt="Sigil Logo" className="w-24 h-24" />
        </div> 
        <div className="text-left">
          <p className="text-lg text-gray-300 font-semibold">
            Build better prompts,
          </p>
          <p className="text-lg text-gray-300 font-semibold">
            visually.
          </p>
        </div>
      </header>

      <div className="w-full max-w-4xl h-[600px] bg-gray-900/30 border-2 border-gray-700 rounded-lg relative overflow-hidden">
        {/* --- SOLUCIÓN DEFINITIVA: Anuncios vacíos para silenciar el texto visual --- */}
        <DndContext 
          onDragEnd={handleDragEnd} 
          announcements={{
              onDragStart: () => {},
              onDragEnd: () => {},
              onDragCancel: () => {},
          }}
        >
          {sigils.map(sigil => (
            <div key={sigil.id} className="absolute" style={{ left: `${sigil.position.x}px`, top: `${sigil.position.y}px` }}>
              <SigilBlock 
                id={sigil.id} 
                content={sigil.content} 
                onDelete={handleDeleteSigil}
                editingId={editingSigilId}
                onSetEditing={setEditingSigilId}
                onUpdateContent={handleUpdateContent}
              />
            </div>
          ))}
        </DndContext>
        
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button onClick={handleAddNewSigil} className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110" title="Add New Sigil">
              <Plus size={24} />
            </button>
        </div>

        <button onClick={handleCastSpell} disabled={loading} className="absolute bottom-4 right-4 w-16 h-16 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-110 active:scale-95 group border-2 border-purple-400 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Cast Spell">
          {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <Wand2 size={24} className="group-hover:rotate-12 transition-transform duration-300" />}
        </button>
      </div>

      <div className="mt-8">
        <a href="#" onClick={(e) => { e.preventDefault(); setShowAboutModal(true); }} className="text-sm text-gray-400 hover:text-white underline transition-colors">
          What is Sigil?
        </a>
      </div>

      {/* --- AJUSTE: La insignia ahora es un enlace de texto simple --- */}
      <div className="absolute bottom-5 left-5">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Built with Bolt
        </a>
      </div>

      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-purple-500 rounded-lg shadow-2xl max-w-2xl w-full p-8 relative">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Spell Result</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{resultText}</p>
            <button onClick={() => setShowResultModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <CloseIcon size={24} />
            </button>
          </div>
        </div>
      )}
 
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg shadow-2xl max-w-2xl w-full p-8 relative">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">What is Sigil? The Architecture of Imagination.</h2>
            <div className="text-gray-300 leading-relaxed space-y-4">
              <p>In a world filled with AI, communication is the new art form. But expressing complex, nuanced ideas shouldn't be a guessing game. Sigil was born from a simple belief: the best way to talk to an AI is not with a long, confusing sentence, but with a clear, structured blueprint.</p>
              <p>Sigil is not just a prompt builder; it's a visual workspace for your thoughts. Here, you deconstruct your ideas into their core components—the "Sigils"—and compose them visually, understanding how each piece shapes the final outcome. The order, the combination, the very structure of your thoughts becomes the magic.</p>
              <div>
                <h3 className="font-semibold text-cyan-400 mb-2">The Potential is Limitless:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">For Writers & Storytellers:</span> Test different narrative structures or craft breathtaking poetry by reordering the flow of your ideas.</li>
                  <li><span className="font-semibold">For Marketers & Communicators:</span> Design and test marketing copy by swapping hooks, calls to action, and value propositions with ease.</li>
                  <li><span className="font-semibold">For Developers & Researchers:</span> Construct precise technical queries or generate code snippets step-by-step.</li>
                </ul>
              </div>
              <p className="font-bold text-center pt-4 text-lg">Deconstruct your thoughts. Compose your magic.</p>
            </div>
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <CloseIcon size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;