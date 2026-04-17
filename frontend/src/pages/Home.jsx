import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Zap, 
  Lock, 
  Globe, 
  ShieldAlert,
  MousePointer2,
  Cpu,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home({ isDark }) {
  const [demoState, setDemoState] = useState(0); 

  useEffect(() => {
    const intervals = [3000, 1000, 2000, 4000];
    let timeout;
    
    const runDemo = (currentState) => {
      timeout = setTimeout(() => {
        const nextState = (currentState + 1) % 4;
        setDemoState(nextState);
        runDemo(nextState);
      }, intervals[currentState]);
    };

    runDemo(0);
    return () => clearTimeout(timeout);
  }, []);

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 text-center flex flex-col items-center pt-10 md:pt-16">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-surfaceBorder bg-surface/60 backdrop-blur-md text-[10px] font-bold text-muted mb-10 tracking-widest uppercase shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          ScrollSafe 1.0 is now live
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[0.9] text-primary"
        >
          Cut Through Noise.<br className="hidden md:block" />
          <span className="text-gradient">
            Find the Truth.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="text-lg md:text-2xl text-muted max-w-3xl mx-auto mb-12 leading-relaxed font-light"
        >
          The silent browser extension that instantly analyzes highlighted text to combat misinformation. Navigate the web with absolute confidence.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto"
        >
          <Link to="/analyze" className="group relative px-9 py-4 rounded-full bg-primary text-background font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2">
            <ShieldCheck size={20} className="group-hover:text-accent transition-colors" /> 
            Try the Analyzer
          </Link>
          <button 
            onClick={scrollToHowItWorks}
            className="group px-9 py-4 rounded-full bg-surface border border-surfaceBorder text-primary font-bold text-base transition-all duration-300 hover:bg-surfaceBorder flex items-center justify-center gap-2 shadow-lg"
          >
            <PlayCircle size={20} className="text-muted group-hover:text-primary transition-colors" />
            See How It Works 
          </button>
        </motion.div>

        {/* Interactive Browser Demo */}
        <motion.div 
          id="demo"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="mt-24 w-full max-w-5xl border border-surfaceBorder rounded-3xl bg-surface backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-surfaceBorder scroll-mt-32 transition-colors"
        >
          {/* Aligned Premium Demo Header */}
          <div className="flex items-center px-6 py-4 border-b border-surfaceBorder bg-surfaceBorder/10 backdrop-blur-md">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 opacity-80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-amber-400 opacity-80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-green-400 opacity-80 shadow-sm" />
            </div>
            <div className="flex-1 flex justify-center px-4">
              <div className={`border ${isDark ? 'border-white/10 bg-black/40' : 'border-black/5 bg-black/5'} rounded-full px-6 py-1.5 text-xs font-mono text-muted flex items-center gap-2 w-full max-w-sm shadow-inner transition-colors`}>
                <Lock size={12} className="text-green-500" />
                <span className="truncate opacity-80 font-bold">health-news-daily.com<span className="opacity-40">/article</span></span>
              </div>
            </div>
          </div>
          
          <div className={`p-10 md:p-16 text-left relative transition-colors ${isDark ? 'bg-[#050505]' : 'bg-white'}`}>
            <h2 className={`text-3xl md:text-5xl font-serif font-black mb-6 tracking-tight transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
              New Study Claims Miracle Cure Discovered
            </h2>
            <div className={`space-y-6 text-lg md:text-xl leading-relaxed font-serif max-w-3xl transition-colors ${isDark ? 'text-neutral-400' : 'text-neutral-700'}`}>
              <p>
                Researchers are buzzing today following a controversial report. According to the recently leaked internal document, <span className={`transition-all duration-700 rounded px-1.5 py-0.5 ${demoState >= 1 ? 'bg-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : ''}`}>drinking purely alkaline water completely prevents all forms of viral infections</span> inside the human body.
              </p>
              <p className="opacity-60 text-base md:text-lg italic">
                While independent experts remain incredibly skeptical of the methodology, thousands of readers are already rushing to modify their water supply systems in hopes of securing immediate immunity.
              </p>
            </div>

            {/* Fact Check Popover */}
            <AnimatePresence>
              {demoState >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(4px)' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                  className={`absolute top-[200px] left-[60px] md:left-[120px] w-80 md:w-96 ${isDark ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'} border backdrop-blur-xl rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.3)] overflow-hidden text-sm z-20 font-sans transition-all`}
                >
                  {demoState === 2 ? (
                    <div className="p-8 flex items-center justify-center gap-4 text-muted">
                      <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                      <span className="font-bold tracking-tight uppercase text-[10px]">Analyzing via ScrollSafe...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className={`bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center gap-3`}>
                        <ShieldAlert size={18} className="text-red-500" />
                        <span className="font-black text-red-500 uppercase tracking-widest text-[10px]">False Claim Detected</span>
                      </div>
                      <div className="p-6">
                        <p className={`text-sm leading-relaxed mb-6 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                          The claim that alkaline water prevents viral infections has been debunked by the WHO. It has zero proven effect on viral combat.
                        </p>
                        <div className={`flex items-center justify-between text-[10px] pt-4 border-t ${isDark ? 'border-white/10 text-neutral-500' : 'border-black/5 text-neutral-400'}`}>
                          <span className="flex items-center gap-2 font-bold uppercase tracking-tighter hover:text-primary transition-colors cursor-default">
                             <CheckCircle2 size={12} className="text-green-500" /> WHO Verified
                          </span>
                          <a href="#" className="font-black text-accent hover:text-accent/80 transition-colors uppercase tracking-widest">Learn More</a>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 md:px-12 mt-48 scroll-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-primary tracking-tighter">How ScrollSafe Works</h2>
          <p className="text-muted max-w-2xl mx-auto text-lg md:text-xl font-light">Verification in three elegant, non-intrusive steps.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Connecting Line Desktop */}
          <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-surfaceBorder to-transparent z-0 opacity-50" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center text-center group"
          >
            <div className="w-32 h-32 rounded-3xl bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:rotate-6 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              <MousePointer2 size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">Select Info</h3>
            <p className="text-muted text-base leading-relaxed px-4 opacity-80">
              Highlight any suspicious claim directly in your browser. No extra tabs required.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative z-10 flex flex-col items-center text-center group"
          >
            <div className="w-32 h-32 rounded-3xl bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:-rotate-6 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              <Cpu size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">AI Analysis</h3>
            <p className="text-muted text-base leading-relaxed px-4 opacity-80">
              Our background engine cross-references thousands of verified repositories in milliseconds.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="relative z-10 flex flex-col items-center text-center group"
          >
            <div className="w-32 h-32 rounded-3xl bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:rotate-6 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]">
              <ShieldCheck size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">Scroll Safe</h3>
            <p className="text-muted text-base leading-relaxed px-4 opacity-80">
               Get immediate, cited verdicts and continue browsing with peace of mind.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 mt-48 scroll-mt-32 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter text-primary">Uncompromising Security.</h2>
          <p className="text-muted max-w-2xl mx-auto text-lg font-light">Advanced algorithms running securely and privately in your environment.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-10 group hover:shadow-2xl transition-all duration-500 border-none ring-1 ring-surfaceBorder hover:ring-accent/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <Zap size={32} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">Instant Context</h3>
            <p className="text-muted text-base leading-relaxed font-medium">
              Real-time processing ensures you get the truth before you reach the next paragraph. Completely seamless integration.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-10 group hover:shadow-2xl transition-all duration-500 border-none ring-1 ring-surfaceBorder hover:ring-accent/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <Search size={32} className="text-purple-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">Deep Nuance</h3>
            <p className="text-muted text-base leading-relaxed font-medium">
               Identifies satire, specific context, and historical precedents to move beyond simple 'True' or 'False' indicators.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-10 group hover:shadow-2xl transition-all duration-500 border-none ring-1 ring-surfaceBorder hover:ring-accent/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Globe size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black mb-4 text-primary tracking-tight">Cited Evidence</h3>
            <p className="text-muted text-base leading-relaxed font-medium">
               Every verdict is backed by authoritative primary sources, global journals, and verified news outlets.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
