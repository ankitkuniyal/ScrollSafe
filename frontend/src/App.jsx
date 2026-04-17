// eslint-disable-next-line no-unused-vars
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Zap, 
  Lock, 
  Globe, 
  ChevronRight,
  ShieldAlert,
  Menu,
  X,
  MousePointer2,
  Cpu,
  CheckCircle2,
  PlayCircle,
  Sun,
  Moon
} from 'lucide-react';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoState, setDemoState] = useState(0); 
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Default is light mode natively since isDark initializes to false.

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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

  const toggleTheme = () => setIsDark(!isDark);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='${isDark ? '%23ffffff' : '%23000000'}' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`;

  return (
    <div className="relative min-h-screen selection:bg-accent/30 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] w-[1200px] h-[600px] bg-accent/20 blur-[150px] rounded-[100%]" 
        />
        <div 
          className="absolute inset-0 transition-opacity duration-500" 
          style={{ 
            backgroundImage: gridSvg,
            maskImage: `linear-gradient(to bottom, ${isDark ? '#000' : 'rgba(0,0,0,0.8)'}, transparent 80%)`,
            WebkitMaskImage: `linear-gradient(to bottom, ${isDark ? '#000' : 'rgba(0,0,0,0.8)'}, transparent 80%)`
          }} 
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-navBg backdrop-blur-xl border-b border-surfaceBorder py-4 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center shadow-md shadow-accent/20 transition-transform group-hover:scale-105">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-primary">ScrollSafe</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-surfaceBorder transition-all"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-background transition-all duration-300 ease-out bg-primary rounded-full shadow-md hover:scale-105">
              Add to Chrome
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="text-muted hover:text-primary">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="text-muted hover:text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 md:pt-48 pb-20">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-surfaceBorder bg-surface/60 backdrop-blur-md text-xs font-medium text-muted mb-10 tracking-wide uppercase shadow-sm"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            ScrollSafe 1.0 is now live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl leading-[1.15] text-primary"
          >
            Fact check the internet <br className="hidden md:block" />
            <span className="text-gradient">
              in real-time.
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
            <button className="group relative px-9 py-4 rounded-full bg-primary text-background font-bold text-base transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2">
              <ShieldCheck size={20} className="group-hover:text-accent transition-colors" /> 
              Get Started — It's Free
            </button>
            <button 
              onClick={scrollToHowItWorks}
              className="group px-9 py-4 rounded-full bg-surface border border-surfaceBorder text-primary font-medium text-base transition-all duration-300 hover:bg-surfaceBorder flex items-center justify-center gap-2 shadow-sm"
            >
              <PlayCircle size={20} className="text-muted group-hover:text-primary transition-colors" />
              See How It Works 
            </button>
          </motion.div>

          {/* Interactive Browser Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
            className="mt-24 w-full max-w-5xl border border-surfaceBorder rounded-3xl bg-surface backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-surfaceBorder"
          >
            <div className="flex items-center px-6 py-4 border-b border-surfaceBorder bg-surface">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-sm opacity-80" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-sm opacity-80" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-sm opacity-80" />
              </div>
              <div className="flex-1 ml-4 mr-4 flex justify-center">
                <div className={`border ${isDark ? 'border-white/10 bg-black/40' : 'border-black/5 bg-black/5'} rounded-lg px-6 py-2 text-sm text-muted flex items-center gap-3 w-full max-w-lg shadow-inner transition-colors`}>
                  <Lock size={14} className="text-green-500" />
                  <span className="font-mono text-primary/80">health-news-daily.com<span className="opacity-50">/article</span></span>
                </div>
              </div>
            </div>
            
            <div className="p-10 md:p-16 text-left bg-white text-neutral-900 relative">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-black mb-6 tracking-tight">
                New Study Claims Miracle Cure Discovered
              </h2>
              <div className="space-y-6 text-lg md:text-xl text-neutral-700 leading-loose font-serif max-w-3xl">
                <p>
                  Researchers are buzzing today following a controversial report. According to the recently leaked internal document, <span className={`transition-all duration-500 rounded px-1 ${demoState >= 1 ? 'bg-blue-100 text-blue-900 shadow-[0_0_0_2px_rgba(59,130,246,0.3)]' : ''}`}>drinking purely alkaline water completely prevents all forms of viral infections</span> inside the human body.
                </p>
                <p className="text-neutral-500">
                  While independent experts remain incredibly skeptical of the methodology, thousands of readers are already rushing to modify their water supply systems in hopes of securing immediate immunity.
                </p>
              </div>

              {/* Fact Check Popover */}
              <AnimatePresence>
                {demoState >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(2px)' }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`absolute top-[200px] left-[60px] md:left-[120px] w-80 md:w-96 ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-black/10'} border rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden text-sm z-20 font-sans transition-colors`}
                  >
                    {demoState === 2 ? (
                      <div className="p-6 flex items-center justify-center gap-4 text-muted">
                        <div className="w-5 h-5 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                        <span className="font-medium">Cross-referencing database...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className={`bg-red-500/10 border-b border-red-500/20 px-5 py-4 flex items-center gap-3`}>
                          <ShieldAlert size={18} className="text-red-500" />
                          <span className="font-bold text-red-500">False Claim Detected</span>
                        </div>
                        <div className="p-6">
                          <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            The claim that alkaline water prevents viral infections has been widely debunked by global medical professionals and the WHO. Alkaline water has no scientifically proven combat effect on viruses.
                          </p>
                          <div className={`flex items-center justify-between text-xs pt-4 border-t ${isDark ? 'border-white/10 text-neutral-500' : 'border-black/5 text-neutral-400'}`}>
                            <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500" /> Source: World Health Organization</span>
                            <a href="#" className="font-medium text-accent hover:text-accent/80 transition-colors">Read Full Check</a>
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
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 md:px-12 mt-40">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary tracking-tight">How ScrollSafe Works</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg md:text-xl">Three incredibly simple steps to verify the truth online.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line Desktop */}
            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-surfaceBorder to-transparent z-0" />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-32 h-32 rounded-full bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:-translate-y-2">
                <MousePointer2 size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">1. Select Information</h3>
              <p className="text-muted text-base leading-relaxed px-4">
                Whenever you see a suspicious claim online, simply highlight the text using your mouse. No need to open a new tab.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-32 h-32 rounded-full bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:-translate-y-2">
                <Cpu size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">2. Instant Analysis</h3>
              <p className="text-muted text-base leading-relaxed px-4">
                Our lightweight background engine cross-references the highlighted text against thousands of trusted endpoints globally.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-32 h-32 rounded-full bg-surface border border-surfaceBorder flex items-center justify-center mb-8 shadow-xl transition-all duration-500 group-hover:border-accent group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:-translate-y-2">
                <ShieldCheck size={40} className="text-muted group-hover:text-accent transition-colors duration-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">3. Scroll Safely</h3>
              <p className="text-muted text-base leading-relaxed px-4">
                Receive an immediate tooltip containing the fact-checked verdict and a direct link to the cited highly-reputable source.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 mt-40">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-primary">Precision tools for <br className="md:hidden" />a cleaner internet</h2>
            <p className="text-muted max-w-2xl mx-auto text-lg">Our advanced algorithms run securely and privately in your browser.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-10 group hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Zap size={28} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Lightning Fast</h3>
              <p className="text-muted text-base leading-relaxed">
                Highlight text and get instantaneous context. Our optimized models process snippets in milliseconds without interrupting your workflow.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass-card p-10 group hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Search size={28} className="text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Context Aware</h3>
              <p className="text-muted text-base leading-relaxed">
                ScrollSafe doesn't just read words—it understands nuance, satire, and complex sentence structures to provide purely accurate verdicts.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card p-10 group hover:shadow-lg transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-8 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Globe size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Verifiable Sources</h3>
              <p className="text-muted text-base leading-relaxed">
                Every fact-check comes strictly with citations from accredited, highly reputable journals and global fact-checking organizations.
              </p>
            </motion.div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-surfaceBorder bg-surface relative z-10 mt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck size={24} className="text-accent" />
                <span className="font-bold text-xl text-primary">ScrollSafe</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Protecting your mind against misinformation with unparalleled precision.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Download Extension</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Supported Sources</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Report False Positive</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-16 pt-8 border-t border-surfaceBorder flex flex-col md:flex-row justify-between items-center text-sm text-muted">
            <p>© {new Date().getFullYear()} ScrollSafe, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-6 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Twitter (X)</a>
              <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
