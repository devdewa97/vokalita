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
  Smartphone
} from 'lucide-react';

// KONFIGURASI API
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
  const [cooldown, setCooldown] = useState(0);
  const [showResourceInfo, setShowResourceInfo] = useState(true);

  const audioRef = useRef(null);

  // Timer Hitung Mundur untuk Pesan Limitasi
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setErrorMessage(""); 
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Pesan error biasa hilang dalam 10 detik
  useEffect(() => {
    if (errorMessage && cooldown === 0) {
      const timer = setTimeout(() => setErrorMessage(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, cooldown]);

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
      icon: <Cpu className="w-6 h-6 text-[#D4AF37]" />,
      title: "AI Script Genius",
      desc: "Naskah iklan persuasif otomatis dari deskripsi produk Anda."
    },
    {
      icon: <Headphones className="w-6 h-6 text-[#D4AF37]" />,
      title: "Vokal Ultra-Jernih",
      desc: "Audio High-Fidelity setara rekaman studio profesional."
    },
    {
      icon: <Settings2 className="w-6 h-6 text-[#D4AF37]" />,
      title: "Kontrol Presisi",
      desc: "Atur nada, kecepatan, dan gain suara secara instan."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-[#D4AF37]" />,
      title: "Mobile Optimized",
      desc: "Akses lancar dari perangkat manapun dengan tampilan responsif."
    }
  ];

  const generateScript = async () => {
    if (!productDesc || !usp || cooldown > 0) return;
    setIsGeneratingScript(true);
    setGeneratedScript("");
    setErrorMessage("");
    
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
          throw new Error("Batas pemrosesan sesi tercapai. Sistem memerlukan jeda singkat untuk menjaga kualitas.");
        }
        throw new Error(data.error?.message || "Koneksi terganggu.");
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
          setCooldown(60);
          throw new Error("Batas pemrosesan sesi tercapai. Sistem memerlukan jeda singkat untuk menjaga kualitas.");
        }
        throw new Error("Gagal render audio.");
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
      
      {/* Optimized Background Orbs - Hidden on low-end mobile devices, visible on Desktop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="hidden md:block absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-indigo-900/10 blur-[120px] rounded-full"></div>
        <div className="hidden md:block absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-[#D4AF37]/5 blur-[150px] rounded-full"></div>
        {/* Simpler gradient for mobile to prevent blank screen crash */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-[#0A0D14] to-[#05070A]"></div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <nav className="border-b border-[#D4AF37]/10 bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-center">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-md flex items-center justify-center shadow-lg">
                <Mic2 className="w-5 h-5 text-[#D4AF37]" />
             </div>
             <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase italic">Vokalita</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[9px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-widest shadow-2xl animate-fade-in">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
            Artificial Intelligence Sound Technology
          </div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[1] text-white uppercase italic animate-slide-up">
              Voice Over AI yang <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F9E498] via-[#D4AF37] to-[#8C6B1F]">Terasa Manusiawi.</span>
            </h2>
            <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light px-4 animate-fade-in delay-200">
              Ubah konsep campaign menjadi suara profesional dalam detik. Naskah cerdas & vokal AI tercanggih.
            </p>
          </div>
        </div>
      </section>

      {/* Main App */}
      <section id="generator" className="max-w-7xl mx-auto px-4 md:px-6 pb-20 z-10 relative w-full">
        
        {/* Resource Optimization Banner */}
        {showResourceInfo && (
          <div className="mb-12 max-w-4xl mx-auto bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-5 rounded-lg flex items-center gap-4 group hover:border-[#D4AF37]/30 transition-all shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-md flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-[#D4AF37]" />
             </div>
             <div className="flex-1 text-left pr-8">
               <h6 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Resource Optimization Mode</h6>
               <p className="text-[11px] md:text-[12px] text-slate-500 leading-relaxed font-medium">
                 Vokalita menggunakan pemrosesan High-Fidelity. Untuk performa terbaik, sistem menerapkan antrian otomatis saat trafik padat. Hubungi <span className="text-white border-b border-white/20">mail.sidewa@gmail.com</span> untuk akses tanpa batas.
               </p>
             </div>
             <button onClick={() => setShowResourceInfo(false)} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
               <X className="w-4 h-4" />
             </button>
          </div>
        )}

        {/* Dynamic Cooldown Notification */}
        {errorMessage && (
          <div className="mb-8 max-w-4xl mx-auto bg-indigo-500/10 border border-indigo-500/20 p-4 md:p-6 rounded-lg flex items-start gap-4 shadow-2xl animate-in zoom-in duration-300">
             <div className="w-10 h-10 bg-indigo-500/10 rounded-md flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
             </div>
             <div className="flex-1 text-left">
               <h6 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 flex justify-between">
                 System Status 
                 {cooldown > 0 && <span>Re-initializing in {cooldown}s</span>}
               </h6>
               <p className="text-[12px] md:text-[13px] text-slate-300 leading-relaxed font-medium uppercase">
                 {errorMessage}
               </p>
               {cooldown > 0 && (
                 <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(cooldown/60)*100}%` }}></div>
                 </div>
               )}
             </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 md:gap-12 items-start">
          {/* Panel Kiri: Input */}
          <div className="lg:col-span-5 space-y-6 md:space-y-8 order-1">
            <div className="bg-[#0A0D14] border border-[#D4AF37]/10 p-6 md:p-10 rounded-lg shadow-2xl space-y-8">
              <div className="space-y-4 text-left">
                <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-6 h-6 md:w-7 md:h-7 bg-[#D4AF37] text-black rounded-sm flex items-center justify-center text-[10px]">1</span>
                  Konsep Campaign
                </h4>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Produk</label>
                   <textarea 
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Tuliskan produk Anda..."
                    className="w-full h-32 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                </div>
              </div>

              <div className="space-y-4 text-left">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Keunggulan Utama</label>
                   <textarea 
                    value={usp}
                    onChange={(e) => setUsp(e.target.value)}
                    placeholder="Apa yang membedakan produk Anda?"
                    className="w-full h-24 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                 </div>
              </div>

              <button 
                onClick={generateScript} 
                disabled={!productDesc || !usp || isGeneratingScript || cooldown > 0} 
                className="w-full relative h-14 md:h-16 rounded-md overflow-hidden group shadow-lg disabled:opacity-30 active:scale-95 transition-transform"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%]"></div>
                <div className="relative h-full flex items-center justify-center gap-3 text-[#05070A] font-black text-[11px] md:text-[12px] uppercase tracking-[0.3em]">
                  {isGeneratingScript ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-4 h-4 fill-current" /> Generate AI Script</>}
                </div>
              </button>
            </div>
          </div>

          {/* Panel Kanan: Output */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2">
            <div className="bg-[#0A0D14] border border-white/5 p-6 md:p-10 rounded-lg shadow-2xl space-y-8">
              <div className="space-y-4 text-left">
                <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-6 h-6 md:w-7 md:h-7 bg-white text-black rounded-sm flex items-center justify-center text-[10px]">3</span>
                  Review Naskah
                </h4>
                <textarea 
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  placeholder="Hasil analisis AI akan tampil di sini..."
                  className="w-full h-48 md:h-52 bg-[#05070A] border border-slate-800 rounded-md p-4 md:p-8 text-base font-mono leading-relaxed resize-none transition-all text-white outline-none focus:border-[#D4AF37]/30"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Karakter Vokal</label>
                  <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-4 text-sm font-bold text-white outline-none rounded-md appearance-none cursor-pointer focus:border-[#D4AF37]/50">
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gaya Penyampaian</label>
                  <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-4 text-sm font-bold text-white outline-none rounded-md appearance-none cursor-pointer focus:border-[#D4AF37]/50">
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 md:gap-10 bg-[#05070A] p-6 md:p-8 border border-slate-800 rounded-lg">
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Gain</span><span className="text-[#D4AF37] font-mono">{volume}%</span></div>
                    <span className="text-[8px] text-slate-600 font-medium">Mengatur kekuatan volume suara.</span>
                  </div>
                  <input type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Pitch</span><span className="text-[#D4AF37] font-mono">{pitch}</span></div>
                    <span className="text-[8px] text-slate-600 font-medium">Mengatur tinggi rendah nada suara.</span>
                  </div>
                  <input type="range" min="-20" max="20" value={pitch} onChange={(e)=>setPitch(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Timing</span><span className="text-[#D4AF37] font-mono">{speed}x</span></div>
                    <span className="text-[8px] text-slate-600 font-medium">Mengatur kecepatan bicara vokal.</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e)=>setSpeed(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
              </div>

              <button 
                onClick={generateAudio} 
                disabled={!generatedScript || isGeneratingAudio || cooldown > 0} 
                className="w-full py-4 md:py-5 bg-white text-[#05070A] font-black text-[11px] md:text-[12px] uppercase tracking-[0.4em] rounded-md flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl disabled:opacity-20"
              >
                {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <><Activity className="w-4 h-4 fill-current" /> Initialize Render</>}
              </button>

              {audioUrl && (
                <div className="flex flex-col gap-4 p-4 md:p-8 bg-[#05070A] border border-[#D4AF37]/20 rounded-md animate-in slide-in-from-bottom-2 duration-500">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full h-8 invert brightness-110 contrast-125 opacity-70" />
                  <button onClick={downloadAudio} className="w-full py-4 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] rounded-md hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
                     Mastering & Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 z-10 border-t border-[#D4AF37]/5 bg-[#080A0F]/50">
        <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
          <div className="text-center space-y-4">
            <h3 className="text-[9px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">The Advantage</h3>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic">Mengapa Vokalita?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 md:p-8 bg-[#0A0D14] border border-white/5 rounded-lg space-y-6 hover:border-[#D4AF37]/30 transition-all group shadow-xl">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-md flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-500">
                  {feature.icon}
                </div>
                <div className="space-y-3 text-left">
                  <h4 className="text-base md:text-lg font-black text-white uppercase italic">{feature.title}</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/10 py-12 md:py-20 bg-[#030508] relative z-10 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10 md:gap-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0A0D14] border border-[#D4AF37]/20 rounded-md flex items-center justify-center">
                <Mic2 className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic">Vokalita.</h1>
                <p className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] mt-2">AI Sound Lab Indonesia</p>
              </div>
            </div>
            <div className="w-full pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-center">
                © 2026 Vokalita Lab. All Rights Reserved.
              </p>
              <div className="flex items-center gap-2 text-[8px] md:text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center">
                Designed & Developed by <span className="text-[#D4AF37] font-black">Gusti Dewa Anggading</span>
              </div>
            </div>
          </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-shimmer { animation: shimmer 4s infinite linear; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 2px; background: #D4AF37; cursor: pointer; border: 2px solid #05070A; margin-top: -6px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #1e293b; }
        html, body { overscroll-behavior-y: contain; background-color: #05070A; }
      `}} />
    </div>
  );
};

export default App;