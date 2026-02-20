import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic2, 
  Sparkles, 
  Play, 
  Download, 
  Volume2, 
  FastForward, 
  TrendingUp, 
  Zap,
  Loader2,
  Waves,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Star,
  MessageSquare,
  Clock
} from 'lucide-react';

// Konfigurasi API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const SCRIPT_MODEL = "gemini-2.5-flash-preview-09-2025";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

const App = () => {
  const [productDesc, setProductDesc] = useState("");
  const [usp, setUsp] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState("Zephyr");
  const [selectedStyle, setSelectedStyle] = useState("Bersemangat / Excited");
  
  const [volume, setVolume] = useState(80);
  const [pitch, setPitch] = useState(0); 
  const [speed, setSpeed] = useState(1.0); 

  const audioRef = useRef(null);

  const voices = [
    { id: "Zephyr", name: "Laki-laki: Enerjik & Bersemangat" },
    { id: "Charon", name: "Laki-laki: Hangat & Tenang" },
    { id: "Enceladus", name: "Laki-laki: Formal & Berwibawa" },
    { id: "Leda", name: "Perempuan: Ramah & Lembut" },
    { id: "Aoede", name: "Perempuan: Ceria & Terang" },
    { id: "Callirrhoe", name: "Perempuan: Elegant & Informatif" },
    { id: "Despina", name: "Perempuan: Pembaca Berita (Formal)" },
  ];

  const styles = [
    "Bersemangat / Excited",
    "Pembaca Berita (News Anchor)",
    "Formal / Corporate",
    "Santai / Casual",
    "Iklan / Marketing (Hard Sell)",
    "Storytelling (Bercerita)",
    "Informatif / Tutorial"
  ];

  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return await response.json();
        if (response.status !== 429 && response.status < 500) break;
      } catch (e) {}
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
    throw new Error("Gagal menghubungi server.");
  };

  const generateScript = async () => {
    if (!productDesc || !usp) return;
    setIsGeneratingScript(true);
    try {
      const systemPrompt = "Anda adalah Senior Copywriter. Buatkan script Voice Over yang persuasif, jelas, dan profesional.";
      const userQuery = `Produk: ${productDesc}\nUSP: ${usp}\nBuatkan script VO yang menarik untuk konten promosi.`;

      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setGeneratedScript(text.replace(/\*\*/g, '').trim()); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const pcmToWav = (pcmData, sampleRate) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length * 2, true);
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) view.setInt16(offset, pcmData[i], true);
    return new Blob([view], { type: 'audio/wav' });
  };

  const generateAudio = async () => {
    if (!generatedScript) return;
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    try {
      const prompt = `Style: ${selectedStyle}. Text: ${generatedScript}`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
            }
          }
        })
      });

      const result = await response.json();
      const audioDataBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/L16;rate=24000";
      const sampleRate = parseInt(mimeType.split('rate=')[1]) || 24000;

      if (audioDataBase64) {
        const binaryString = atob(audioDataBase64);
        const pcmData = new Int16Array(binaryString.length / 2);
        for (let i = 0; i < pcmData.length; i++) {
          pcmData[i] = (binaryString.charCodeAt(i * 2 + 1) << 8) | binaryString.charCodeAt(i * 2);
        }
        const wavBlob = pcmToWav(pcmData, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `vokalita-${selectedVoice.toLowerCase()}-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans selection:bg-[#D4AF37]/30 overflow-x-hidden relative">
      
      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Large Floating Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-indigo-900/10 blur-[120px] rounded-full animate-float-slow"></div>
        <div className="absolute top-[10%] right-[-10%] w-[35vw] h-[35vw] bg-[#D4AF37]/5 blur-[150px] rounded-full animate-float-reverse"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[30vw] h-[30vw] bg-blue-900/5 blur-[100px] rounded-full animate-float-diagonal"></div>
        
        {/* Subtle Moving Circles behind header area */}
        <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[60vw] h-[200px] bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent blur-[80px] animate-pulse-slow"></div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      {/* Header */}
      <nav className="border-b border-[#D4AF37]/10 bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#C5A028] to-[#D4AF37] rounded-[5px] blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-11 h-11 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-[5px] flex items-center justify-center shadow-2xl transition-all group-hover:border-[#D4AF37]/80">
                <Mic2 className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Vokalita</h1>
              <div className="flex items-center gap-1.5 text-[9px] text-[#D4AF37] font-bold uppercase tracking-[0.3em] leading-none">
                <span className="w-1.5 h-[1.5px] bg-[#D4AF37]"></span> By Gusti Dewa Anggading
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-[5px] bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em] shadow-2xl animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Artificial Intelligence Sound Technology
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white uppercase italic animate-slide-up">
              Voice Over AI yang <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F9E498] via-[#D4AF37] to-[#8C6B1F]">Terasa Manusiawi.</span>
            </h2>
            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light tracking-wide animate-fade-in delay-200">
              Gunakan Vokalita by Dewa untuk menghasilkan voice over berkualitas tinggi dengan karakter suara yang natural dan profesional.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8 animate-fade-in delay-300">
            <a href="#generator" className="px-12 py-5 bg-white text-[#05070A] font-black text-xs uppercase tracking-[0.2em] rounded-[5px] hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-white/5">
              Mulai Eksperimen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6 z-10 bg-[#030508]/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            { icon: Zap, title: "Intonasi Natural", desc: "Sintesis suara tingkat tinggi untuk menghasilkan penekanan kata yang menyerupai manusia asli." },
            { icon: MessageSquare, title: "Karakter Emosional", desc: "Suara Vokalita dirancang untuk membawa emosi dan jiwa ke dalam setiap naskah promosi Anda." },
            { icon: ShieldCheck, title: "Studio Standard", desc: "Format audio jernih dan profesional yang siap diintegrasikan langsung ke proyek kreatif Anda." }
          ].map((item, i) => (
            <div key={i} className="space-y-4 p-8 border-l border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all rounded-[5px]">
              <item.icon className="w-8 h-8 text-[#D4AF37]" />
              <h4 className="text-lg font-black uppercase italic text-white tracking-tight">{item.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="max-w-7xl mx-auto px-6 py-32 z-10 relative">
        <div className="text-center mb-20 space-y-4">
           <h3 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">AI Studio Generator</h3>
           <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Eksperimen Karakter Suara Tanpa Batas</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Section 1: Naskah */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-[5px] bg-[#D4AF37] text-[#05070A] flex items-center justify-center font-black text-xs shadow-lg shadow-[#D4AF37]/20">1</div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">Konsep Campaign</h3>
            </div>

            <div className="bg-[#0A0D14] border border-[#D4AF37]/10 p-10 rounded-[5px] shadow-2xl space-y-10 group transition-all hover:border-[#D4AF37]/30">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deskripsi Produk / Jasa</label>
                <textarea 
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Ceritakan detail campaign yang Anda inginkan..."
                  className="w-full h-32 bg-[#05070A] border border-slate-800 rounded-[5px] p-6 text-sm text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none placeholder:text-slate-800"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Keunggulan Utama (USP)</label>
                <textarea 
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  placeholder="Sebutkan alasan mengapa audiens harus memilih Anda..."
                  className="w-full h-24 bg-[#05070A] border border-slate-800 rounded-[5px] p-6 text-sm text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none placeholder:text-slate-800"
                />
              </div>

              <button 
                onClick={generateScript}
                disabled={!productDesc || !usp || isGeneratingScript}
                className="w-full relative group overflow-hidden h-16 rounded-[5px]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%] transition-opacity group-disabled:opacity-20"></div>
                <div className="relative h-full bg-transparent flex items-center justify-center gap-3 text-[#05070A] font-black text-[12px] uppercase tracking-[0.25em] transition-transform active:scale-[0.98]">
                  {isGeneratingScript ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-current" />
                      Generate Script AI
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Render */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-[5px] bg-white text-[#05070A] flex items-center justify-center font-black text-xs shadow-lg shadow-white/5">2</div>
              <h3 className="text-sm font-black tracking-widest text-white uppercase">Engine Suara & Gaya</h3>
            </div>

            <div className="bg-[#0A0D14] border border-white/5 p-10 rounded-[5px] shadow-2xl space-y-10">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Naskah Siap Render</label>
                  {generatedScript && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 rounded-[5px] border border-[#D4AF37]/20">
                      <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                      <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest">AI Generated</span>
                    </div>
                  )}
                </div>
                <textarea 
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  placeholder="Hasil naskah AI akan muncul di sini..."
                  className="w-full h-52 bg-[#05070A] border border-slate-800 rounded-[5px] p-8 text-sm text-white focus:border-[#D4AF37]/30 outline-none transition-all resize-none font-mono leading-relaxed placeholder:text-slate-800"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Karakter Suara</label>
                  <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-[#05070A] border border-slate-800 rounded-[5px] p-5 text-xs font-bold text-white focus:border-[#D4AF37]/40 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gaya Bicara</label>
                  <select 
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-[#05070A] border border-slate-800 rounded-[5px] p-5 text-xs font-bold text-white focus:border-[#D4AF37]/40 outline-none appearance-none cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="grid md:grid-cols-3 gap-10 bg-[#05070A] p-8 border border-slate-800 rounded-[5px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Volume</span>
                    <span className="text-[#D4AF37] font-mono">{volume}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(e.target.value)} className="w-full h-1 bg-slate-800 rounded-[5px] appearance-none cursor-pointer accent-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Pitch / Nada</span>
                    <span className="text-[#D4AF37] font-mono">{pitch}</span>
                  </div>
                  <input type="range" min="-20" max="20" value={pitch} onChange={(e)=>setPitch(e.target.value)} className="w-full h-1 bg-slate-800 rounded-[5px] appearance-none cursor-pointer accent-[#D4AF37]" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Kecepatan</span>
                    <span className="text-[#D4AF37] font-mono">{speed}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e)=>setSpeed(e.target.value)} className="w-full h-1 bg-slate-800 rounded-[5px] appearance-none cursor-pointer accent-[#D4AF37]" />
                </div>
              </div>

              <div className="space-y-6">
                <button 
                  onClick={generateAudio}
                  disabled={!generatedScript || isGeneratingAudio}
                  className="w-full py-5 bg-white text-[#05070A] font-black text-[12px] uppercase tracking-[0.35em] rounded-[5px] flex items-center justify-center gap-3 hover:bg-[#D4AF37] transition-all active:scale-[0.98] disabled:opacity-20 shadow-2xl h-16"
                >
                  {isGeneratingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-4 h-4 fill-current" /> Render Voice Over</>}
                </button>

                {audioUrl && (
                  <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-[#05070A] border border-[#D4AF37]/20 rounded-[5px] animate-in slide-in-from-bottom-2 shadow-inner">
                    <audio ref={audioRef} src={audioUrl} controls className="w-full md:flex-1 h-8 brightness-110 contrast-125 invert opacity-70" />
                    <button 
                      onClick={downloadAudio}
                      className="w-full md:w-auto px-12 py-4 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] rounded-[5px] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-4 h-4" /> Download WAV
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 z-10 bg-gradient-to-b from-transparent to-[#030508]">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-20">
          <div className="space-y-6">
            <h3 className="text-4xl md:text-7xl font-black uppercase italic text-white leading-none tracking-tighter">Efisiensi Produksi</h3>
            <p className="text-slate-500 uppercase tracking-widest text-[11px] font-bold">Standard Baru Industri Kreatif</p>
          </div>
          <div className="grid md:grid-cols-4 gap-10 w-full">
            {[
              { val: "99%", label: "Akustik Akurasi" },
              { val: "10+", label: "Karakter Vokal" },
              { val: "5s", label: "Waktu Render" },
              { val: "10x", label: "Produktivitas" }
            ].map((stat, i) => (
              <div key={i} className="p-10 bg-[#0A0D14] border border-white/5 rounded-[5px] space-y-2 shadow-xl hover:border-[#D4AF37]/20 transition-all">
                <p className="text-4xl font-black text-[#D4AF37] tracking-tighter italic">{stat.val}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="border-t border-[#D4AF37]/10 py-24 px-6 bg-[#030508] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-16 text-center">
          <div className="flex items-center gap-4 transition-transform hover:scale-105 duration-500">
            <div className="w-12 h-12 bg-[#0A0D14] border border-[#D4AF37]/20 rounded-[5px] flex items-center justify-center shadow-lg shadow-[#D4AF37]/5">
              <Mic2 className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <span className="font-black text-3xl tracking-tighter text-white uppercase italic">Vokalita.</span>
          </div>
          
          <div className="grid md:grid-cols-2 w-full max-w-4xl gap-20 border-y border-white/5 py-16">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#D4AF37]"><Cpu className="w-4 h-4" /> <p className="text-[10px] font-black uppercase tracking-widest">AI Engine Architecture</p></div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">Sistem sintesis suara mutakhir yang dioptimalkan untuk karakter suara ekspresif dan alami.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#D4AF37]"><Clock className="w-4 h-4" /> <p className="text-[10px] font-black uppercase tracking-widest">Real-time Rendering</p></div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">Kecepatan pemrosesan yang konsisten untuk menjaga efisiensi workflow produksi konten Anda.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center gap-4">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status: Operational</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">
              © 2026 Vokalita by Gusti Dewa Anggading
            </p>
            <p className="text-slate-800 text-[9px] uppercase tracking-[0.2em] font-medium max-w-lg mx-auto">
              Seluruh teknologi suara dihasilkan secara sintetis menggunakan sistem kecerdasan buatan terdepan.
            </p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 30px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(25px, -25px); }
        }
        @keyframes float-diagonal {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, -40px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; transform: scale(1); }
          50% { opacity: 0.08; transform: scale(1.05); }
        }
        .animate-shimmer { animation: shimmer 4s infinite linear; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 18s ease-in-out infinite; }
        .animate-float-diagonal { animation: float-diagonal 20s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #05070A; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #D4AF37; }

        /* Range Input Styling */
        input[type=range] { -webkit-appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 2px;
          background: #D4AF37;
          cursor: pointer;
          border: 2px solid #05070A;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
          margin-top: -6px;
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 2px;
          background: #1e293b;
        }
      `}} />
    </div>
  );
};

export default App;