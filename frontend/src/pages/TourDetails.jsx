import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; 
import L from 'leaflet'; 

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';

import { MapPin, Clock, Activity, ShieldCheck, ArrowLeft, Image as ImageIcon, X, Building, UserCheck, Phone, Mail, Minus, Plus, Users, CloudSun, ThermometerSun, Calendar as CalendarIcon, Zap, Wallet, Gem, Sparkles, TrendingDown, Send, Tag } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor:[12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const getWeatherDetails = (code) => {
  if (code === 0) return { emoji: '☀️', text: 'Clear Sky' };
  if (code === 1 || code === 2 || code === 3) return { emoji: '⛅', text: 'Partly Cloudy' };
  if (code === 45 || code === 48) return { emoji: '🌫️', text: 'Foggy' };
  if (code >= 51 && code <= 67) return { emoji: '🌧️', text: 'Rain' };
  if (code >= 71 && code <= 77) return { emoji: '❄️', text: 'Snow' };
  if (code >= 95) return { emoji: '⛈️', text: 'Thunderstorm' };
  return { emoji: '🌡️', text: 'Variable' };
};

const TourDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { formatPrice, currency } = useContext(CurrencyContext); 

  const[tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const[isProcessing, setIsProcessing] = useState(false);
  const[checkoutData, setCheckoutData] = useState({ fullName: '', phone: '', address: '' });
  const[travelers, setTravelers] = useState(1);
  const [lookingForBuddy, setLookingForBuddy] = useState(false); 
  const[paymentType, setPaymentType] = useState('full');

  // 🎟️ PROMO STATES
  const[promoCode, setPromoCode] = useState('');
  const[appliedPromo, setAppliedPromo] = useState(''); // Stores the code after it's validated!
  const [promoDiscount, setPromoDiscount] = useState(0); 
  const [promoMessage, setPromoMessage] = useState(null); 

  const[weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [mapCoords, setMapCoords] = useState(null); 

  const[bookingDate, setBookingDate] = useState(null); 
  const [bookedDates, setBookedDates] = useState([]); 
  const [buddies, setBuddies] = useState([]); 

  const[reviewsData, setReviewsData] = useState(null);
  const [newReviewText, setNewReviewText] = useState('');
  const [selectedHype, setSelectedHype] = useState(null);
  const[isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const [tourRes, datesRes, reviewsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/tours/${id}`),
          axios.get(`http://localhost:5000/api/tours/booked-dates/${id}`),
          axios.get(`http://localhost:5000/api/reviews/tour/${id}`) 
        ]);
        setTour(tourRes.data);
        setMapCoords({ lat: tourRes.data.latitude, lng: tourRes.data.longitude });
        setBookedDates(datesRes.data); 
        setReviewsData(reviewsRes.data);
        setLoading(false);
      } catch (err) { setError('Failed to load tour.'); setLoading(false); }
    };
    fetchTourData();
  }, [id]);

  useEffect(() => {
    if (tour && tour.latitude && tour.longitude) {
      const fetchWeather = async () => {
        try {
          const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${tour.latitude}&longitude=${tour.longitude}&current_weather=true`);
          const current = weatherRes.data.current_weather;
          const details = getWeatherDetails(current.weathercode);
          setWeather({ temp: Math.round(current.temperature), emoji: details.emoji, condition: details.text });
        } catch (err) {}
        setWeatherLoading(false);
      };
      fetchWeather();
    }
  }, [tour]);

  useEffect(() => {
    if (bookingDate && tour) {
      const offset = bookingDate.getTimezoneOffset();
      const localDateStr = new Date(bookingDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
      const fetchBuddies = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/tours/buddies/${tour.id}/${localDateStr}`);
          setBuddies(res.data);
        } catch(err) {}
      };
      fetchBuddies();
    } else { setBuddies([]); }
  },[bookingDate, tour]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please log in to review!");
    if (!selectedHype) return alert("Please select a Hype Level!");
    setIsSubmittingReview(true);
    try {
      await axios.post('http://localhost:5000/api/reviews/tour', { tour_id: id, user_id: user.id, hype_level: selectedHype, comment: newReviewText });
      const reviewsRes = await axios.get(`http://localhost:5000/api/reviews/tour/${id}`);
      setReviewsData(reviewsRes.data);
      setNewReviewText(''); setSelectedHype(null);
    } catch (err) { alert("Failed to post review."); }
    setIsSubmittingReview(false);
  };

  const getDayClassName = (date) => {
    const offset = date.getTimezoneOffset();
    const localDateStr = new Date(date.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    const todayStr = new Date(new Date().getTime() - (offset*60*1000)).toISOString().split('T')[0];
    if (localDateStr < todayStr) return 'text-slate-300 dark:text-slate-700 cursor-not-allowed'; 
    if (bookedDates.includes(localDateStr)) return 'custom-booked-date'; 
    return 'custom-available-date';
  };

  const handleDateChange = (date) => {
    if (!date) return;
    const offset = date.getTimezoneOffset();
    const localDateStr = new Date(date.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    if (bookedDates.includes(localDateStr)) {
      alert("❌ This date is already fully booked by another group! Please choose a Green date.");
      setBookingDate(null);
    } else { setBookingDate(date); }
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await axios.post('http://localhost:5000/api/promo/validate', { code });
      setPromoDiscount(res.data.discount_percent);
      setAppliedPromo(code); // 🧠 SAVE VALID CODE
      setPromoMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setPromoDiscount(0); setAppliedPromo('');
      setPromoMessage({ type: 'error', text: err.response?.data?.message || 'Invalid code.' });
    }
  };

  let surgePercent = 0; let surgeReason = "";
  if (bookingDate) {
    const month = bookingDate.getMonth() + 1; 
    const diffTime = bookingDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (month === 3 || month === 4 || month === 10 || month === 11) { surgePercent = 15; surgeReason = "Peak Season in Nepal"; } 
    else if (diffDays <= 3 && diffDays >= 0) { surgePercent = 10; surgeReason = "Last-Minute Booking"; }
  }

  const basePrice = tour ? Number(tour.price) : 0;
  const subtotal = basePrice * travelers;
  const surgeAmount = (subtotal * surgePercent) / 100;
  const priceWithSurge = subtotal + surgeAmount;

  let groupDiscountPercent = 0;
  if (travelers >= 5) groupDiscountPercent = 10;
  else if (travelers >= 3) groupDiscountPercent = 5;
  const groupDiscountAmount = (priceWithSurge * groupDiscountPercent) / 100;
  
  const promoDiscountAmount = (priceWithSurge * promoDiscount) / 100;
  const finalTotalNPR = Math.round(priceWithSurge - groupDiscountAmount - promoDiscountAmount);
  const depositAmountNPR = Math.round(finalTotalNPR * 0.30); 
  const amountToCharge = paymentType === 'full' ? finalTotalNPR : depositAmountNPR;

  const handleBookClick = () => {
    if (!user) { alert("Please log in to book this tour!"); return; }
    if (!bookingDate) { alert("Please select a travel date first!"); return; } 
    setShowModal(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const offset = bookingDate.getTimezoneOffset();
      const formattedDate = new Date(bookingDate.getTime() - (offset*60*1000)).toISOString().split('T')[0];
      
      // 🧠 SAVE THE CODE SO RECEIPT CAN BURN IT
      localStorage.setItem('ecoTourCheckout', JSON.stringify({ 
        ...checkoutData, travelers, bookingDate: formattedDate, lookingForBuddy, paymentType, 
        totalAmount: finalTotalNPR, amountPaid: amountToCharge, promoCode: appliedPromo 
      }));
      
      const response = await axios.post('http://localhost:5000/api/payment/esewa', { amount: amountToCharge, productId: tour.id, tourTitle: tour.title });
      const esewaData = response.data;
      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
      for (const key in esewaData) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden'); hiddenField.setAttribute('name', key); hiddenField.setAttribute('value', esewaData[key]);
        form.appendChild(hiddenField);
      }
      document.body.appendChild(form); form.submit();
    } catch (err) { alert("Failed to connect to backend."); setIsProcessing(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const getHypeColor = (level) => {
    if (level === 'underrated' || level === 'Underrated') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    if (level === 'worth_it' || level === 'Worth It') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (level === 'overrated' || level === 'Overrated') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };
  const getHypeIcon = (level) => {
    if (level === 'underrated' || level === 'Underrated') return <Gem className="w-5 h-5 md:w-6 md:h-6" />;
    if (level === 'worth_it' || level === 'Worth It') return <Sparkles className="w-5 h-5 md:w-6 md:h-6" />;
    if (level === 'overrated' || level === 'Overrated') return <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />;
    return <Activity className="w-5 h-5 md:w-6 md:h-6" />;
  };

  if (loading) return <div className="text-center mt-32 text-2xl font-bold text-slate-400 dark:text-slate-500 animate-pulse">Loading adventure details...</div>;
  if (error || !tour) return <div className="text-center mt-32 text-xl text-rose-500">Tour not found!</div>;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20 relative font-sans transition-colors duration-500">
      
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 dark:bg-cyan-700 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10"><h3 className="text-xl font-bold">Secure Checkout</h3><button onClick={() => setShowModal(false)} className="hover:bg-black/20 p-1 rounded-full transition"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
                <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500"/> Select Payment Plan</h4>
                <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all mb-3 ${paymentType === 'full' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3"><input type="radio" name="paymentType" checked={paymentType === 'full'} onChange={() => setPaymentType('full')} className="w-4 h-4 text-emerald-600" /><span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Pay in Full</span></div><span className="font-black text-emerald-700 dark:text-emerald-400">{formatPrice(finalTotalNPR)}</span>
                </label>
                <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${paymentType === 'partial' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-3"><input type="radio" name="paymentType" checked={paymentType === 'partial'} onChange={() => setPaymentType('partial')} className="w-4 h-4 text-emerald-600" /><div><span className="font-bold text-slate-700 dark:text-slate-200 text-sm block">Reserve Now (30%)</span><span className="text-[10px] text-slate-500 dark:text-slate-400">Pay the rest later</span></div></div><span className="font-black text-emerald-700 dark:text-emerald-400">{formatPrice(depositAmountNPR)}</span>
                </label>
              </div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Lead Traveler Name *</label><input type="text" required value={checkoutData.fullName} onChange={(e) => setCheckoutData({...checkoutData, fullName: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors outline-none" /></div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Phone Number *</label><input type="tel" required value={checkoutData.phone} onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors outline-none" /></div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Home Address *</label><input type="text" required value={checkoutData.address} onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-colors outline-none" /></div>
              <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 mt-2 transition-colors">
                <input type="checkbox" id="buddy" checked={lookingForBuddy} onChange={(e) => setLookingForBuddy(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                <label htmlFor="buddy" className="text-sm font-medium text-indigo-900 dark:text-indigo-300 cursor-pointer"><span className="font-bold block">Looking for a Travel Buddy?</span>Check this to let other solo travelers message you to team up!</label>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 flex flex-col gap-3">
                <button type="submit" disabled={isProcessing} className="w-full bg-[#60bb46] text-white text-lg font-black px-6 py-4 rounded-xl shadow-lg hover:bg-[#519d3b] transition flex items-center justify-center gap-2 disabled:opacity-70">{isProcessing ? 'Connecting...' : `Pay securely via eSewa`}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative w-full h-[55vh] min-h-[450px] bg-slate-800">
        {tour.image_url ? <img src={`http://localhost:5000${tour.image_url}`} className="w-full h-full object-cover opacity-75" /> : <div className="w-full h-full flex justify-center items-center text-slate-500"><ImageIcon className="w-20 h-20" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 lg:px-24">
          <Link to="/tours" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 font-medium transition"><ArrowLeft className="w-5 h-5" /> Back to all tours</Link>
          <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg leading-tight mb-4">{tour.title}</h1>
          {reviewsData && reviewsData.totalVotes > 0 && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md mb-6 shadow-lg ${getHypeColor(reviewsData.consensus)} bg-opacity-90 dark:bg-opacity-80`}>
              {getHypeIcon(reviewsData.consensus)}
              <span className="font-black tracking-widest uppercase text-xs md:text-sm">Community Voted: {reviewsData.consensus}</span>
              <span className="opacity-70 text-xs font-bold ml-2 border-l border-current pl-2">{reviewsData.totalVotes} Votes</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-white/90 font-medium text-lg mt-2">
            <span className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><MapPin className="w-5 h-5 text-emerald-400 dark:text-cyan-400" /> {tour.location}</span>
            <span className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><Clock className="w-5 h-5 text-emerald-400 dark:text-cyan-400" /> {tour.duration_days} Days</span>
            <span className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><Activity className="w-5 h-5 text-emerald-400 dark:text-cyan-400" /> {tour.difficulty} Level</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-900 dark:to-slate-800 p-8 rounded-3xl shadow-lg text-white flex flex-col sm:flex-row items-center justify-between relative overflow-hidden transition-colors"><CloudSun className="absolute -right-10 -top-10 w-48 h-48 text-white/20 dark:text-white/5" /><div className="relative z-10 flex flex-col items-center sm:items-start mb-4 sm:mb-0"><h3 className="text-sm font-black uppercase tracking-widest text-sky-100 dark:text-sky-300 mb-1 flex items-center gap-2"><ThermometerSun className="w-4 h-4" /> Live Weather Update</h3><p className="text-xl font-bold">Currently in {tour.location}</p></div><div className="relative z-10 bg-white/20 dark:bg-black/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30 dark:border-white/10 flex items-center gap-4">{weatherLoading ? <div className="animate-pulse flex items-center gap-3"><div className="w-8 h-8 bg-white/30 rounded-full"></div><div className="w-16 h-4 bg-white/30 rounded"></div></div> : weather ? <><span className="text-4xl drop-shadow-md">{weather.emoji}</span><div><div className="text-3xl font-black drop-shadow-md">{weather.temp}°C</div><div className="text-sm font-bold text-sky-100 dark:text-sky-300">{weather.condition}</div></div></> : <span className="text-sm font-medium text-sky-100">Weather unavailable</span>}</div></section>
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors"><h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">About This Adventure</h2><p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap text-lg">{tour.description}</p></section>
          
          {/* Reviews section abbreviated for fit, perfectly intact from before! */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2"><Activity className="text-indigo-500 w-6 h-6"/> The Hype Meter</h2>
            {user && user.id !== tour.guide_id && (
              <form onSubmit={handleSubmitReview} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 mb-10">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Cast your vote:</h4>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button type="button" onClick={() => setSelectedHype('underrated')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedHype === 'underrated' ? 'bg-purple-100 border-purple-400 text-purple-700 dark:bg-purple-900/40 dark:border-purple-500 dark:text-purple-300 ring-2 ring-purple-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-purple-300'}`}><Gem className="w-6 h-6"/> <span className="text-xs font-bold uppercase tracking-wider">Underrated</span></button>
                  <button type="button" onClick={() => setSelectedHype('worth_it')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedHype === 'worth_it' ? 'bg-emerald-100 border-emerald-400 text-emerald-700 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-300'}`}><Sparkles className="w-6 h-6"/> <span className="text-xs font-bold uppercase tracking-wider">Worth It</span></button>
                  <button type="button" onClick={() => setSelectedHype('overrated')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${selectedHype === 'overrated' ? 'bg-rose-100 border-rose-400 text-rose-700 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-300 ring-2 ring-rose-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-rose-300'}`}><TrendingDown className="w-6 h-6"/> <span className="text-xs font-bold uppercase tracking-wider">Overrated</span></button>
                </div>
                <textarea required value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} rows="3" placeholder="Explain your vote..." className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 text-sm mb-3 resize-none transition-colors"></textarea>
                <button type="submit" disabled={isSubmittingReview || !selectedHype} className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"><Send className="w-4 h-4"/> Publish Vote</button>
              </form>
            )}
            <div className="space-y-4">
              {reviewsData && reviewsData.reviews.map(review => (
                <div key={review.id} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-4">
                  {review.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${review.profile_pic}`} className="w-12 h-12 rounded-full object-cover shrink-0" /> : <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-black shrink-0">{review.username.charAt(0).toUpperCase()}</div>}
                  <div><div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800 dark:text-white">{review.username}</span><span className="text-[10px] text-slate-400">• {new Date(review.created_at).toLocaleDateString()}</span></div><span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 ${getHypeColor(review.hype_level)}`}>Voted: {review.hype_level.replace('_', ' ')}</span><p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{review.comment}</p></div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors"><h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center gap-2"><MapPin className="text-rose-500 w-6 h-6"/> Exact Starting Point</h2>{mapCoords ? (<div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative z-0"><MapContainer center={[mapCoords.lat, mapCoords.lng]} zoom={12} scrollWheelZoom={false} className="w-full h-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" /><Marker position={[mapCoords.lat, mapCoords.lng]}><Popup className="font-bold text-slate-800"><span className="text-emerald-600 block">{tour.title}</span> Trek starts here!</Popup></Marker></MapContainer></div>) : <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold">Map unavailable.</div>}</section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm transition-colors"><div className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-full mb-3"><Building className="w-5 h-5" /></div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Organized By</p><h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">{tour.maker_name}</h3><div className="mt-auto flex flex-wrap gap-2 w-full justify-center"><Link to={`/user/${tour.guide_id}`} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-sm transition">Profile</Link>{user && user.id !== tour.guide_id && <Link to={`/message/${tour.guide_id}`} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg text-sm transition border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1">💬 Message</Link>}</div></div>
            <div className="bg-emerald-50 dark:bg-slate-900 p-6 rounded-3xl border border-emerald-100 dark:border-slate-800 flex flex-col items-center text-center shadow-sm transition-colors">{tour.guide_photo ? <img src={`http://localhost:5000${tour.guide_photo}`} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-300 dark:border-cyan-700 mb-3 shadow-md" /> : <div className="bg-emerald-200 dark:bg-slate-800 text-emerald-700 dark:text-cyan-400 p-2 rounded-full mb-3"><UserCheck className="w-5 h-5" /></div>}<p className="text-xs font-bold text-emerald-600 dark:text-cyan-500 uppercase tracking-widest mb-1">Lead Guide</p><h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{tour.guide_name || tour.maker_name}</h3></div>
          </section>
        </div>

        {/* 💳 DYNAMIC BOOKING CARD */}
        <div className="relative">
          <div className="sticky top-28 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="mb-6"><span className="text-4xl font-black text-slate-800 dark:text-white">{formatPrice(basePrice)}</span><span className="text-slate-500 dark:text-slate-400 text-lg font-medium"> / person</span></div>
            
            <div className="mb-6">
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2"><CalendarIcon className="w-5 h-5 text-emerald-500 dark:text-cyan-500" /> Select Travel Date *</label>
              <div className="w-full border border-slate-200 dark:border-slate-700 p-1 rounded-xl bg-slate-50 dark:bg-slate-800 transition-colors">
                <DatePicker selected={bookingDate} onChange={handleDateChange} minDate={new Date()} dayClassName={getDayClassName} placeholderText="Click to view availability" className="w-full bg-transparent p-2 outline-none font-bold text-slate-800 dark:text-white text-center cursor-pointer" dateFormat="MMMM d, yyyy" />
              </div>
            </div>

            <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" /> Travelers</span>
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition p-1"><Minus className="w-4 h-4"/></button>
                <span className="font-black text-lg text-slate-800 dark:text-white w-4 text-center">{travelers}</span>
                <button onClick={() => setTravelers(Math.min(20, travelers + 1))} className="text-slate-400 dark:text-slate-500 hover:text-emerald-500 transition p-1"><Plus className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-6 transition-colors">
              <div className="flex justify-between"><span>Subtotal</span> <span className="font-bold dark:text-white">{formatPrice(subtotal)}</span></div>
              
              {surgePercent > 0 && <div className="flex justify-between text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg"><span className="font-bold flex items-center gap-1"><Zap className="w-4 h-4 fill-amber-500 dark:fill-amber-400" /> {surgeReason}</span><span className="font-bold">+{formatPrice(surgeAmount)}</span></div>}
              {groupDiscountPercent > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg"><span className="font-bold flex items-center gap-1">🎟️ Group Discount ({groupDiscountPercent}%)</span><span className="font-bold">- {formatPrice(groupDiscountAmount)}</span></div>}

              {/* 🎟️ NEW: PROMO CODE BOX */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg mb-3">
                    <span className="font-bold flex items-center gap-1"><Tag className="w-4 h-4"/> Promo Code</span> 
                    <span className="font-bold">- {formatPrice(promoDiscountAmount)}</span>
                  </div>
                )}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Promo Code" className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                  <button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 dark:hover:bg-emerald-500 transition">Apply</button>
                </form>
                {promoMessage && (
                  <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${promoMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {promoMessage.type === 'success' ? <ShieldCheck className="w-3 h-3"/> : <X className="w-3 h-3"/>} {promoMessage.text}
                  </p>
                )}
              </div>

            </div>

            <div className="flex justify-between items-center mb-6 text-2xl font-black text-slate-800 dark:text-white border-t border-slate-100 dark:border-slate-800 pt-6 transition-colors">
              <span>Total</span><span>{formatPrice(finalTotalNPR)}</span>
            </div>
            
            {user && user.id === tour.guide_id ? (
              <button disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-lg font-bold px-8 py-4 rounded-2xl cursor-not-allowed">Your Tour Listing</button>
            ) : (
              <button onClick={handleBookClick} className="w-full bg-slate-900 dark:bg-emerald-600 text-white text-xl font-black px-8 py-4 rounded-2xl shadow-lg hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:-translate-y-1 transition-all">Book Now</button>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default TourDetails;