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
  Clock,
  Info,
  ChevronDown,
  Settings2,
  AlertTriangle,
  Key,
  CheckCircle2,
  RefreshCw,
  Search,
  List,
  Target,
  ZapOff,
  Headphones,
  InfoIcon,
  Activity,
  X,
  Smartphone,
  Calendar
} from 'lucide-react';

/**
 * VOKALITA - MOBILE OPTIMIZED VERSION
 * Fokus: Performa ringan, Anti-Blank Screen, & Anti-Zoom.
 */

const getApiKey = () => {
  try {
    const envKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== "KODE_API_KEY_ANDA_DISINI" && envKey.trim() !== "") {
      return envKey.trim();
    }
    return "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

const App = () => {
  // State Management
  const [productDesc, setProductDesc] = useState("");
  const [usp, setUsp] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState("Charon");
  const [selectedStyle, setSelectedStyle] = useState("Bersemangat / Excited");
  
  const [volume, setVolume] = useState(80);
  const [pitch, setPitch] = useState(0); 
  const [speed, setSpeed] = useState(1.0); 
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState(""); 
  const [cooldown, setCooldown] = useState(0);
  const [showResourceInfo, setShowResourceInfo] = useState(true);

  const audioRef = useRef(null);

  // Timer Hitung Mundur (Optimized for performance)
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && errorType === "minute") {
      setErrorMessage(""); 
      setErrorType("");
    }
    return () => clearInterval(timer);
  }, [cooldown, errorType]);

  // Auto-clear error messages
  useEffect(() => {
    if (errorMessage && errorType !== "daily") {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setErrorType("");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, errorType]);

  const voices = [
    { id: "Charon", name: "Laki-laki: Deep & Professional" },
    { id: "Enceladus", name: "Laki-laki: Berat & Berwibawa" },
    { id: "Fenrir", name: "Laki-laki: Tegas & Maskulin" },
    { id: "Puck", name: "Laki-laki: Enerjik (Anak Muda)" },
    { id: "Leda", name: "Perempuan: Ramah & Profesional" },
    { id: "Kore", name: "Perempuan: Ceria & Terang" },
    { id: "Aoede", name: "Perempuan: Lembut & Elegant" },
    { id: "Despina", name: "Perempuan: Formal & Jelas" },
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

  const features = [
    {
      icon: <Cpu className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />,
      title: "AI Script Genius",
      desc: "Naskah iklan persuasif otomatis dari deskripsi produk."
    },
    {
      icon: <Headphones className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />,
      title: "Vokal Ultra-Jernih",
      desc: "Audio High-Fidelity setara rekaman studio profesional."
    },
    {
      icon: <Settings2 className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />,
      title: "Kontrol Presisi",
      desc: "Atur nada, kecepatan, dan gain suara secara instan."
    },
    {
      icon: <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />,
      title: "Mobile Optimized",
      desc: "Akses lancar dari perangkat manapun tanpa lag."
    }
  ];

  const generateScript = async () => {
    if (!productDesc || !usp || cooldown > 0) return;
    setIsGeneratingScript(true);
    setGeneratedScript("");
    setErrorMessage("");
    setErrorType("");
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Buatkan naskah Voice Over iklan profesional Bahasa Indonesia. Produk: ${productDesc}. Keunggulan: ${usp}. Format: Naskah bersih tanpa simbol markdown.` }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          setCooldown(60);
          setErrorType("minute");
          throw new Error("Batas pemrosesan sesi tercapai. Sistem sedang melakukan kalibrasi ulang.");
        }
        throw new Error(data.error?.message || "Koneksi sistem terganggu.");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal mendapatkan naskah.";
      setGeneratedScript(text.replace(/\*\*/g, '').replace(/###/g, '').replace(/\*/g, '').trim()); 
    } catch (error) {
      setErrorMessage(error.message);
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
    if (!generatedScript || cooldown > 0) return;
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    setErrorMessage("");
    setErrorType("");

    try {
      const voiceInstruction = `Suara: ${selectedVoice}. Kecepatan: ${speed}x. Volume: ${volume}%.`;
      const promptText = `Ucapkan naskah ini [${voiceInstruction}]: ${generatedScript}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } }
          }
        })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          setErrorType("daily");
          throw new Error("BATAS HARIAN TERCAPAI. JATAH RENDER HARI INI SUDAH HABIS.");
        }
        throw new Error("Gagal melakukan render vokal.");
      }

      const audioDataBase64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioDataBase64) {
        const binaryString = atob(audioDataBase64);
        const pcmData = new Int16Array(binaryString.length / 2);
        for (let i = 0; i < pcmData.length; i++) {
          pcmData[i] = (binaryString.charCodeAt(i * 2 + 1) << 8) | binaryString.charCodeAt(i * 2);
        }
        setAudioUrl(URL.createObjectURL(pcmToWav(pcmData, 24000)));
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `vokalita-audio-${Date.now()}.wav`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans selection:bg-[#D4AF37]/30 overflow-x-hidden relative flex flex-col">
      
      {/* Dynamic Background - Mobile Lite Version */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] bg-indigo-900/5 blur-[80px] md:blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[50vw] h-[50vw] bg-[#D4AF37]/5 blur-[80px] md:blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <nav className="border-b border-[#D4AF37]/10 bg-[#05070A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-md flex items-center justify-center shadow-lg">
                <Mic2 className="w-4 h-4 text-[#D4AF37]" />
             </div>
             <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Vokalita</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            AI Sound Tech
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-7xl font-black tracking-tighter leading-[1.1] text-white uppercase italic">
              Voice Over AI <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F9E498] via-[#D4AF37] to-[#8C6B1F]">Manusiawi.</span>
            </h2>
            <p className="text-sm md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light px-4">
              Ubah konsep campaign menjadi vokal profesional dalam hitungan detik.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="max-w-7xl mx-auto px-4 pb-20 z-10 relative w-full flex-grow">
        
        {/* Banner Info */}
        {showResourceInfo && (
          <div className="mb-8 max-w-4xl mx-auto bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-4 rounded-lg flex items-center gap-4 relative animate-in fade-in duration-500">
             <div className="w-9 h-9 bg-[#D4AF37]/10 rounded-md flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-[#D4AF37]" />
             </div>
             <div className="flex-1 text-left pr-6">
               <h6 className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest mb-0.5">Optimized Mode</h6>
               <p className="text-[10px] md:text-[11px] text-slate-400 leading-tight">
                 High-Fidelity processing aktif. Hubungi <span className="text-white font-bold">mail.sidewa@gmail.com</span> untuk akses tanpa antrian.
               </p>
             </div>
             <button onClick={() => setShowResourceInfo(false)} className="absolute top-2 right-2 text-slate-600 p-1">
               <X className="w-3.5 h-3.5" />
             </button>
          </div>
        )}

        {/* Status Notification */}
        {errorMessage && (
          <div className={`mb-8 max-w-4xl mx-auto border p-4 rounded-lg flex items-start gap-4 shadow-xl animate-in zoom-in duration-300 ${errorType === "daily" ? "bg-red-500/10 border-red-500/20" : "bg-indigo-500/10 border-indigo-500/20"}`}>
             <div className="w-9 h-9 bg-black/20 rounded-md flex items-center justify-center shrink-0">
                {errorType === "daily" ? <Calendar className="w-4 h-4 text-red-400" /> : <Activity className="w-4 h-4 text-indigo-400" />}
             </div>
             <div className="flex-1 text-left">
               <h6 className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${errorType === "daily" ? "text-red-300" : "text-indigo-300"}`}>
                 {errorType === "daily" ? "Limit Reached" : "System Alert"} 
                 {cooldown > 0 && errorType === "minute" && <span className="ml-2 opacity-60">Ready in {cooldown}s</span>}
               </h6>
               <p className={`text-[11px] font-bold uppercase leading-snug ${errorType === "daily" ? "text-red-400" : "text-slate-300"}`}>
                 {errorMessage}
               </p>
             </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Panel Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0A0D14] border border-[#D4AF37]/10 p-5 md:p-10 rounded-lg shadow-2xl space-y-6">
              <div className="space-y-4 text-left">
                <h4 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-6 h-6 bg-[#D4AF37] text-black rounded-sm flex items-center justify-center text-[10px]">1</span>
                  Konsep
                </h4>
                <div className="space-y-3">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Produk</label>
                   <textarea 
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Tuliskan produk Anda..."
                    className="w-full h-28 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Keunggulan</label>
                   <textarea 
                    value={usp}
                    onChange={(e) => setUsp(e.target.value)}
                    placeholder="Apa yang membedakan produk Anda?"
                    className="w-full h-20 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                </div>
              </div>

              <button 
                onClick={generateScript} 
                disabled={!productDesc || !usp || isGeneratingScript || (cooldown > 0 && errorType === "minute")} 
                className="w-full relative h-14 rounded-md overflow-hidden group shadow-lg disabled:opacity-30 active:scale-95 transition-transform"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%]"></div>
                <div className="relative h-full flex items-center justify-center gap-3 text-[#05070A] font-black text-[11px] uppercase tracking-[0.2em]">
                  {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 fill-current" /> Process AI Script</>}
                </div>
              </button>
            </div>
          </div>

          {/* Panel Output */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0A0D14] border border-white/5 p-5 md:p-10 rounded-lg shadow-2xl space-y-6">
              <div className="space-y-4 text-left">
                <h4 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-6 h-6 bg-white text-black rounded-sm flex items-center justify-center text-[10px]">2</span>
                  Review Naskah
                </h4>
                <textarea 
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  placeholder="Hasil akan tampil di sini..."
                  className="w-full h-40 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base font-mono leading-relaxed resize-none text-white outline-none focus:border-[#D4AF37]/30"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Karakter Vokal</label>
                  <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-3.5 text-sm font-bold text-white outline-none rounded-md appearance-none">
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Gaya Penyampaian</label>
                  <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-3.5 text-sm font-bold text-white outline-none rounded-md appearance-none">
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 bg-[#05070A] p-4 border border-slate-800 rounded-lg">
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase"><span>Gain</span><span>{volume}%</span></div>
                  <input type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37]" />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase"><span>Pitch</span><span>{pitch}</span></div>
                  <input type="range" min="-20" max="20" value={pitch} onChange={(e)=>setPitch(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37]" />
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase"><span>Timing</span><span>{speed}x</span></div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e)=>setSpeed(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37]" />
                </div>
              </div>

              <button 
                onClick={generateAudio} 
                disabled={!generatedScript || isGeneratingAudio || (cooldown > 0 && errorType === "minute")} 
                className="w-full py-4 bg-white text-[#05070A] font-black text-[11px] uppercase tracking-[0.3em] rounded-md flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 shadow-2xl"
              >
                {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Activity className="w-4 h-4" /> Initialize Render</>}
              </button>

              {audioUrl && (
                <div className="flex flex-col gap-4 p-4 bg-[#05070A] border border-[#D4AF37]/20 rounded-md">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full h-8 invert opacity-70" />
                  <button onClick={downloadAudio} className="w-full py-3.5 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] rounded-md hover:bg-[#D4AF37] hover:text-black transition-all">
                     Mastering & Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Advantage Section */}
      <section className="relative py-20 px-4 z-10 border-t border-[#D4AF37]/5 bg-[#080A0F]/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">Advantage</h3>
            <h2 className="text-3xl font-black text-white uppercase italic">Mengapa Vokalita?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 bg-[#0A0D14] border border-white/5 rounded-lg space-y-4 shadow-xl">
                <div className="w-10 h-10 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-md flex items-center justify-center">
                  {feature.icon}
                </div>
                <div className="space-y-2 text-left">
                  <h4 className="text-base font-black text-white uppercase italic">{feature.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/10 py-12 bg-[#030508] relative z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-9 h-9 bg-[#0A0D14] border border-[#D4AF37]/20 rounded-md flex items-center justify-center">
                <Mic2 className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Vokalita.</h1>
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] mt-1">AI Sound Lab Indonesia</p>
              </div>
            </div>
            <div className="w-full pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] text-center">
                © 2026 Vokalita Lab. All Rights Reserved.
              </p>
              <div className="flex items-center gap-1.5 text-[8px] text-slate-700 font-bold uppercase tracking-widest text-center">
                Built by <span className="text-[#D4AF37] font-black">Gusti Dewa Anggading</span>
              </div>
            </div>
          </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .animate-shimmer { animation: shimmer 4s infinite linear; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 12px; width: 12px; border-radius: 2px; background: #D4AF37; cursor: pointer; border: 1px solid #05070A; margin-top: -5px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #1e293b; }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D4AF37'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em; }
        html, body { overscroll-behavior-y: contain; -webkit-tap-highlight-color: transparent; }
      `}} />
    </div>
  );
};

export default App;