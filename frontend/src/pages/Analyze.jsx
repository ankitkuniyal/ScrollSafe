import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Search,
  Image as ImageIcon,
  Type as TypeIcon,
  Upload,
  Link as LinkIcon,
  FileImage,
  Mic,
  Square,
  FileAudio,
  Video as VideoIcon,
  Play
} from 'lucide-react';

export default function Analyze({ isDark }) {
  const [mode, setMode] = useState('text');
  const [imageSubMode, setImageSubMode] = useState('url');
  const [audioSubMode, setAudioSubMode] = useState('upload');
  const [videoSubMode, setVideoSubMode] = useState('url');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const resultRef = useRef(null);

  // Use standard window scroll with an exact offset so that the fixed navbar doesn't cover the result header
  useEffect(() => {
    if (result && !loading && resultRef.current) {
      setTimeout(() => {
        const yOffset = -100; // Account for the fixed nav bar
        const element = resultRef.current;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, 400);
    }
  }, [result, loading]);

  /* ── API ─────────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'image' && imageSubMode === 'url' && !content.trim()) return;
    if (mode === 'image' && imageSubMode === 'upload' && !preview) return;
    if (mode === 'audio' && !audioBlob) return;
    if (mode === 'video' && videoSubMode === 'url' && !content.trim()) return;
    if (mode === 'video' && videoSubMode === 'upload' && !videoBlob) return;

    setLoading(true);
    setResult(null);
    setError(null);

    let url = 'http://localhost:3000/api/fact-check';
    let options = { method: 'POST' };

    if (mode === 'audio') {
      url = 'http://localhost:3000/api/fact-check/audio';
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      options.body = formData;
    } else if (mode === 'video' && videoSubMode === 'upload') {
      url = 'http://localhost:3000/api/fact-check/video';
      const formData = new FormData();
      formData.append('video', videoBlob, 'video_upload.mp4');
      options.body = formData;
    } else if (mode === 'image' && imageSubMode === 'upload') {
      url = 'http://localhost:3000/api/fact-check';
      const formData = new FormData();
      formData.append('image', imageFile);
      options.body = formData;
    } else if (mode === 'video' && videoSubMode === 'url') {
      url = 'http://localhost:3000/api/fact-check/video';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ videoUrl: content.trim() });
    } else {
      const payload = {};
      if (mode === 'text') payload.claim = content.trim();
      if (mode === 'image' && imageSubMode === 'url') payload.imageUrl = content.trim();
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(payload);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze. Please check your input.');
      }
      setResult(await response.json());
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setError('Note: Google Lens analysis requires a public URL. Local file upload works for basic checks.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioBlob(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) {
        setError("Video file is too large. Please upload a file smaller than 30MB.");
        return;
      }
      setVideoBlob(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (ev) => { if (ev.data.size > 0) audioChunksRef.current.push(ev.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setAudioBlob(null);
      setPreview(null);
    } catch {
      setError('Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVerdictStyles = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true':      return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'false':     return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'uncertain': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:          return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true':      return <CheckCircle2 size={24} className="text-green-500" />;
      case 'false':     return <XCircle size={24} className="text-red-500" />;
      case 'uncertain': return <AlertTriangle size={24} className="text-yellow-500" />;
      default:          return <ShieldCheck size={24} className="text-neutral-500" />;
    }
  };

  const modes = [
    { id: 'text',  label: 'Text', icon: <TypeIcon  size={16} /> },
    { id: 'image', label: 'Image', icon: <ImageIcon size={16} /> },
    { id: 'audio', label: 'Audio',  icon: <Mic       size={16} /> },
    { id: 'video', label: 'Video',  icon: <VideoIcon size={16} /> },
  ];

  const isDisabled = loading || isRecording
    || (mode === 'text'  && !content.trim())
    || (mode === 'image' && imageSubMode === 'url'    && !content.trim())
    || (mode === 'image' && imageSubMode === 'upload' && !preview)
    || (mode === 'audio' && !audioBlob)
    || (mode === 'video' && videoSubMode === 'url'    && !content.trim())
    || (mode === 'video' && videoSubMode === 'upload' && !videoBlob);

  return (
    <div className="w-full flex justify-center pb-8 px-4 md:px-8 md:-mt-12">
      <div className="w-full max-w-6xl flex flex-col items-center">
        
        {/* Compact Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-surfaceBorder bg-surface/50 text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Real-Time Engine Active
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-primary">
            Verify <span className="text-gradient">Reality.</span>
          </h1>
          <p className="text-muted text-sm md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Cross-reference claims instantly using live news, historical records, and AI.
          </p>
        </motion.div>

        {/* Compact Pill Tabs */}
        <div className="flex p-1 gap-1 rounded-full mb-6 border border-surfaceBorder bg-surface shadow-sm transition-colors">
          {modes.map((m) => (
            <button key={m.id} type="button"
              onClick={() => { setMode(m.id); setContent(''); setResult(null); setError(null); setPreview(null); setAudioBlob(null); setVideoBlob(null); }}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${mode === m.id ? 'bg-primary text-background shadow-md' : 'text-muted hover:bg-surfaceBorder'}`}>
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Form Card: App Window Style */}
        <motion.div className="w-full max-w-5xl border border-surfaceBorder rounded-3xl bg-surface backdrop-blur-3xl shadow-xl overflow-hidden ring-1 ring-surfaceBorder/50 mb-6 transition-colors">
          <div className="bg-surfaceBorder/20 border-b border-surfaceBorder px-5 py-3 flex items-center justify-between relative">
            {/* Top Analysis Progress Bar */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                  className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-accent via-blue-500 to-accent bg-[length:200%_100%] z-50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
              )}
            </AnimatePresence>
            
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 opacity-80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400 opacity-80"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 opacity-80"></div>
            </div>
            <div className="text-[10px] font-mono text-muted/80 flex items-center gap-2 uppercase tracking-widest">
              <img src="/favicon.svg" className="w-3 h-auto" alt="logo" /> ScrollSafe Analyzer
            </div>
            <div className="w-12"></div>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 md:p-8 relative">
            {mode === 'text' && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste text here... (e.g. 'Is alkaline water beneficial?')"
                className="w-full h-32 p-5 rounded-2xl bg-background border border-surfaceBorder focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none text-base font-semibold text-primary placeholder-muted/50 transition-colors shadow-inner"
                required
              />
            )}

            {mode === 'image' && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={() => { setImageSubMode('url'); setContent(''); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${imageSubMode === 'url' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <LinkIcon size={12} /> Image URL
                  </button>
                  <button type="button" onClick={() => { setImageSubMode('upload'); setContent(''); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${imageSubMode === 'upload' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <Upload size={12} /> Upload
                  </button>
                </div>
                {imageSubMode === 'url' ? (
                  <input type="url" value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste Image URL here... (e.g. 'https://example.com/photo.jpg')"
                    className="w-full p-4 rounded-xl bg-background border border-surfaceBorder focus:border-accent outline-none text-sm font-semibold text-primary placeholder-muted/60 transition-colors shadow-inner"
                    required />
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-accent bg-accent/5' : 'border-surfaceBorder hover:border-accent/50 hover:bg-background/50'}`}>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    {preview ? (
                      <div className="flex items-center gap-4">
                         <img src={preview} alt="Preview" className="h-16 rounded shadow border border-surfaceBorder" />
                         <span className="text-xs font-bold text-accent">Change image</span>
                      </div>
                    ) : (
                      <>
                        <FileImage size={24} className="text-muted mb-2" />
                        <span className="text-sm font-bold text-primary">Upload Image</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === 'audio' && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={() => { setAudioSubMode('upload'); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${audioSubMode === 'upload' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <Upload size={12} /> Upload
                  </button>
                  <button type="button" onClick={() => { setAudioSubMode('record'); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${audioSubMode === 'record' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <Mic size={12} /> Record
                  </button>
                </div>
                {audioSubMode === 'record' ? (
                  <div className="w-full h-28 border-2 border-dashed border-surfaceBorder rounded-xl flex items-center justify-center bg-background">
                    {isRecording ? (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse"><Mic size={16} className="text-red-500" /></div>
                        <button type="button" onClick={stopRecording} className="px-4 py-1.5 bg-red-500 text-white rounded-full font-bold text-xs flex gap-2"><Square size={12} fill="currentColor" /> Stop</button>
                      </div>
                    ) : preview && audioBlob ? (
                      <div className="flex items-center gap-4 w-full px-6">
                        <audio src={preview} controls className="h-8 flex-1" />
                        <button type="button" onClick={startRecording} className="px-4 py-1.5 bg-primary/20 text-primary rounded-full font-bold text-xs"><Mic size={12} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={startRecording} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 text-background">
                        <Mic size={20} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div onClick={() => audioInputRef.current.click()} className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-accent bg-accent/5' : 'border-surfaceBorder hover:border-accent/50 hover:bg-background/50'}`}>
                    <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={handleAudioFileChange} />
                    {preview ? <span className="text-xs font-bold text-accent">Audio Selected. Change?</span> : <><FileAudio size={24} className="text-muted mb-2" /><span className="text-sm font-bold text-primary">Upload Audio</span></>}
                  </div>
                )}
              </div>
            )}

            {mode === 'video' && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={() => { setVideoSubMode('url'); setContent(''); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${videoSubMode === 'url' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <LinkIcon size={12} /> Video URL
                  </button>
                  <button type="button" onClick={() => { setVideoSubMode('upload'); setContent(''); setError(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${videoSubMode === 'upload' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-surfaceBorder/20'}`}>
                    <Upload size={12} /> Upload
                  </button>
                </div>
                {videoSubMode === 'url' ? (
                  <div className="flex flex-col gap-4">
                    <input type="url" value={content} onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste YouTube or Direct Video URL..."
                      className="w-full p-4 rounded-xl bg-background border border-surfaceBorder focus:border-accent outline-none text-sm font-semibold text-primary placeholder-muted/60 transition-colors shadow-inner"
                      required />
                    {getYouTubeId(content) && (
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-surfaceBorder shadow-lg">
                        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYouTubeId(content)}`} frameBorder="0" allowFullScreen></iframe>
                      </div>
                    )}
                  </div>
                ) : (
                  <div onClick={() => videoInputRef.current.click()} className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-accent bg-accent/5' : 'border-surfaceBorder hover:border-accent/50 hover:bg-background/50'}`}>
                    <input type="file" ref={videoInputRef} hidden accept="video/*" onChange={handleVideoFileChange} />
                    {preview && videoBlob ? (
                      <div className="flex items-center gap-4">
                         <video src={preview} className="h-16 rounded shadow border border-surfaceBorder" />
                         <span className="text-xs font-bold text-accent">Video Selected (${(videoBlob.size / (1024 * 1024)).toFixed(1)}MB)</span>
                      </div>
                    ) : (
                      <>
                        <VideoIcon size={24} className="text-muted mb-2" />
                        <span className="text-sm font-bold text-primary">Upload Video</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isDisabled}
                className="px-8 py-3 rounded-full bg-primary text-background font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg flex items-center gap-2 min-w-[160px] justify-center">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><Search size={18} /> Verify {mode === 'text' ? 'Truth' : mode === 'audio' ? 'Audio' : mode === 'video' ? 'Video' : 'Image'}</>}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Compact Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`w-full max-w-5xl ${error.includes('Note:') ? 'bg-primary/5 border-primary/10 text-primary' : 'bg-red-500/10 border-red-500/20 text-red-500'} rounded-xl p-4 flex items-center gap-3 mb-6 shadow-sm`}>
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Stack flow for Results (Popover-style) */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div ref={resultRef} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl overflow-hidden flex flex-col mb-12 rounded-3xl border border-surfaceBorder shadow-2xl bg-surface transition-colors">
              
              {/* Verdict Header Top Bar */}
              <div className={`px-6 md:px-8 py-5 flex items-center justify-between border-b border-surfaceBorder ${getVerdictStyles(result.verdict)}`}>
                <div className="flex items-center gap-3">
                  {getVerdictIcon(result.verdict)}
                  <span className="text-base md:text-lg font-bold tracking-tight uppercase">
                    {result.verdict?.toLowerCase() || 'uncertain'}
                  </span>
                </div>
                {result.confidence !== undefined && (
                  <div className="flex flex-col items-end opacity-90">
                    <span className="text-[10px] uppercase font-black opacity-75">Confidence</span>
                    <span className="text-lg font-black leading-none">{result.confidence}%</span>
                  </div>
                )}
              </div>

              {/* Vertical Stack Content */}
              <div className="p-6 md:p-10 flex flex-col gap-8 bg-surface">
                
                {/* 1. Main Explanation */}
                <p className="text-lg md:text-xl font-medium leading-relaxed font-serif text-primary">
                  {result.explanation || 'Detailed analysis is currently pending. Please check source records.'}
                </p>

                {/* 2. Web Evidence */}
                {result.sources?.news?.length > 0 && (
                  <div className="border-t border-surfaceBorder pt-8">
                    <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ShieldCheck size={14} className="text-accent" /> Verified Web Sources
                    </h3>
                    <div className="flex flex-col gap-3">
                      {result.sources.news.map((article, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-surfaceBorder bg-background/50 hover:bg-background transition-colors hover:border-accent">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{article.source} • {article.date}</span>
                             <span className="text-sm font-semibold text-primary line-clamp-2">{article.title}</span>
                          </div>
                          <a href={article.link} target="_blank" rel="noopener noreferrer" className="shrink-0 mt-2 sm:mt-0 text-xs font-bold bg-primary text-background px-4 py-2 rounded-full transition-transform hover:scale-105 active:scale-95 text-center">
                            Read Article
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Images */}
                {mode === 'image' && result.visualMatches?.length > 0 && (
                  <div className="border-t border-surfaceBorder pt-8">
                    <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ImageIcon size={14} className="text-accent" /> Visual Citations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.visualMatches.slice(0, 6).map((m, i) => (
                        <a key={i} href={m.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 rounded-2xl border border-surfaceBorder bg-background/50 hover:bg-background transition-colors hover:border-accent group">
                          <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-surfaceBorder relative">
                            <img src={m.thumbnail} alt={m.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <div className="flex flex-col gap-1.5 overflow-hidden">
                             <span className="text-[10px] font-bold text-accent uppercase tracking-widest truncate">
                               {m.source || (m.link ? m.link.split('/')[2]?.replace('www.', '') : 'Visual Reference')}
                             </span>
                             <span className="text-sm font-semibold text-primary line-clamp-2 leading-snug">{m.title || 'Untitled Image Match'}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
