import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Filter, ArrowRight, Image as ImageIcon, Heart, X, Map } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';

const ExploreTours = () => {
  const { user } = useContext(AuthContext);
  const { formatPrice } = useContext(CurrencyContext);
  
  const[tours, setTours] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All'); // 📍 NEW: Region Filter

  useEffect(() => {
    const fetchData = async () => {
      try {
        const toursRes = await axios.get('http://localhost:5000/api/tours');
        setTours(toursRes.data);
        if (user) {
          const wishRes = await axios.get(`http://localhost:5000/api/wishlist/${user.id}`);
          setWishlist(wishRes.data.map(item => item.tour_id).filter(id => id !== null));
        }
        setLoading(false);
      } catch (err) { setError('Failed to load tours.'); setLoading(false); }
    };
    fetchData();
  }, [user]);

  const handleHeartClick = async (e, tourId, tourName) => {
    e.preventDefault(); 
    if (!user) return alert("Please log in to save adventures! ❤️");
    try {
      const res = await axios.post('http://localhost:5000/api/wishlist/toggle', { user_id: user.id, tour_id: tourId, item_name: tourName });
      if (res.data.isHearted) setWishlist([...wishlist, tourId]);
      else setWishlist(wishlist.filter(id => id !== tourId));
    } catch (err) {}
  };

  // 📍 UPGRADED FILTER LOGIC
  const filteredTours = tours.filter((tour) => {
    const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || tour.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || tour.difficulty === difficultyFilter;
    const matchesRegion = regionFilter === 'All' || tour.region === regionFilter;
    return matchesSearch && matchesDifficulty && matchesRegion;
  });

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 transition-colors duration-500 font-sans">
      
      <div className="bg-slate-900 dark:bg-black py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-900/20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Explore the Himalayas</h1>
          <p className="text-sm md:text-base text-cyan-100 font-medium">Find your next great eco-friendly adventure.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* 🔍 UPGRADED: STICKY SEARCH & FILTER BAR */}
        <div className="sticky top-[85px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 sm:p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-2 items-center -mt-6 mb-8 transition-colors duration-500 mx-2 sm:mx-0">
          
          <div className="w-full md:w-1/2 relative flex items-center group">
            <Search className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-emerald-500 transition-colors" />
            <input type="text" placeholder="Search destination..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>}
          </div>

          <div className="w-full md:w-1/4 relative flex items-center">
            <Map className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm appearance-none">
              <option value="All">All Regions</option>
              <option value="Everest Region">Everest Region</option>
              <option value="Annapurna Region">Annapurna Region</option>
              <option value="Kathmandu Valley">Kathmandu Valley</option>
              <option value="Chitwan / Lumbini">Chitwan / Lumbini</option>
              <option value="Langtang Region">Langtang Region</option>
            </select>
          </div>

          <div className="w-full md:w-1/4 relative flex items-center">
            <Filter className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm appearance-none">
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy Level</option>
              <option value="Moderate">Moderate Level</option>
              <option value="Hard">Hard Level</option>
            </select>
          </div>

        </div>

        {loading && <p className="text-center text-slate-500 dark:text-slate-400 text-sm sm:text-xl py-10 font-bold animate-pulse">Fetching amazing tours...</p>}
        {error && <p className="text-center text-rose-500 text-sm sm:text-xl py-10">{error}</p>}

        {!loading && filteredTours.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed transition-colors mx-2 sm:mx-0">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-bold mb-2">No adventures found</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">Try searching for a different location.</p>
            <button onClick={() => { setSearchTerm(''); setDifficultyFilter('All'); setRegionFilter('All'); }} className="mt-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-6 py-2 rounded-full font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition text-sm">Clear Filters</button>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6 px-1 sm:px-0">
          {filteredTours.map((tour) => {
            const isHearted = wishlist.includes(tour.id);
            return (
              <div key={tour.id} className="group bg-white dark:bg-slate-900 rounded-lg sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col sm:hover:-translate-y-1 relative">
                
                <button onClick={(e) => handleHeartClick(e, tour.id, tour.title)} className="absolute top-1 right-1 sm:top-3 sm:right-3 z-10 p-1 sm:p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-white shadow-sm transition">
                  <Heart className={`w-3 h-3 sm:w-5 sm:h-5 transition-colors ${isHearted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-slate-500 hover:text-rose-500'}`} />
                </button>

                <div className="relative h-24 sm:h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {tour.image_url ? <img src={`http://localhost:5000${tour.image_url}`} alt={tour.title} className="w-full h-full object-cover sm:group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-6 h-6 sm:w-12 sm:h-12 opacity-50" /></div>}
                  <div className="absolute top-1 left-1 sm:top-3 sm:left-3"><span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md bg-slate-900/70 text-white">{tour.difficulty}</span></div>
                </div>
                
                <div className="p-2 sm:p-4 flex-grow flex flex-col">
                  <h3 className="text-[10px] sm:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 sm:group-hover:text-emerald-600 transition-colors mb-1 sm:mb-2">{tour.title}</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-0.5 sm:gap-3 text-[8px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 sm:mb-3">
                    <span className="flex items-center gap-1 line-clamp-1"><MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 text-emerald-500" /> {tour.region}</span>
                  </div>
                  
                  <p className="hidden sm:block text-slate-600 dark:text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">{tour.description}</p>
                  
                  <div className="mt-auto pt-1.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
                    <div>
                      <span className="hidden sm:block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Price</span>
                      <span className="text-[10px] sm:text-lg font-black text-emerald-700 dark:text-emerald-400">{formatPrice(tour.price)}</span>
                    </div>
                    <Link to={`/tours/${tour.id}`} className="flex items-center justify-center w-5 h-5 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full sm:group-hover:bg-emerald-600 sm:group-hover:text-white transition-colors"><ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" /></Link>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default ExploreTours;