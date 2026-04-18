import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Menu, X, Sun, Moon, PlayCircle } from 'lucide-react';
import Home from './pages/Home';
import Analyze from './pages/Analyze';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
          <Link to="/" className="flex items-center gap-3 group cursor-pointer">
            <img src="/favicon.svg" className="w-9 h-auto transition-transform group-hover:scale-105" alt="logo" />
            <span className="font-bold text-2xl tracking-tight text-primary">ScrollSafe</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            {location.pathname === '/' ? (
              <>
                <a href="#demo" className="text-sm font-medium px-4 py-1.5 text-muted rounded hover:text-primary transition-all hover:-translate-y-0.5 flex items-center gap-1.5">
                  <PlayCircle size={14} /> Demo
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">How it Works</a>
                <a href="#features" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Features</a>
                <a href="#pricing" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Pricing</a>

              </>
            ) : (
              <>
                <Link to="/#demo" className="text-sm font-medium px-4 py-1.5 text-muted rounded hover:text-primary transition-all hover:-translate-y-0.5 flex items-center gap-1.5">
                  <PlayCircle size={14} /> Demo
                </Link>
                <Link to="/#how-it-works" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">How it Works</Link>
                <Link to="/#features" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Features</Link>
                <Link to="/#pricing" className="text-sm font-medium text-muted hover:text-primary transition-all hover:-translate-y-0.5">Pricing</Link>

              </>
            )}
            <Link to="/analyze" className={`text-sm font-medium transition-all hover:-translate-y-0.5 ${location.pathname === '/analyze' ? 'text-primary' : 'text-muted hover:text-primary'}`}>
              Analyzer
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-surfaceBorder transition-all"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a 
              href="https://chromewebstore.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-background transition-all duration-300 ease-out bg-primary rounded-full shadow-md hover:scale-105"
            >
              Add to Chrome
              <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-24 px-6 pb-6 border-b border-surfaceBorder shadow-xl">
          <div className="flex flex-col gap-6 text-lg">
            <Link to="/" className="font-semibold text-primary" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/analyze" className="font-semibold text-primary" onClick={() => setMobileMenuOpen(false)}>Text Analyzer</Link>
            <div className="w-full h-px bg-surfaceBorder"></div>
            <a 
              href="https://chrome.google.com/webstore/devconsole"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-primary text-background rounded-xl font-bold flex items-center justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Add to Chrome <ChevronRight size={18} className="ml-1" />
            </a>
          </div>
        </div>
      )}

      <main className="relative z-10 pt-32 md:pt-48 pb-20 min-h-[80vh]">
        <Routes>
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/analyze" element={<Analyze isDark={isDark} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-surfaceBorder bg-surface relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src="/favicon.svg" className="w-6 h-auto" alt="logo" />
                <span className="font-bold text-xl text-primary">ScrollSafe</span>
              </div>
              <p className="text-sm text-muted leading-relaxed">
                Protecting your mind against misinformation with unparalleled precision.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-primary mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted">
                <li><a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Download Extension</a></li>
                <li><Link to="/analyze" className="hover:text-primary transition-colors">Text Analyzer</Link></li>
                <li><Link to="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
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
