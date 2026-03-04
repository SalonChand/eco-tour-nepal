import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MountainSnow, ShoppingBag, CalendarDays, MapPin, Tag, Image as ImageIcon, BadgeCheck, Phone, Mail, Star, Send } from 'lucide-react';

const PublicProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ⭐ NEW: Star Rating States
  const [sellerReviews, setSellerReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const[hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const[isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${id}`),
          axios.get(`http://localhost:5000/api/reviews/seller/${id}`) // ⭐ Fetch Seller Reviews!
        ]);
        setProfileData(profileRes.data);
        setSellerReviews(reviewsRes.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user profile.');
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

  // ⭐ Submit 5-Star Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to leave a review!");
    if (rating === 0) return alert("Please select a star rating!");

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/reviews/seller', {
        seller_id: id, reviewer_id: user.id, rating, comment: reviewComment
      });
      // Refresh the reviews list instantly
      const updatedReviews = await axios.get(`http://localhost:5000/api/reviews/seller/${id}`);
      setSellerReviews(updatedReviews.data);
      setRating(0); setReviewComment('');
    } catch (err) { alert("Failed to post review."); }
    setIsSubmitting(false);
  };

  // 🧮 Calculate Average Rating
  const averageRating = sellerReviews.length > 0 
    ? (sellerReviews.reduce((acc, curr) => acc + curr.rating, 0) / sellerReviews.length).toFixed(1) 
    : 0;

  if (loading) return <div className="text-center mt-32 text-xl font-bold text-slate-400 dark:text-slate-500 animate-pulse">Loading Profile...</div>;
  if (error || !profileData) return <div className="text-center mt-32 text-xl text-rose-500">Profile not found!</div>;

  const { user: profileUser, tours, products } = profileData;
  const joinDate = new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 font-sans transition-colors duration-500">
      
      {/* Hero Cover */}
      <div className="w-full h-64 bg-gradient-to-r from-emerald-800 to-slate-900 relative">
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20">
        
        {/* User Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 relative overflow-hidden transition-colors">
          
          {profileUser.profile_pic && profileUser.profile_pic !== 'default.png' ? (
            <img src={`http://localhost:5000${profileUser.profile_pic}`} alt={profileUser.username} className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover shrink-0 relative -mt-16 md:mt-0 bg-white" />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 bg-emerald-600 rounded-full border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-white text-6xl font-black shrink-0 relative -mt-16 md:mt-0">
              {profileUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                {profileUser.username}
                {profileUser.is_verified ? <BadgeCheck className="w-8 h-8 text-emerald-500" title="Verified by Eco Tour Nepal" /> : null}
              </h1>
              <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full mt-2 md:mt-0 ${profileUser.role === 'guide' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                {profileUser.role === 'guide' ? 'Verified Guide / Seller' : 'Community Member'}
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400 font-medium mb-6 mt-3">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Joined {joinDate}</span>
              {/* ⭐ RATING BADGE */}
              {sellerReviews.length > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500 font-black bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-800/50">
                  <Star className="w-4 h-4 fill-amber-500" /> {averageRating} ({sellerReviews.length} Reviews)
                </span>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {profileUser.bio ? `"${profileUser.bio}"` : "A verified member of the Eco Tour Nepal community."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Inventory */}
          <div className="lg:col-span-2 space-y-12">
            {/* Created Tours */}
            {tours.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <MountainSnow className="w-6 h-6 text-emerald-600" /> Adventures by {profileUser.username}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tours.map((tour) => (
                    <div key={tour.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition duration-300 group">
                      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {tour.image_url ? <img src={`http://localhost:5000${tour.image_url}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <ImageIcon className="w-10 h-10 text-slate-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                        <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs font-black px-2 py-1 rounded shadow-sm">{tour.difficulty}</span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 mb-2 group-hover:text-emerald-600 transition">{tour.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4"><MapPin className="w-4 h-4" /> {tour.location}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">Rs. {tour.price}</span>
                          <Link to={`/tours/${tour.id}`} className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition">View Details</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created Products */}
            {products.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <ShoppingBag className="w-6 h-6 text-indigo-600" /> Local Shop Items
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition duration-300 group">
                      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {product.image_url ? <img src={`http://localhost:5000${product.image_url}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <ImageIcon className="w-10 h-10 text-slate-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />}
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 mb-4 group-hover:text-indigo-600 transition">{product.title}</h3>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-4">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">Rs. {product.price}</span>
                          <Link to={`/shop`} className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-2 rounded-lg transition">View in Shop</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: ⭐ REVIEWS SECTION */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 md:p-8 sticky top-28 transition-colors">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" /> Reviews & Trust
              </h2>

              {/* Leave a Review Form */}
              {user && user.id !== parseInt(id) && (
                <form onSubmit={handleSubmitReview} className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">Rate your experience:</p>
                  
                  {/* Interactive Star Selector */}
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${star <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>

                  <textarea 
                    required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} 
                    placeholder="Share details about your experience with this seller..." 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-amber-400 outline-none text-slate-700 dark:text-slate-200 text-sm mb-3 resize-none transition-colors"
                    rows="3"
                  ></textarea>
                  
                  <button type="submit" disabled={isSubmitting || rating === 0} className="w-full bg-slate-900 dark:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-500 dark:hover:bg-amber-400 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-md">
                    <Send className="w-4 h-4"/> Submit Review
                  </button>
                </form>
              )}

              {/* Review List */}
              <div className="space-y-6">
                {sellerReviews.length === 0 ? (
                  <p className="text-center text-slate-500 dark:text-slate-400 italic">No reviews yet.</p>
                ) : (
                  sellerReviews.map(review => (
                    <div key={review.id} className="group">
                      <div className="flex items-center gap-3 mb-2">
                        {review.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${review.profile_pic}`} className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-black shrink-0">{review.reviewer_name.charAt(0).toUpperCase()}</div>}
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-800 dark:text-white text-sm">{review.reviewer_name}</span>
                            {review.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                          <div className="flex gap-0.5 mt-0.5">
                            {/* Draw solid vs empty stars based on the rating number */}
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'}`} />
                            ))}
                            <span className="text-[10px] text-slate-400 ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed pl-13">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicProfile;