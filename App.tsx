
import React, { useState, useEffect, useRef } from 'react';
import { Category, WardrobeItem, AvatarState, SavedOutfit, ColorPalette } from './types';
import WardrobeGrid from './components/WardrobeGrid';
import AvatarCanvas from './components/AvatarCanvas';
import VoiceAssistant from './components/VoiceAssistant';
import AvatarCreator from './components/AvatarCreator';
import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_AVATAR = "https://picsum.photos/seed/fashion_avatar/800/1200";

const App: React.FC = () => {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [avatar, setAvatar] = useState<AvatarState>({
    imageUrl: DEFAULT_AVATAR,
    name: "My Stylist Profile"
  });
  const [activeCategory, setActiveCategory] = useState<Category>(Category.TOPS);
  const [outfitNameInput, setOutfitNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [isRenderingFit, setIsRenderingFit] = useState(false);
  const [aiRenderedImage, setAiRenderedImage] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from local storage
  useEffect(() => {
    const savedWardrobe = localStorage.getItem('my_wardrobe');
    if (savedWardrobe) setWardrobe(JSON.parse(savedWardrobe));
    
    const savedOutfits = localStorage.getItem('my_outfits');
    if (savedOutfits) setOutfits(JSON.parse(savedOutfits));

    const savedAvatar = localStorage.getItem('my_avatar_img');
    if (savedAvatar) setAvatar(prev => ({ ...prev, imageUrl: savedAvatar }));
  }, []);

  // Persistent storage hooks
  useEffect(() => { localStorage.setItem('my_wardrobe', JSON.stringify(wardrobe)); }, [wardrobe]);
  useEffect(() => { localStorage.setItem('my_outfits', JSON.stringify(outfits)); }, [outfits]);
  useEffect(() => { localStorage.setItem('my_avatar_img', avatar.imageUrl); }, [avatar.imageUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingUpload(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: "Extract this clothing or accessory item. Remove ALL backgrounds, hands, and mannequins. Return only the item on a pure white background." }
              ]
            }
          });

          const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          const finalUrl = imagePart 
            ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
            : event.target?.result as string;

          const newItem: WardrobeItem = {
            id: Date.now().toString(),
            name: file.name.split('.')[0].replace(/-/g, ' '),
            category: activeCategory,
            imageUrl: finalUrl,
            isSelected: false
          };
          setWardrobe(prev => [...prev, newItem]);
        } catch (err) {
          const newItem: WardrobeItem = { id: Date.now().toString(), name: file.name.split('.')[0], category: activeCategory, imageUrl: event.target?.result as string, isSelected: false };
          setWardrobe(prev => [...prev, newItem]);
        } finally {
          setIsProcessingUpload(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const magicFitRender = async () => {
    const selected = wardrobe.filter(i => i.isSelected);
    if (selected.length === 0) return;
    setIsRenderingFit(true);
    setAiRenderedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const avatarBase64 = avatar.imageUrl.split(',')[1];
      
      const parts: any[] = [
        { text: "REFERENCE_AVATAR_IDENTITY: This image defines the exact face, hair, and body of the person." },
        { inlineData: { data: avatarBase64, mimeType: "image/png" } }
      ];

      selected.forEach(item => {
        const itemData = item.imageUrl.split(',')[1];
        if (itemData) {
          parts.push({ text: `GARMENT_TO_WEAR: ${item.name} (${item.category})` });
          parts.push({ inlineData: { data: itemData, mimeType: "image/png" } });
        }
      });

      parts.push({ 
        text: `INSTRUCTION: Perform a photorealistic virtual try-on. 
        1. YOU MUST KEEP THE FACE, HAIR, AND BODY OF THE PERSON IN THE 'REFERENCE_AVATAR_IDENTITY' IMAGE 100% IDENTICAL. Do not morph the face.
        2. Replace the base clothing with the provided 'GARMENT_TO_WEAR' items. 
        3. Fit the clothes perfectly to the body silhouette. 
        4. Place accessories (hats, bags, jewelry) anatomically correct.
        5. Output a high-end fashion studio photograph. Ensure seamless blending and realistic shadows.`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imagePart) {
        setAiRenderedImage(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
      }
    } catch (err) {
      console.error("Try-on failed:", err);
    } finally {
      setIsRenderingFit(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    setWardrobe(prev => prev.map(item => {
      if (item.id === id) return { ...item, isSelected: !item.isSelected };
      return item;
    }));
    setAiRenderedImage(null);
  };

  const saveCurrentLook = () => {
    const selected = wardrobe.filter(i => i.isSelected);
    if (selected.length === 0) return;
    if (!outfitNameInput.trim()) { setIsSaving(true); return; }

    const newOutfit: SavedOutfit = {
      id: Date.now().toString(),
      name: outfitNameInput.trim(),
      itemIds: selected.map(i => i.id),
      createdAt: Date.now()
    };

    setOutfits(prev => [newOutfit, ...prev]);
    setOutfitNameInput('');
    setIsSaving(false);
  };

  const loadOutfit = (outfit: SavedOutfit) => {
    setWardrobe(prev => prev.map(item => ({
      ...item,
      isSelected: outfit.itemIds.includes(item.id)
    })));
    setAiRenderedImage(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden font-sans">
      {showAvatarCreator && (
        <AvatarCreator 
          onAvatarGenerated={(url) => setAvatar(p => ({ ...p, imageUrl: url }))}
          onClose={() => setShowAvatarCreator(false)}
        />
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-1/3 lg:w-1/4 p-6 border-r border-slate-200 bg-white flex flex-col h-screen shrink-0 overflow-hidden">
        <div className="mb-8 shrink-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic underline decoration-indigo-500 underline-offset-4">Wardrobe AI</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Digital Stylist v2.5</p>
        </div>

        <div className="mb-6 shrink-0">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category Select</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all uppercase ${
                  activeCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-[3] flex flex-col min-h-0 mb-4 overflow-hidden border-b border-slate-50">
             <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 py-1">
              <h2 className="font-black text-slate-800 text-xs uppercase tracking-tighter">{activeCategory}</h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
              >
                {isProcessingUpload ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <span className="text-[10px] font-black uppercase tracking-tighter">Add</span>}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
              <WardrobeGrid items={wardrobe.filter(i => i.category === activeCategory)} onToggle={toggleItemSelection} onRemove={(id) => setWardrobe(prev => prev.filter(i => i.id !== id))} />
            </div>
          </div>

          <div className="flex-[2] flex flex-col min-h-0 border-t border-slate-100 pt-4 overflow-hidden">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Saved Looks</label>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 pb-2">
              {outfits.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No looks yet.</p>
              ) : (
                outfits.map(outfit => (
                  <div key={outfit.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer" onClick={() => loadOutfit(outfit)}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-700 uppercase">{outfit.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{outfit.itemIds.length} ITEMS</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setOutfits(prev => prev.filter(o => o.id !== outfit.id)); }} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 shrink-0">
          <div className="flex gap-2">
            <button onClick={() => setShowAvatarCreator(true)} className="flex-1 py-3 px-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
              AI Creator
            </button>
            <button onClick={() => document.getElementById('avatar-upload')?.click()} className="py-3 px-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Upload</button>
          </div>
          <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const r = new FileReader();
              r.onload = (ev) => setAvatar(p => ({ ...p, imageUrl: ev.target?.result as string }));
              r.readAsDataURL(file);
            }
          }} />
        </div>
      </aside>

      {/* Main Fit Area */}
      <main className="flex-1 p-6 flex flex-col relative bg-slate-50 h-screen overflow-hidden">
        <header className="flex justify-between items-center mb-6 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 ring-4 ring-white">Virtual Mirror</div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Fitting Room</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={magicFitRender}
              disabled={wardrobe.filter(i => i.isSelected).length === 0 || isRenderingFit}
              className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl relative overflow-hidden ${
                wardrobe.filter(i => i.isSelected).length > 0 ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
              }`}
            >
              {isRenderingFit ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.487l1.735 3.036a1 1 0 01-.11 1.157L11.5 8.356V11a1 1 0 11-2 0V8.356L7.178 5.727a1 1 0 01-.11-1.157l1.735-3.036a1 1 0 01.897-.487h1.6zM6 11a1 1 0 11-2 0 1 1 0 012 0zm9-1a1 1 0 100 2 1 1 0 000-2zM4 14a1 1 0 100 2 1 1 0 000-2zm12 0a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
              )}
              {isRenderingFit ? 'Dressing...' : 'Generate Realistic Fit'}
              {wardrobe.filter(i => i.isSelected).length > 0 && !isRenderingFit && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>}
            </button>

            {isSaving ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                <input type="text" placeholder="Name look..." autoFocus className="px-4 py-2 text-sm border-2 border-indigo-500 rounded-xl focus:outline-none font-bold" value={outfitNameInput} onChange={(e) => setOutfitNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCurrentLook()} />
                <button onClick={saveCurrentLook} className="px-5 py-2 bg-indigo-600 text-white text-sm font-black rounded-xl hover:bg-indigo-700 shadow-xl transition-all">SAVE</button>
                <button onClick={() => setIsSaving(false)} className="px-3 py-2 bg-slate-200 text-slate-600 text-sm font-black rounded-xl hover:bg-slate-300">✕</button>
              </div>
            ) : (
              <button onClick={() => setIsSaving(true)} disabled={wardrobe.filter(i => i.isSelected).length === 0} className="px-6 py-3.5 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30">Favorite Look</button>
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center relative py-6 min-h-0">
          <div className="absolute w-[70%] h-[70%] bg-indigo-100/30 rounded-full blur-3xl opacity-50 animate-pulse pointer-events-none"></div>
          
          <div className="z-10 w-full max-w-lg transition-all duration-500 relative">
            {isRenderingFit && (
              <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-500">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                  </div>
                </div>
                <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] text-center px-4">Anchoring Identity & Fitting Outfit...</p>
              </div>
            )}
            
            {aiRenderedImage ? (
              <div className="relative group animate-in zoom-in-95 duration-500 shadow-[0_40px_100px_-20px_rgba(79,70,229,0.3)] rounded-2xl overflow-hidden border-8 border-white">
                <img src={aiRenderedImage} className="w-full h-auto" alt="AI Generated Look" />
                <button onClick={() => setAiRenderedImage(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md hover:bg-black/70">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ) : (
              <AvatarCanvas avatar={avatar} selectedItems={wardrobe.filter(i => i.isSelected)} />
            )}
          </div>
          
          <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-4 hidden xl:block z-30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-2">Outfit Layering</h3>
            {wardrobe.filter(i => i.isSelected).map((item, i) => (
              <div key={item.id} className="w-16 h-16 bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center animate-in slide-in-from-right-8 fade-in duration-300 hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 100}ms` }}>
                <img src={item.imageUrl} className="w-full h-full object-contain rounded-xl" alt={item.name} />
              </div>
            ))}
          </div>
        </div>

        <div className="fixed bottom-10 right-10 z-50">
          <VoiceAssistant wardrobeItems={wardrobe} />
        </div>
      </main>
    </div>
  );
};

export default App;
