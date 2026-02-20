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
  Activity
} from 'lucide-react';

/**
 * VOKALITA PRODUCTION READY VERSION
 * Dirancang untuk deployment di Vercel/Netlify menggunakan Vite.
 */

// KONFIGURASI API
const getApiKey = () => {
  try {
    // Vite menggunakan import.meta.env untuk membaca variabel dari Vercel/Local .env
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
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

  const audioRef = useRef(null);

  // DAFTAR SUARA DENGAN KARAKTER PROFESIONAL (Fokus Gender-Specific)
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
      desc: "Menghasilkan naskah iklan yang persuasif dan menjual hanya dari deskripsi singkat produk Anda."
    },
    {
      icon: <Headphones className="w-6 h-6 text-[#D4AF37]" />,
      title: "Vokal Ultra-Jernih",
      desc: "Teknologi sintesis suara tercanggih yang menghasilkan audio setara rekaman studio profesional."
    },
    {
      icon: <Settings2 className="w-6 h-6 text-[#D4AF37]" />,
      title: "Kontrol Presisi",
      desc: "Atur nada suara, kecepatan bicara, hingga volume vokal sesuai dengan kebutuhan brand Anda."
    },
    {
      icon: <Target className="w-6 h-6 text-[#D4AF37]" />,
      title: "Multi-Karakter",
      desc: "Pilihan berbagai karakter suara laki-laki dan perempuan dengan berbagai gaya penyampaian."
    }
  ];

  const generateScript = async () => {
    if (!productDesc || !usp) return;
    if (!apiKey) {
      setGeneratedScript("Gagal: Konfigurasi sistem belum siap. Pastikan API Key sudah terpasang.");
      return;
    }

    setIsGeneratingScript(true);
    setGeneratedScript("");
    setErrorMessage("");
    
    try {
      const modelName = "gemini-2.5-flash";
      const apiVersion = "v1beta";
      
      const fullPrompt = `Buatkan naskah Voice Over iklan profesional Bahasa Indonesia yang persuasif.\nProduk: ${productDesc}\nKeunggulan Utama: ${usp}\nFormat: Berikan naskah bersih saja tanpa simbol markdown atau penjelasan tambahan.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) throw new Error("Sistem sedang mengoptimalkan sumber daya. Silakan tunggu 1 menit.");
        throw new Error("Layanan sedang padat. Silakan coba kembali.");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Hasil tidak ditemukan.";
      setGeneratedScript(text.replace(/\*\*/g, '').replace(/###/g, '').replace(/\*/g, '').trim()); 
    } catch (error) {
      setErrorMessage(error.message);
      setGeneratedScript(`Update Status: ${error.message}`);
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
    if (!generatedScript || !apiKey || generatedScript.includes("Status")) return;
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    setErrorMessage("");

    try {
      const voiceInstruction = `Gunakan suara ${selectedVoice} (Pastikan output suara sesuai gender model ini). Gaya: ${selectedStyle}. Kecepatan: ${speed}x. Volume: ${volume}%.`;
      const promptText = `Ucapkan naskah ini dengan profil instruksi [${voiceInstruction}]: ${generatedScript}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
            }
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) throw new Error("Batas pemrosesan sesi tercapai. Sistem memerlukan jeda singkat untuk menjaga kualitas.");
        throw new Error("Gagal melakukan render vokal. Periksa koneksi Anda.");
      }

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
        setAudioUrl(URL.createObjectURL(wavBlob));
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
    link.download = `vokalita-render-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans selection:bg-[#D4AF37]/30 overflow-x-hidden relative">
      
      {/* Background Dinamis Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-indigo-900/10 blur-[120px] rounded-full animate-float-slow"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-[#D4AF37]/5 blur-[150px] rounded-full animate-float-reverse"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[30vw] h-[30vw] bg-blue-900/5 blur-[100px] rounded-full animate-float-diagonal"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <nav className="border-b border-[#D4AF37]/10 bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-center">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="relative">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#C5A028] to-[#D4AF37] rounded-[5px] blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-11 h-11 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-[5px] flex items-center justify-center shadow-2xl transition-all">
                <Mic2 className="w-6 h-6 text-[#D4AF37]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase italic leading-none">Vokalita</h1>
              <div className="flex items-center gap-1.5 text-[9px] text-[#D4AF37] font-bold uppercase tracking-[0.3em] mt-1">
                <span className="w-1.5 h-[1.5px] bg-[#D4AF37]"></span> By Gusti Dewa Anggading
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Landing Page Hero Section */}
      <section className="relative pt-24 pb-12 px-6 z-10 text-center">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-[5px] bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25em] shadow-2xl animate-fade-in">
            <Sparkles className="w-4 h-4" />
            Artificial Intelligence Sound Technology
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] text-white uppercase italic animate-slide-up">
              Voice Over AI yang <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F9E498] via-[#D4AF37] to-[#8C6B1F]">Terasa Manusiawi.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light tracking-wide animate-fade-in delay-200">
              Ubah konsep campaign Anda menjadi suara profesional dalam hitungan detik. Vokalita menggabungkan kecerdasan naskah dan kejernihan vokal AI tercanggih.
            </p>
          </div>
        </div>
      </section>

      {/* Main App Section */}
      <section id="generator" className="max-w-7xl mx-auto px-6 pb-20 z-10 relative">
        
        {/* Info Box */}
        <div className="mb-12 max-w-4xl mx-auto bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-5 rounded-[5px] flex items-center gap-4 group hover:border-[#D4AF37]/30 transition-all shadow-2xl">
           <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-[5px] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
           </div>
           <div className="flex-1 text-left">
             <h6 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Resource Optimization Mode</h6>
             <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
               Vokalita menggunakan pemrosesan High-Fidelity. Untuk performa terbaik, sistem menerapkan antrian otomatis saat trafik padat. Hubungi <span className="text-white border-b border-white/20">Enterprise Support</span> untuk akses tanpa batas.
             </p>
           </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Panel Kiri: Input */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#0A0D14] border border-[#D4AF37]/10 p-10 rounded-[5px] shadow-2xl space-y-10 transition-all hover:border-[#D4AF37]/20">
              <div className="space-y-5 text-left">
                <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <span className="w-7 h-7 bg-[#D4AF37] text-black rounded-[2px] flex items-center justify-center text-[11px]">1</span>
                  Konsep Campaign
                </h4>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Produk / Jasa</label>
                   <textarea 
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Tuliskan produk Anda..."
                    className="w-full h-32 bg-[#05070A] border border-slate-800 rounded-[5px] p-6 text-sm text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                </div>
              </div>

              <div className="space-y-5 text-left">
                 <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Keunggulan Utama (USP)</label>
                   <textarea 
                    value={usp}
                    onChange={(e) => setUsp(e.target.value)}
                    placeholder="Apa yang membedakan produk Anda?"
                    className="w-full h-24 bg-[#05070A] border border-slate-800 rounded-[5px] p-6 text-sm text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none"
                   />
                 </div>
              </div>

              <button 
                onClick={generateScript} 
                disabled={!productDesc || !usp || isGeneratingScript} 
                className="w-full relative h-16 rounded-[5px] overflow-hidden group shadow-lg mt-4 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%] transition-opacity group-disabled:opacity-20"></div>
                <div className="relative h-full flex items-center justify-center gap-3 text-[#05070A] font-black text-[12px] uppercase tracking-[0.3em] transition-transform active:scale-95">
                  {isGeneratingScript ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-4 h-4 fill-current" /> Process AI Script</>}
                </div>
              </button>
            </div>
          </div>

          {/* Panel Kanan: Output */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-[#0A0D14] border border-white/5 p-10 rounded-[5px] shadow-2xl space-y-10">
              
              <div className="space-y-5 text-left">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                    <span className="w-7 h-7 bg-white text-black rounded-[2px] flex items-center justify-center text-[11px]">3</span>
                    Review Naskah
                  </h4>
                </div>
                <textarea 
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  placeholder="Hasil analisis AI akan tampil di sini..."
                  className={`w-full h-52 bg-[#05070A] border border-slate-800 rounded-[5px] p-8 text-sm font-mono leading-relaxed resize-none transition-all text-white`}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Karakter Vokal</label>
                  <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-5 text-xs font-bold text-white outline-none rounded-[5px] appearance-none cursor-pointer">
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2 text-left">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gaya Penyampaian</label>
                  <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-[#05070A] border border-slate-800 p-5 text-xs font-bold text-white outline-none rounded-[5px] appearance-none cursor-pointer">
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-10 bg-[#05070A] p-8 border border-slate-800 rounded-[5px]">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Gain Control</span><span className="text-[#D4AF37] font-mono">{volume}%</span></div>
                  <input type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Frequency</span><span className="text-[#D4AF37] font-mono">{pitch}</span></div>
                  <input type="range" min="-20" max="20" value={pitch} onChange={(e)=>setPitch(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Timing</span><span className="text-[#D4AF37] font-mono">{speed}x</span></div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e)=>setSpeed(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                </div>
              </div>

              <button 
                onClick={generateAudio} 
                disabled={!generatedScript || isGeneratingAudio || generatedScript.includes("Status")} 
                className="w-full py-5 bg-white text-[#05070A] font-black text-[12px] uppercase tracking-[0.4em] rounded-[5px] flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl h-16"
              >
                {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <><Activity className="w-4 h-4 fill-current" /> Initialize Audio Render</>}
              </button>

              {errorMessage && (
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-[5px] flex items-center gap-4 text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl text-left">
                   <div className="w-8 h-8 bg-indigo-500/10 rounded-[5px] flex items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                   </div>
                   {errorMessage}
                </div>
              )}

              {audioUrl && (
                <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-[#05070A] border border-[#D4AF37]/20 rounded-[5px] animate-in slide-in-from-bottom-2 shadow-inner">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full md:flex-1 h-8 invert brightness-110 contrast-125 opacity-70" />
                  <button onClick={downloadAudio} className="px-12 py-4 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] rounded-[5px] hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
                     Mastering & Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="relative py-32 px-6 z-10 border-t border-[#D4AF37]/5 bg-[#080A0F]/50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.5em]">The Advantage</h3>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic">Mengapa Vokalita?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-8 bg-[#0A0D14] border border-white/5 rounded-[5px] space-y-6 hover:border-[#D4AF37]/30 transition-all group">
                <div className="w-12 h-12 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-[5px] flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-500">
                  {feature.icon}
                </div>
                <div className="space-y-3 text-left">
                  <h4 className="text-lg font-black text-white uppercase italic">{feature.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimalist */}
      <footer className="border-t border-[#D4AF37]/10 py-20 bg-[#030508] relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center gap-12">
              
              <div className="flex flex-col items-center gap-4 group">
                <div className="relative">
                  <div className="absolute -inset-1.5 bg-[#D4AF37] rounded-[5px] blur opacity-10 group-hover:opacity-30 transition"></div>
                  <div className="relative w-12 h-12 bg-[#0A0D14] border border-[#D4AF37]/20 rounded-[5px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Mic2 className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">Vokalita.</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Artificial Intelligence Sound Lab</p>
                </div>
              </div>

              <div className="w-full pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
                  © 2026 Vokalita Sound Lab. All Rights Reserved.
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-700 font-bold uppercase tracking-widest italic text-center md:text-right">
                  Designed & Developed by <span className="text-[#D4AF37] non-italic font-black">Gusti Dewa Anggading</span>
                </div>
              </div>

            </div>
          </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, 30px); } }
        @keyframes float-reverse { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(25px, -25px); } }
        @keyframes float-diagonal { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-30px, -40px); } }
        .animate-shimmer { animation: shimmer 4s infinite linear; }
        .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 1.5s ease-out forwards; }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 18s ease-in-out infinite; }
        .animate-float-diagonal { animation: float-diagonal 20s ease-in-out infinite; }
        input[type=range] { -webkit-appearance: none; background: transparent; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 2px; background: #D4AF37; cursor: pointer; border: 2px solid #05070A; margin-top: -6px; }
        input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 2px; background: #1e293b; }
      `}} />
    </div>
  );
};

export default App;