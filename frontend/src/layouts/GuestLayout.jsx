import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Coins } from 'lucide-react';

const GuestLayout = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-gold-500/20 selection:text-gold-500 flex flex-col justify-between">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-gold-500 animate-pulse" />
            <span className="font-sans font-bold tracking-widest text-gold-500 text-lg uppercase">Ganesh Jewellers</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            <a href="/#about" className="hover:text-gold-400 transition-colors">About Us</a>
            <a href="/#features" className="hover:text-gold-400 transition-colors">Features</a>
            <a href="/#rates" className="hover:text-gold-400 transition-colors">Gold Rates</a>
            <a href="/#contact" className="hover:text-gold-400 transition-colors">Contact</a>
          </nav>

          {/* Portal Access Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link 
                to={isAdmin ? "/admin/dashboard" : "/customer/dashboard"}
                className="px-4.5 py-2.5 gold-btn-gradient text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-gold-500/20 active:scale-95 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="px-4 py-2 border border-slate-800 hover:border-gold-500 text-slate-300 hover:text-gold-500 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
>
                  Sign In
                </Link>
                <Link 
                  to="/register"
                  className="hidden sm:inline-block px-4 py-2 gold-btn-gradient text-slate-950 text-xs font-extrabold uppercase tracking-wider rounded-lg hover:shadow-lg hover:shadow-gold-500/20 transition-all"
                >
                  Join Scheme
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 bg-slate-950/60 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold-500" />
            <span className="font-sans font-bold tracking-widest text-gold-500 text-sm uppercase">Ganesh Jewellers</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Ganesh Jewellers Ltd. All Gold Savings Schemes are subject to company terms and conditions.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default GuestLayout;
