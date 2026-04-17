import { useState, useRef } from 'react';
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
  FileAudio
} from 'lucide-react';

export default function Analyze({ isDark }) {
  const [mode, setMode] = useState('text'); // 'text', 'image', 'audio'
  const [imageSubMode, setImageSubMode] = useState('url'); // 'url', 'upload'
  const [audioSubMode, setAudioSubMode] = useState('record'); // 'record', 'upload'
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'image' && imageSubMode === 'url' && !content.trim()) return;
    if (mode === 'image' && imageSubMode === 'upload' && !preview) return;
    if (mode === 'audio' && !audioBlob) return;

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
    } else {
      const payload = {};
      if (mode === 'text') payload.claim = content.trim();
      if (mode === 'image') {
        payload.imageUrl = content.trim();
      }
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(payload);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze. Please check your input.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        // For the sake of the demo, we'll inform the user that remote analysis needs a URL
        setError("Note: Google Lens analysis requires a public URL. Local file upload is captured, but please provide a URL for a full verification.");
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setPreview(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setAudioBlob(null);
      setPreview(null);
    } catch (err) {
      setError('Failed to access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'false': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'partial': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'context': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true': return <CheckCircle2 size={32} className="text-green-500" />;
      case 'false': return <XCircle size={32} className="text-red-500" />;
      case 'partial': return <AlertTriangle size={32} className="text-yellow-500" />;
      case 'context': return <Info size={32} className="text-blue-500" />;
      default: return <ShieldCheck size={32} className="text-neutral-500" />;
    }
  };

  const modes = [
    { id: 'text', label: 'Analyze Text', icon: <TypeIcon size={18} /> },
    { id: 'image', label: 'Verify Image', icon: <ImageIcon size={18} /> },
    { id: 'audio', label: 'Verify Audio', icon: <Mic size={18} /> }
  ];

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-10 flex flex-col items-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">
          Verify <span className="text-gradient">Reality</span>
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          ScrollSafe uses AI and real-time news to fact-check the digital world.
        </p>
      </motion.div>

      {/* Primary Mode Tabs */}
      <div className={`flex p-1 gap-1 rounded-2xl mb-8 border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'}`}>
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setContent(''); setResult(null); setError(null); setPreview(null); setAudioBlob(null); }}
            className={`flex items-center gap-2 px-6 md:px-10 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === m.id 
                ? 'bg-primary text-background shadow-lg text-lg' 
                : 'text-muted hover:bg-primary/10'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full glass-card p-2 md:p-4 mb-10"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {mode === 'text' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste text here... (e.g. 'Is drinking alkaline water beneficial?')"
              className={`w-full h-48 md:h-56 p-6 rounded-xl bg-background border ${isDark ? 'border-white/10' : 'border-black/10'} focus:border-accent outline-none resize-none text-lg text-primary placeholder-muted/60 transition-colors shadow-inner`}
              required
            />
          ) : mode === 'image' ? (
            <div className="flex flex-col gap-6">
              {/* Image Sub-Mode Toggle */}
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => { setImageSubMode('url'); setContent(''); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${imageSubMode === 'url' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-white/5'}`}
                >
                  <LinkIcon size={14} /> Image URL
                </button>
                <button
                  type="button"
                  onClick={() => { setImageSubMode('upload'); setContent(''); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${imageSubMode === 'upload' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-white/5'}`}
                >
                  <Upload size={14} /> Upload Image
                </button>
              </div>

              {imageSubMode === 'url' ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="url"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste Image URL here... (e.g. 'https://example.com/photo.jpg')"
                    className={`w-full p-6 rounded-xl bg-background border ${isDark ? 'border-white/10' : 'border-black/10'} focus:border-accent outline-none text-lg text-primary placeholder-muted/60 transition-colors shadow-inner`}
                    required
                  />
                  <div className="px-2 text-xs text-muted/60 flex items-center gap-1.5 font-medium">
                    <ImageIcon size={12} /> Enter a valid, publicly accessible image URL for Google Lens analysis
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-accent/50 hover:bg-white/5'}`}
                >
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                  {preview ? (
                    <div className="flex flex-col items-center gap-3">
                       <img src={preview} alt="Preview" className="h-24 rounded-lg shadow-lg border border-white/20" />
                       <span className="text-sm font-bold text-accent">Image Selected. Click to change.</span>
                    </div>
                  ) : (
                    <>
                      <FileImage size={40} className="text-muted mb-4" />
                      <span className="text-lg font-bold text-primary">Upload Image</span>
                      <span className="text-sm text-muted">Click to browse or drag and drop</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Audio Sub-Mode Toggle */}
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => { setAudioSubMode('record'); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${audioSubMode === 'record' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-white/5'}`}
                >
                  <Mic size={14} /> Record Audio
                </button>
                <button
                  type="button"
                  onClick={() => { setAudioSubMode('upload'); setError(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${audioSubMode === 'upload' ? 'bg-accent/20 text-accent border border-accent/30' : 'text-muted hover:bg-white/5'}`}
                >
                  <Upload size={14} /> Upload Audio
                </button>
              </div>

              {audioSubMode === 'record' ? (
                <div className="w-full h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center transition-all bg-background">
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <Mic size={32} className="text-red-500" />
                      </div>
                      <span className="text-lg font-bold text-red-500">Recording...</span>
                      <button type="button" onClick={stopRecording} className="px-6 py-2 bg-red-500 text-white rounded-full font-bold flex items-center gap-2 hover:bg-red-600 transition-colors">
                        <Square size={16} fill="currentColor" /> Stop
                      </button>
                    </div>
                  ) : preview && audioBlob ? (
                    <div className="flex flex-col items-center gap-4 w-full px-8">
                      <audio src={preview} controls className="w-full max-w-md" />
                      <button type="button" onClick={startRecording} className="px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full font-bold flex items-center gap-2 hover:bg-primary/30 transition-colors">
                        <Mic size={16} /> Record Again
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <button type="button" onClick={startRecording} className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-background">
                        <Mic size={32} />
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-primary">Tap to Record</span>
                        <span className="text-sm text-muted">Speak the claim you want to fact-check</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => audioInputRef.current.click()}
                  className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${preview ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-accent/50 hover:bg-white/5'}`}
                >
                  <input type="file" ref={audioInputRef} hidden accept="audio/*" onChange={handleAudioFileChange} />
                  {preview && audioBlob ? (
                    <div className="flex flex-col items-center gap-3 w-full px-8">
                       <audio src={preview} controls className="w-full max-w-md" onClick={(e) => e.stopPropagation()} />
                       <span className="text-sm font-bold text-accent">Audio Selected. Click container to change.</span>
                    </div>
                  ) : (
                    <>
                      <FileAudio size={40} className="text-muted mb-4" />
                      <span className="text-lg font-bold text-primary">Upload Audio File</span>
                      <span className="text-sm text-muted">Click to browse or drag and drop</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading || isRecording || (mode === 'text' && !content.trim()) || (mode === 'image' && imageSubMode === 'url' && !content.trim()) || (mode === 'image' && imageSubMode === 'upload' && !preview) || (mode === 'audio' && !audioBlob)}
              className="px-8 py-3.5 rounded-full bg-primary text-background font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg flex items-center justify-center gap-2 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={20} className="text-background" />
                  Verify {mode === 'text' ? 'Truth' : mode === 'audio' ? 'Audio Context' : 'Image Context'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`w-full ${error.includes('Note:') ? 'bg-primary/5 border-primary/10' : 'bg-red-500/10 border-red-500/20'} rounded-2xl p-6 flex items-start gap-4 mb-4`}
          >
            {error.includes('Note:') ? <Info size={24} className="text-primary shrink-0 mt-0.5" /> : <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" />}
            <div>
              <h3 className={`font-bold ${error.includes('Note:') ? 'text-primary' : 'text-red-500'} mb-1`}>{error.includes('Note:') ? 'Notice' : 'Analysis Failed'}</h3>
              <p className={error.includes('Note:') ? 'text-muted/80' : 'text-red-500/80'}>{error}</p>
            </div>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`w-full rounded-3xl overflow-hidden flex flex-col shadow-2xl border ${isDark ? 'border-white/10 bg-surface/80' : 'border-black/5 bg-white'}`}
          >
            <div className={`px-8 py-6 flex items-center justify-between border-b ${isDark ? 'bg-[#111] border-white/5' : 'bg-neutral-50 border-black/5'}`}>
              <div className="flex items-center gap-4">
                {getVerdictIcon(result.verdict)}
                <div>
                  <div className="text-sm font-medium text-muted mb-0.5 uppercase tracking-wider">Verdict</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getVerdictColor(result.verdict)}`}>
                    {(result.verdict || 'Uncertain').toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted mb-0.5 uppercase tracking-wider">Confidence</div>
                <div className="font-semibold text-primary text-xl">{result.confidence !== undefined ? `${result.confidence}%` : 'Medium'}</div>
              </div>
            </div>
            
            <div className="p-8 md:p-10">
              <h3 className="text-xl font-bold text-primary mb-2">Refined Claim Context</h3>
              <div className="p-4 rounded-xl bg-primary/5 text-muted italic mb-6 border border-primary/10">
                "{result.claim}"
              </div>

              <h3 className="text-xl font-bold text-primary mb-3">ScrollSafe Verdict</h3>
              <p className="text-lg leading-relaxed text-muted mb-8">
                {result.explanation || 'No further explanation provided by the fact-checking API.'}
              </p>
              
              <div className={`flex items-center justify-between pt-6 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <ShieldCheck size={16} className="text-green-500" />
                  <span>Verified by ScrollSafe Multimodal AI</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
