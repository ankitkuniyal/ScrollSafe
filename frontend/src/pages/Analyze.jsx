import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, XCircle, Info, Search } from 'lucide-react';

export default function Analyze({ isDark }) {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!claim.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/fact-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ claim: claim.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to the fact-checking API. Ensure backend is running.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred while analyzing the text.');
    } finally {
      setLoading(false);
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

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-12 py-10 flex flex-col items-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 w-full"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">
          Analyze <span className="text-gradient">Text</span>
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Paste any suspicious quote, news snippet, or claim below, and let ScrollSafe instantly cross-reference its authenticity.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full glass-card p-2 md:p-4 mb-10"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Paste text here... (e.g. 'Researchers are buzzing today following a controversial report stating that drinking purely alkaline water completely prevents all forms of viral infections.')"
            className={`w-full h-48 md:h-56 p-6 rounded-xl bg-background border ${isDark ? 'border-white/10' : 'border-black/10'} focus:border-accent outline-none resize-none text-lg text-primary placeholder-muted/60 transition-colors shadow-inner`}
            required
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading || !claim.trim()}
              className="px-8 py-3.5 rounded-full bg-primary text-background font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg flex items-center justify-center gap-2 min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={20} className="text-background" />
                  Verify Truth
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
            className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4"
          >
            <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-500 mb-1">Analysis Failed</h3>
              <p className="text-red-500/80">{error}</p>
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
                <div className="font-semibold text-primary text-xl">{result.confidence || 'Medium'}</div>
              </div>
            </div>
            
            <div className="p-8 md:p-10">
              <h3 className="text-xl font-bold text-primary mb-4">Explanation</h3>
              <p className="text-lg leading-relaxed text-muted mb-8">
                {result.explanation || 'No further explanation provided by the fact-checking API.'}
              </p>
              
              <div className={`flex items-center justify-between pt-6 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <ShieldCheck size={16} className="text-green-500" />
                  <span>Verified by ScrollSafe AI Engine</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
