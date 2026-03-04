import { Link } from 'react-router-dom';
import { MountainSnow, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto py-6 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <MountainSnow className="w-6 h-6 text-emerald-500" />
          <span className="text-lg font-black text-white tracking-tight">Eco Tour Nepal</span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
          <Link to="/tours" className="hover:text-emerald-400 transition">Explore Trips</Link>
          <Link to="/shop" className="hover:text-emerald-400 transition">Local Shop</Link>
          <Link to="/chat" className="hover:text-emerald-400 transition">Community Chat</Link>
          <Link to="/register" className="hover:text-emerald-400 transition">Become a Guide</Link>
        </div>

        {/* Copyright */}
        <div className="text-sm flex items-center gap-1.5 font-medium">
          &copy; {new Date().getFullYear()} Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> in Nepal
        </div>

      </div>
    </footer>
  );
};

export default Footer;