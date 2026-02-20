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
  User,
  Lock,
  Mail,
  UserPlus,
  LogIn,
  LogOut,
  Users,
  Check,
  Trash2,
  Calendar,
  BarChart3
} from 'lucide-react';

// --- KONSTANTA GLOBAL ---

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
  // --- AUTH STATE MANAGEMENT ---
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [users, setUsers] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // --- APP STATE MANAGEMENT ---
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
  const [errorType, setErrorType] = useState(""); // "minute" | "daily" | "quota"
  const [cooldown, setCooldown] = useState(0);
  const [showResourceInfo, setShowResourceInfo] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const audioRef = useRef(null);

  // --- INITIALIZE DATABASE & SESSION ---
  useEffect(() => {
    const savedUsers = localStorage.getItem('vokalita_users');
    let userList = [];
    if (savedUsers) {
      userList = JSON.parse(savedUsers);
    } else {
      userList = [
        {
          id: 'admin-01',
          email: 'admin@vokalita.com',
          password: 'admin123',
          fullName: 'System Administrator',
          role: 'admin',
          isApproved: true
        },
        {
          id: 'demo-01',
          email: 'demo@vokalita.com',
          password: 'demo123',
          fullName: 'Akun Demo Vokalita',
          role: 'demo',
          isApproved: true,
          usageCount: 0,
          lastUsageDate: new Date().toLocaleDateString()
        }
      ];
      localStorage.setItem('vokalita_users', JSON.stringify(userList));
    }
    setUsers(userList);
    
    const session = localStorage.getItem('vokalita_session');
    if (session) {
      const parsedSession = JSON.parse(session);
      const userStillExists = userList.find(u => u.email === parsedSession.email);
      if (userStillExists && (userStillExists.isApproved || userStillExists.role === 'admin')) {
        if (userStillExists.role === 'demo') {
            const today = new Date().toLocaleDateString();
            if (userStillExists.lastUsageDate !== today) {
                userStillExists.usageCount = 0;
                userStillExists.lastUsageDate = today;
                const updatedUsers = userList.map(u => u.id === userStillExists.id ? userStillExists : u);
                localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
                setUsers(updatedUsers);
            }
        }
        setCurrentUser(userStillExists);
      } else {
        localStorage.removeItem('vokalita_session');
      }
    }
  }, []);

  // --- UTILITY: UPDATE USER USAGE ---
  const incrementUsage = () => {
    if (currentUser && currentUser.role === 'demo') {
      const updatedUser = { ...currentUser, usageCount: (currentUser.usageCount || 0) + 1 };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      
      setUsers(updatedUsers);
      setCurrentUser(updatedUser);
      localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
      localStorage.setItem('vokalita_session', JSON.stringify(updatedUser));
    }
  };

  // --- AUTH FUNCTIONS ---
  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    setAuthError("");
    setAuthSuccess("");
    
    const formData = new FormData(e.target);
    const email = formData.get('email').toLowerCase();
    const password = formData.get('password');
    const fullName = formData.get('fullName');

    if (users.find(u => u.email === email)) {
      setAuthError("Email ini sudah terdaftar di sistem.");
      setIsLoadingAuth(false);
      return;
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      fullName,
      role: 'user',
      isApproved: false
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
    
    setTimeout(() => {
      setIsLoadingAuth(false);
      // Pesan sukses yang diperbarui dengan nomor HP profesional
      setAuthSuccess("Registrasi Berhasil! Akun Anda telah diterima dan sedang menunggu verifikasi. Untuk aktivasi cepat, silakan hubungi kami di 0813 2488 7391.");
      setAuthView('login');
      e.target.reset();
    }, 1500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    setAuthError("");
    setAuthSuccess("");

    const formData = new FormData(e.target);
    const email = formData.get('email').toLowerCase();
    const password = formData.get('password');

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      setAuthError("Kredensial salah. Periksa email dan password Anda.");
      setIsLoadingAuth(false);
      return;
    }

    if (user.role !== 'admin' && !user.isApproved) {
      setAuthError("Akses Ditolak: Akun Anda belum disetujui. Hubungi Admin di 0813 2488 7391 untuk aktivasi.");
      setIsLoadingAuth(false);
      return;
    }

    if (user.role === 'demo') {
        const today = new Date().toLocaleDateString();
        if (user.lastUsageDate !== today) {
            user.usageCount = 0;
            user.lastUsageDate = today;
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            setUsers(updatedUsers);
            localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
        }
    }

    setTimeout(() => {
      setCurrentUser(user);
      localStorage.setItem('vokalita_session', JSON.stringify(user));
      setIsLoadingAuth(false);
    }, 1000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminPanel(false);
    localStorage.removeItem('vokalita_session');
  };

  const toggleApproval = (userId) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) return { ...u, isApproved: !u.isApproved };
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
    if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, isApproved: !currentUser.isApproved });
    }
  };

  const deleteUser = (userId) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('vokalita_users', JSON.stringify(updatedUsers));
  };

  // --- CORE APP LOGIC ---
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    } else if (cooldown === 0 && (errorType === "minute" || errorType === "quota")) {
      setErrorMessage(""); 
      setErrorType("");
    }
    return () => clearInterval(timer);
  }, [cooldown, errorType]);

  const generateScript = async () => {
    if (!productDesc || !usp || cooldown > 0) return;
    if (currentUser?.role === 'demo' && (currentUser.usageCount || 0) >= 5) {
      setErrorType("quota");
      setErrorMessage("Kuota harian demo habis. Akun demo dibatasi 5x generate per hari.");
      return;
    }

    setIsGeneratingScript(true);
    setGeneratedScript("");
    setErrorMessage("");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Buatkan naskah Voice Over iklan profesional Bahasa Indonesia. Produk: ${productDesc}. Keunggulan: ${usp}. Format: Naskah bersih tanpa markdown.` }] }]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) { setCooldown(60); setErrorType("minute"); throw new Error("Limit pemrosesan tercapai."); }
        throw new Error("Gagal terhubung ke server AI.");
      }
      setGeneratedScript(data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "");
      incrementUsage();
    } catch (error) { setErrorMessage(error.message); } finally { setIsGeneratingScript(false); }
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
    if (currentUser?.role === 'demo' && (currentUser.usageCount || 0) >= 5) {
        setErrorType("quota");
        setErrorMessage("Kuota harian demo habis. Akun demo dibatasi 5x generate per hari.");
        return;
    }

    setIsGeneratingAudio(true);
    setAudioUrl(null);
    setErrorMessage("");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Ucapkan: ${generatedScript}` }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } } }
        })
      });
      const result = await response.json();
      if (!response.ok) { 
        if (response.status === 429) { setErrorType("daily"); throw new Error("BATAS HARIAN TERCAPAI."); } 
        throw new Error("Gagal render audio."); 
      }
      const base64 = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const binary = atob(base64);
        const pcm = new Int16Array(binary.length / 2);
        for (let i = 0; i < pcm.length; i++) pcm[i] = (binary.charCodeAt(i * 2 + 1) << 8) | binary.charCodeAt(i * 2);
        setAudioUrl(URL.createObjectURL(pcmToWav(pcm, 24000)));
        incrementUsage();
      }
    } catch (error) { setErrorMessage(error.message); } finally { setIsGeneratingAudio(false); }
  };

  const downloadAudio = () => {
    const link = document.createElement('a'); link.href = audioUrl; link.download = `vokalita-${Date.now()}.wav`; link.click();
  };

  // --- RENDER VIEWS ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-indigo-900/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-[#D4AF37]/5 blur-[150px] rounded-full"></div>
        </div>

        <div className="max-w-md w-full z-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col items-center gap-4">
             <div className="w-14 h-14 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-lg flex items-center justify-center shadow-2xl">
                <Mic2 className="w-7 h-7 text-[#D4AF37]" />
             </div>
             <div className="text-center">
               <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">Vokalita</h1>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">Portal Akses AI Sound Lab</p>
             </div>
          </div>

          <div className="bg-[#0A0D14] border border-white/5 p-8 rounded-xl shadow-2xl space-y-8">
            <div className="flex bg-[#05070A] p-1 rounded-lg border border-white/5">
              <button onClick={() => {setAuthView('login'); setAuthError(""); setAuthSuccess("")}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${authView === 'login' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Masuk</button>
              <button onClick={() => {setAuthView('register'); setAuthError(""); setAuthSuccess("")}} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${authView === 'register' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Daftar</button>
            </div>

            <form onSubmit={authView === 'login' ? handleLogin : handleRegister} className="space-y-6">
              {authView === 'register' && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input name="fullName" required placeholder="Contoh: Gusti Dewa" className="w-full bg-[#05070A] border border-white/5 rounded-lg py-4 pl-12 pr-4 text-base outline-none focus:border-[#D4AF37]/30 transition-all text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input name="email" type="email" required placeholder="nama@email.com" className="w-full bg-[#05070A] border border-white/5 rounded-lg py-4 pl-12 pr-4 text-base outline-none focus:border-[#D4AF37]/30 transition-all text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input name="password" type="password" required placeholder="••••••••" className="w-full bg-[#05070A] border border-white/5 rounded-lg py-4 pl-12 pr-4 text-base outline-none focus:border-[#D4AF37]/30 transition-all text-white" />
                </div>
              </div>

              {authError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest text-center animate-pulse leading-relaxed">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-[10px] font-bold uppercase tracking-widest text-center leading-relaxed">
                  {authSuccess}
                </div>
              )}

              <button disabled={isLoadingAuth} className="w-full relative h-16 rounded-lg overflow-hidden group shadow-2xl disabled:opacity-50">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%]"></div>
                <div className="relative h-full flex items-center justify-center gap-3 text-black font-black text-[11px] uppercase tracking-[0.3em]">
                  {isLoadingAuth ? <Loader2 className="animate-spin w-4 h-4" /> : (authView === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                  {isLoadingAuth ? 'Sedang Memproses...' : (authView === 'login' ? 'Masuk Sekarang' : 'Buat Akun Baru')}
                </div>
              </button>
            </form>
            
            <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">Akses Cepat Demo:</p>
                <p className="text-[9px] text-slate-400 font-mono text-center mt-2">demo@vokalita.com | pass: demo123</p>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">© 2026 Vokalita Sound Lab</p>
        </div>
      </div>
    );
  }

  // --- MAIN APP COMPONENT ---
  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans selection:bg-[#D4AF37]/30 overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-indigo-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-[#D4AF37]/5 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <nav className="border-b border-white/5 bg-[#05070A]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-[#0A0D14] border border-[#D4AF37]/30 rounded-md flex items-center justify-center">
                <Mic2 className="w-5 h-5 text-[#D4AF37]" />
             </div>
             <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Vokalita</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser.role === 'demo' && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-md">
                    <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Quota: {5 - (currentUser.usageCount || 0)} / 5</span>
                </div>
            )}
            
            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${showAdminPanel ? 'bg-white text-black border-white' : 'text-[#D4AF37] border-[#D4AF37]/30 hover:border-[#D4AF37]'}`}
              >
                <Users className="w-4 h-4" /> {showAdminPanel ? 'Tutup Panel' : 'Kelola User'}
              </button>
            )}
            <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>
            <div className="hidden md:flex flex-col text-right">
               <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">{currentUser.fullName}</span>
               <span className="text-[8px] text-[#D4AF37] font-bold uppercase tracking-widest mt-1">{currentUser.role === 'admin' ? 'Master Admin' : currentUser.role === 'demo' ? 'Demo Access' : 'Premium Member'}</span>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* ADMIN PANEL VIEW */}
      {showAdminPanel && currentUser.role === 'admin' && (
        <section className="max-w-5xl mx-auto w-full px-6 py-12 z-10 relative">
          <div className="bg-[#0A0D14] border border-white/5 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <div>
                  <h3 className="text-xl font-black text-white uppercase italic">Manajemen Pengguna</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gunakan panel ini untuk memberikan akses ke akun baru.</p>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#05070A] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">
                    <th className="px-8 py-5">Identitas Member</th>
                    <th className="px-8 py-5">Role</th>
                    <th className="px-8 py-5">Status Akses</th>
                    <th className="px-8 py-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-white">{u.fullName}</span>
                           <span className="text-[10px] text-slate-500 font-mono tracking-tight">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${u.role === 'admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : u.role === 'demo' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded inline-flex items-center gap-1.5 ${u.isApproved ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.isApproved ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></div>
                          {u.isApproved ? 'Aktif (ACC)' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'admin' && (
                            <>
                              <button 
                                onClick={() => toggleApproval(u.id)}
                                className={`w-8 h-8 rounded flex items-center justify-center transition-all ${u.isApproved ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                title={u.isApproved ? "Nonaktifkan" : "Berikan Akses (ACC)"}
                              >
                                {u.isApproved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => deleteUser(u.id)}
                                className="w-8 h-8 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all"
                                title="Hapus Akun"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* MAIN GENERATOR VIEW */}
      {!showAdminPanel && (
        <>
          <section className="relative pt-12 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 z-10 text-center">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[9px] md:text-[10px] font-black text-[#D4AF37] uppercase tracking-widest shadow-2xl animate-fade-in">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                Artificial Intelligence Sound Technology
              </div>
              <div className="space-y-4 md:space-y-8">
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[1] text-white uppercase italic animate-slide-up">
                  Vokalita, <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F9E498] via-[#D4AF37] to-[#8C6B1F]">Standar Baru Voice Over Berbasis AI</span>
                </h2>
                <div className="text-[9px] md:text-[11px] text-[#D4AF37] font-black uppercase tracking-[0.4em] opacity-80 animate-fade-in -mt-2 md:-mt-4">
                  Design & Developed By : Gusti Dewa Anggading
                </div>
                <p className="text-base md:text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed font-light px-4 animate-fade-in delay-200">
                  Vokalita adalah platform AI Voice Over yang menggunakan bank suara manusia untuk menghasilkan audio yang natural, profesional, dan terdengar seperti suara manusia asli untuk berbagai kebutuhan konten dan bisnis.
                </p>
              </div>
            </div>
          </section>

          <section id="generator" className="max-w-7xl mx-auto px-4 md:px-6 pb-20 z-10 relative w-full">
            {showResourceInfo && (
              <div className="mb-12 max-w-4xl mx-auto bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-5 rounded-lg flex items-center gap-4 group hover:border-[#D4AF37]/30 transition-all shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-md flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-[#D4AF37]" />
                 </div>
                 <div className="flex-1 text-left pr-8">
                   <h6 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1">Resource Optimization Mode</h6>
                   <p className="text-[11px] md:text-[12px] text-slate-500 leading-relaxed font-medium">
                     Vokalita beroperasi menggunakan pemrosesan High-Fidelity. Untuk performa terbaik, sistem menerapkan antrian otomatis saat trafik padat. Hubungi <span className="text-white border-b border-white/20 font-bold">mail.sidewa@gmail.com</span> untuk akses tanpa batas.
                   </p>
                 </div>
                 <button onClick={() => setShowResourceInfo(false)} className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors">
                   <X className="w-4 h-4" />
                 </button>
              </div>
            )}

            {errorMessage && (
              <div className={`mb-8 max-w-4xl mx-auto border p-4 md:p-6 rounded-lg flex items-start gap-4 shadow-2xl animate-in zoom-in duration-300 ${errorType === "daily" || errorType === "quota" ? "bg-red-500/10 border-red-500/20" : "bg-indigo-500/10 border-indigo-500/20"}`}>
                 <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${errorType === "daily" || errorType === "quota" ? "bg-red-500/10" : "bg-indigo-500/10"}`}>
                    {errorType === "daily" || errorType === "quota" ? <Calendar className="w-5 h-5 text-red-400" /> : <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />}
                 </div>
                 <div className="flex-1 text-left">
                   <h6 className={`text-[10px] font-black uppercase tracking-widest mb-1 flex justify-between ${errorType === "daily" || errorType === "quota" ? "text-red-300" : "text-indigo-300"}`}>
                     System Status 
                     {cooldown > 0 && errorType === "minute" && <span>Ready in {cooldown}s</span>}
                     {(errorType === "daily" || errorType === "quota") && <span>Limit Reached</span>}
                   </h6>
                   <p className={`text-[12px] md:text-[13px] leading-relaxed font-bold uppercase ${errorType === "daily" || errorType === "quota" ? "text-red-400" : "text-slate-300"}`}>
                     {errorMessage}
                   </p>
                 </div>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6 md:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6 md:space-y-8 order-1">
                <div className="bg-[#0A0D14] border border-[#D4AF37]/10 p-6 md:p-10 rounded-lg shadow-2xl space-y-8">
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                      <span className="w-6 h-6 md:w-7 md:h-7 bg-[#D4AF37] text-black rounded-sm flex items-center justify-center text-[10px]">1</span>
                      Konsep Campaign
                    </h4>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deskripsi Produk</label>
                       <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Tuliskan produk Anda..." className="w-full h-32 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none" />
                    </div>
                  </div>
                  <div className="space-y-4 text-left">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Keunggulan Utama</label>
                       <textarea value={usp} onChange={(e) => setUsp(e.target.value)} placeholder="Apa yang membedakan produk Anda?" className="w-full h-24 bg-[#05070A] border border-slate-800 rounded-md p-4 text-base text-slate-300 focus:border-[#D4AF37]/50 outline-none transition-all resize-none" />
                     </div>
                  </div>
                  <button onClick={generateScript} disabled={!productDesc || !usp || isGeneratingScript || (cooldown > 0 && errorType === "minute")} className="w-full relative h-14 md:h-16 rounded-md overflow-hidden group shadow-lg disabled:opacity-30 active:scale-95 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] via-[#F9E498] to-[#D4AF37] animate-shimmer bg-[length:200%_100%]"></div>
                    <div className="relative h-full flex items-center justify-center gap-3 text-[#05070A] font-black text-[11px] md:text-[12px] uppercase tracking-[0.3em]">
                      {isGeneratingScript ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-4 h-4 fill-current" /> Generate AI Script</>}
                    </div>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2">
                <div className="bg-[#0A0D14] border border-white/5 p-6 md:p-10 rounded-lg shadow-2xl space-y-8">
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                      <span className="w-6 h-6 md:w-7 md:h-7 bg-white text-black rounded-sm flex items-center justify-center text-[10px]">3</span>
                      Review Naskah
                    </h4>
                    <textarea value={generatedScript} onChange={(e) => setGeneratedScript(e.target.value)} placeholder="Hasil analisis AI akan tampil di sini..." className="w-full h-48 md:h-52 bg-[#05070A] border border-slate-800 rounded-md p-4 md:p-8 text-base font-mono leading-relaxed resize-none transition-all text-white outline-none focus:border-[#D4AF37]/30" />
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
                        <span className="text-[8px] text-slate-600 font-medium leading-none italic">Power volume.</span>
                      </div>
                      <input type="range" min="0" max="100" value={volume} onChange={(e)=>setVolume(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                    </div>
                    <div className="space-y-4 text-left">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Pitch</span><span className="text-[#D4AF37] font-mono">{pitch}</span></div>
                        <span className="text-[8px] text-slate-600 font-medium leading-none italic">Tinggi rendah.</span>
                      </div>
                      <input type="range" min="-20" max="20" value={pitch} onChange={(e)=>setPitch(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                    </div>
                    <div className="space-y-4 text-left">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>Timing</span><span className="text-[#D4AF37] font-mono">{speed}x</span></div>
                        <span className="text-[8px] text-slate-600 font-medium leading-none italic">Tempo vokal.</span>
                      </div>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e)=>setSpeed(e.target.value)} className="w-full h-1 bg-slate-800 accent-[#D4AF37] cursor-pointer" />
                    </div>
                  </div>
                  <button onClick={generateAudio} disabled={!generatedScript || isGeneratingAudio || (cooldown > 0 && errorType === "minute")} className="w-full py-4 md:py-5 bg-white text-[#05070A] font-black text-[11px] md:text-[12px] uppercase tracking-[0.4em] rounded-md flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-2xl disabled:opacity-20">
                    {isGeneratingAudio ? <Loader2 className="animate-spin" /> : <><Activity className="w-4 h-4 fill-current" /> Initialize Render</>}
                  </button>
                  {audioUrl && (
                    <div className="flex flex-col gap-4 p-4 md:p-8 bg-[#05070A] border border-[#D4AF37]/20 rounded-md animate-in slide-in-from-bottom-2 duration-500">
                      <audio ref={audioRef} src={audioUrl} controls className="w-full h-8 invert brightness-110 contrast-125 opacity-70" />
                      <button onClick={downloadAudio} className="w-full py-4 border border-[#D4AF37] text-[#D4AF37] font-black text-[10px] uppercase tracking-[0.2em] rounded-md hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">Mastering & Download</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

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
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 md:py-20 bg-[#030508] relative z-10 mt-auto">
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