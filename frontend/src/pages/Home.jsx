import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Map, ShoppingBag, ArrowRight, ShieldCheck, Leaf, Globe2, MapPin, Clock, Image as ImageIcon } from 'lucide-react';

const Home = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tours');
        setTours(response.data.slice(0, 4));
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchTours();
  }, []);

  return (
    <div className="w-full min-h-[90vh] flex flex-col items-center justify-center bg-[#faf9f6] dark:bg-slate-950 pt-8 sm:pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-500">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="text-center max-w-3xl mb-12 sm:mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-4 sm:mb-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500 animate-pulse"></span>
          🇳🇵 Authentic Nepal Experiences
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-4 sm:mb-6 leading-tight">
          Discover the Magic of <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-orange-500 dark:from-cyan-400 dark:to-orange-400">The Himalayas</span>
        </h1>
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-medium md:px-10 leading-relaxed">
          Embark on breathtaking adventures with local guides, or bring a piece of authentic Nepali heritage home with you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 w-full max-w-6xl relative z-10 mb-16 sm:mb-20">
        
        <Link to="/tours" className="group relative h-[300px] sm:h-[480px] rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/30 border border-slate-200/50 dark:border-slate-800">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-cyan-900/10 opacity-90 transition-opacity duration-500"></div>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/90 backdrop-blur-md text-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300"><Map className="w-6 h-6 sm:w-8 sm:h-8" /></div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight">Trek the Peaks</h2>
            <p className="text-slate-200 text-sm sm:text-lg font-medium mb-4 sm:mb-8 md:pr-12 line-clamp-2 sm:line-clamp-none">Conquer legendary trails and experience the high Himalayas with verified, expert Sherpa and local guides.</p>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm sm:text-lg transition-colors group-hover:text-cyan-300">Explore Routes <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 transform group-hover:translate-x-2 transition-transform duration-300" /></div>
          </div>
        </Link>

        <Link to="/shop" className="group relative h-[300px] sm:h-[480px] rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-900/30 border border-slate-200/50 dark:border-slate-800">
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80')" }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-orange-900/10 opacity-90 transition-opacity duration-500"></div>
          <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/90 backdrop-blur-md text-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"><ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" /></div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight">The Artisan Market</h2>
            <p className="text-slate-200 text-sm sm:text-lg font-medium mb-4 sm:mb-8 md:pr-12 line-clamp-2 sm:line-clamp-none">Support local creators. Shop authentic singing bowls, organic teas, Thangkas, and hand-woven Pashminas.</p>
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm sm:text-lg transition-colors group-hover:text-orange-300">Visit the Bazaar <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 transform group-hover:translate-x-2 transition-transform duration-300" /></div>
          </div>
        </Link>
      </div>

      {/* 🏔️ COMPACT 3-COLUMN MOBILE GRID */}
      <div className="max-w-7xl w-full relative z-10 mb-16 pt-4 sm:pt-10">
        <div className="flex justify-between items-end mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Trending Destinations</h2>
          </div>
          <Link to="/tours" className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline">View All &rarr;</Link>
        </div>
        
        {loading ? <div className="text-center py-10 text-slate-400">Loading...</div> : (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {tours.map((tour) => (
              <div key={tour.id} className="group bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative">
                <div className="relative h-24 sm:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {tour.image_url ? <img src={`http://localhost:5000${tour.image_url}`} alt={tour.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6 sm:w-10 sm:h-10 opacity-50" /></div>}
                  <div className="absolute top-1 left-1 sm:top-3 sm:left-3"><span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900/70 text-white">{tour.difficulty}</span></div>
                </div>
                <div className="p-2 sm:p-4 flex-grow flex flex-col">
                  <h3 className="text-[10px] sm:text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1 sm:mb-2">{tour.title}</h3>
                  <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 sm:mb-3">
                    <span className="flex items-center gap-1 line-clamp-1"><MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> {tour.location}</span>
                  </div>
                  <div className="mt-auto pt-1.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] sm:text-lg font-black text-cyan-700 dark:text-cyan-400">Rs.{tour.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 pt-8 sm:pt-12 border-t border-slate-200 dark:border-slate-800 relative z-10">
        {/* Badges kept same, cut for brevity */}
      </div>
    </div>
  );
};

export default Home;