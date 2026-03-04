import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ShoppingBag, Tag, Image as ImageIcon, Search, Filter, Heart, ShoppingCart, X, MapPin, Star, Gem, Sparkles, TrendingDown, Send } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext';
import { CartContext } from '../context/CartContext';

const Shop = () => {
  const { user } = useContext(AuthContext);
  const { formatPrice } = useContext(CurrencyContext);
  const { addToCart } = useContext(CartContext);
  
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]); 
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const[reviewModalProduct, setReviewModalProduct] = useState(null);
  const [productReviewsData, setProductReviewsData] = useState(null);
  const [selectedHype, setSelectedHype] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        if (Array.isArray(response.data)) {
          setProducts(response.data);
        }
        
        if (user) {
          const wishRes = await axios.get(`http://localhost:5000/api/wishlist/${user.id}`);
          if (Array.isArray(wishRes.data)) {
            setWishlist(wishRes.data.map(item => item.product_id).filter(id => id !== null));
          }
        }
        setLoading(false);
      } catch (err) { 
        setError('Failed to load products.'); 
        setLoading(false); 
      }
    };
    fetchProducts();
  }, [user]);

  const handleOpenReviews = async (product) => {
    setReviewModalProduct(product);
    try {
      const res = await axios.get(`http://localhost:5000/api/reviews/product/${product.id}`);
      setProductReviewsData(res.data);
    } catch (err) { console.error("Failed to load product reviews"); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to review!");
    if (!selectedHype) return alert("Please select a Hype Level!");
    
    setIsSubmittingReview(true);
    try {
      await axios.post('http://localhost:5000/api/reviews/product', {
        product_id: reviewModalProduct.id, user_id: user.id, hype_level: selectedHype, comment: reviewComment
      });
      const res = await axios.get(`http://localhost:5000/api/reviews/product/${reviewModalProduct.id}`);
      setProductReviewsData(res.data);
      setReviewComment(''); setSelectedHype(null);
    } catch (err) { alert("Failed to post review."); }
    setIsSubmittingReview(false);
  };

  const handleHeartClick = async (e, productId, productName) => {
    e.preventDefault();
    if (!user) return alert("Please log in to save items! ❤️");
    try {
      const res = await axios.post('http://localhost:5000/api/wishlist/toggle', { user_id: user.id, product_id: productId, item_name: productName });
      if (res.data.isHearted) setWishlist([...wishlist, productId]);
      else setWishlist(wishlist.filter(id => id !== productId));
    } catch (err) {}
  };

  const handleAddToCart = (product) => {
    if (!user) return alert("Please log in to shop!");
    addToCart(product);
  };

  // 🛡️ BULLET-PROOF FILTER LOGIC
  // If a product is missing a title or description, it will no longer crash the page!
  const filteredProducts = products.filter((p) => {
    const title = p?.title || '';
    const desc = p?.description || '';
    const search = searchTerm || '';

    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || desc.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p?.category === categoryFilter;
    const matchesRegion = regionFilter === 'All' || p?.region === regionFilter;
    return matchesSearch && matchesCat && matchesRegion;
  });

  const getHypeColor = (level) => {
    if (level === 'underrated' || level === 'Underrated') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    if (level === 'worth_it' || level === 'Worth It') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (level === 'overrated' || level === 'Overrated') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative font-sans transition-colors duration-500">
      
      {/* 📊 PRODUCT REVIEW MODAL */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2"><Star className="w-5 h-5 text-amber-400 fill-amber-400"/> Product Reviews</h3>
              <button onClick={() => {setReviewModalProduct(null); setProductReviewsData(null);}} className="hover:bg-white/20 p-1 rounded-full transition"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex gap-4 items-center shrink-0">
              {reviewModalProduct.image_url ? <img src={`http://localhost:5000${reviewModalProduct.image_url}`} className="w-16 h-16 rounded-xl object-cover shadow-sm" /> : <ShoppingBag className="w-10 h-10 text-slate-400"/>}
              <div>
                <h4 className="font-black text-xl text-slate-800 dark:text-white">{reviewModalProduct.title}</h4>
                {productReviewsData && productReviewsData.totalVotes > 0 && (
                  <span className={`inline-block px-2 py-0.5 text-xs font-black uppercase tracking-widest rounded-md mt-1 ${getHypeColor(productReviewsData.consensus)}`}>
                    Community Voted: {productReviewsData.consensus}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {productReviewsData && productReviewsData.totalVotes > 0 && (
                <div className="space-y-3 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-xs font-bold text-purple-600 dark:text-purple-400 text-right">Underrated</span>
                    <div className="flex-grow bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex"><div className="bg-purple-500" style={{ width: `${(productReviewsData.counts.underrated / productReviewsData.totalVotes) * 100}%` }}></div></div>
                    <span className="w-6 text-xs font-bold text-slate-400">{productReviewsData.counts.underrated}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right">Worth It</span>
                    <div className="flex-grow bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex"><div className="bg-emerald-500" style={{ width: `${(productReviewsData.counts.worthIt / productReviewsData.totalVotes) * 100}%` }}></div></div>
                    <span className="w-6 text-xs font-bold text-slate-400">{productReviewsData.counts.worthIt}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-24 text-xs font-bold text-rose-600 dark:text-rose-400 text-right">Overrated</span>
                    <div className="flex-grow bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex"><div className="bg-rose-500" style={{ width: `${(productReviewsData.counts.overrated / productReviewsData.totalVotes) * 100}%` }}></div></div>
                    <span className="w-6 text-xs font-bold text-slate-400">{productReviewsData.counts.overrated}</span>
                  </div>
                </div>
              )}

              {user && user.id !== reviewModalProduct.seller_id && (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 text-sm">Have you bought this? Vote now:</h4>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button type="button" onClick={() => setSelectedHype('underrated')} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedHype === 'underrated' ? 'bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/40 dark:border-purple-500 dark:text-purple-300 ring-2 ring-purple-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}><Gem className="w-5 h-5"/> <span className="text-[10px] font-bold uppercase">Underrated</span></button>
                    <button type="button" onClick={() => setSelectedHype('worth_it')} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedHype === 'worth_it' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}><Sparkles className="w-5 h-5"/> <span className="text-[10px] font-bold uppercase">Worth It</span></button>
                    <button type="button" onClick={() => setSelectedHype('overrated')} className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${selectedHype === 'overrated' ? 'bg-rose-100 border-rose-400 text-rose-700 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-300 ring-2 ring-rose-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}><TrendingDown className="w-5 h-5"/> <span className="text-[10px] font-bold uppercase">Overrated</span></button>
                  </div>
                  <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows="2" placeholder="Explain your vote..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 text-sm mb-3 resize-none"></textarea>
                  <button type="submit" disabled={isSubmittingReview || !selectedHype} className="w-full bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"><Send className="w-4 h-4"/> Publish Review</button>
                </form>
              )}

              <div className="space-y-4">
                {!productReviewsData ? <p className="text-center text-slate-400">Loading reviews...</p> : productReviewsData.reviews.length === 0 ? <p className="text-center text-slate-500 dark:text-slate-400 italic">No reviews yet.</p> : (
                  productReviewsData.reviews.map(review => (
                    <div key={review.id} className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-3">
                      {review.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${review.profile_pic}`} className="w-8 h-8 rounded-full object-cover shrink-0" /> : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-black shrink-0">{review.username.charAt(0).toUpperCase()}</div>}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{review.username}</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getHypeColor(review.hype_level)}`}>{review.hype_level.replace('_', ' ')}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{review.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛍️ Shop Hero Section */}
      <div className="bg-slate-900 dark:bg-black py-12 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20"></div>
        <div className="relative z-20 text-center px-4 w-full max-w-4xl mx-auto">
          <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 mx-auto mb-2 md:mb-3" />
          <h1 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-3 tracking-tight">Local Nepali Market</h1>
          <p className="text-sm md:text-base text-indigo-100 font-medium">Support local artisans. Buy authentic crafts.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* 🔍 Search Bar */}
        <div className="sticky top-[85px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 sm:p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 items-center -mt-6 mb-8 transition-colors duration-500 mx-2 sm:mx-0">
          <div className="w-full sm:w-1/2 relative flex items-center group">
            <Search className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 sm:pl-12 pr-8 sm:pr-10 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 text-slate-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>}
          </div>
          <div className="w-full sm:w-1/4 relative flex items-center">
            <MapPin className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm appearance-none">
              <option value="All">All Regions</option>
              <option value="Kathmandu Valley">Kathmandu Valley</option>
              <option value="Everest Region">Everest Region</option>
              <option value="Annapurna Region">Annapurna Region</option>
              <option value="Chitwan / Lumbini">Chitwan / Lumbini</option>
              <option value="Langtang Region">Langtang Region</option>
            </select>
          </div>
          <div className="w-full sm:w-1/4 relative flex items-center">
            <Filter className="absolute left-3 text-slate-400 dark:text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm appearance-none">
              <option value="All">All Categories</option>
              <option value="Handicrafts">Handicrafts & Arts</option>
              <option value="Clothing">Clothing & Pashmina</option>
              <option value="Food & Tea">Organic Food & Tea</option>
              <option value="Trekking Gear">Trekking Gear</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-center text-slate-500 dark:text-slate-400 text-sm sm:text-xl py-10 font-bold animate-pulse">Opening the shop...</p>}
        {error && <p className="text-center text-rose-500 text-xs sm:text-xl py-20">{error}</p>}

        {!loading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed transition-colors mx-2 sm:mx-0">
            <Search className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-bold mb-2">No items found</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">Try adjusting your search terms or category filter.</p>
            <button onClick={() => { setSearchTerm(''); setCategoryFilter('All'); setRegionFilter('All'); }} className="mt-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-6 py-2 rounded-full font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition text-sm">Clear Filters</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 px-1 sm:px-0">
          {filteredProducts.map((product) => {
            const isHearted = wishlist.includes(product.id);
            return (
              <div key={product.id} className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group relative">
                
                <button onClick={(e) => handleHeartClick(e, product.id, product.title)} className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1 sm:p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hover:scale-110 transition">
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isHearted ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400'}`} />
                </button>

                <button onClick={() => handleOpenReviews(product)} className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-600 transition shadow-sm">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> <span className="hidden sm:inline">Reviews</span>
                </button>

                <div className="relative h-32 sm:h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {product.image_url ? <img src={`http://localhost:5000${product.image_url}`} alt={product.title} className="w-full h-full object-cover sm:group-hover:scale-105 transition duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon className="w-8 h-8" /></div>}
                  <span className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1"><Tag className="w-2 h-2 sm:w-3 sm:h-3 text-indigo-500" /> <span className="hidden sm:inline">{product.category}</span></span>
                </div>
                
                <div className="p-3 sm:p-4 flex-grow flex flex-col">
                  <h3 className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-0.5 transition-colors">{product.title}</h3>
                  <span className="text-[8px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1 line-clamp-1"><MapPin className="w-2 h-2 sm:w-3 h-3 text-indigo-400" /> {product.region}</span>
                  <Link to={`/user/${product.seller_id}`} className="text-[9px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline mb-1 sm:mb-2 line-clamp-1">By {product.seller_name}</Link>
                  <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-2 flex-grow transition-colors">{product.description}</p>
                  
                  <div className="flex justify-between items-center sm:items-end border-t border-slate-100 dark:border-slate-800 pt-2 sm:pt-3 mt-auto transition-colors">
                    <span className="text-xs sm:text-lg font-black text-indigo-600 dark:text-indigo-400 transition-colors">{formatPrice(product.price)}</span>
                    
                    {user && user.id === product.seller_id ? (
                      <span className="text-[8px] sm:text-xs font-bold text-slate-400">Yours</span>
                    ) : (
                      <button onClick={() => handleAddToCart(product)} className="bg-slate-900 dark:bg-indigo-600 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg shadow-sm flex items-center justify-center hover:bg-indigo-600 transition">
                        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline ml-1 text-xs font-bold">Add</span>
                      </button>
                    )}
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

export default Shop;