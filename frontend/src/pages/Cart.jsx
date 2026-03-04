import { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { CurrencyContext } from '../context/CurrencyContext';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShieldCheck, MapPin, Phone, User, Tag, X } from 'lucide-react';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useContext(CartContext);
  const { formatPrice } = useContext(CurrencyContext);

  const[checkoutData, setCheckoutData] = useState({ fullName: '', phone: '', address: '' });
  const[isProcessing, setIsProcessing] = useState(false);

  // 🎟️ PROMO STATES
  const[promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(''); // Saves valid code
  const [promoDiscount, setPromoDiscount] = useState(0); 
  const[promoMessage, setPromoMessage] = useState(null); 

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await axios.post('http://localhost:5000/api/promo/validate', { code });
      setPromoDiscount(res.data.discount_percent);
      setAppliedPromo(code); // 🧠 Save it so we can burn it later!
      setPromoMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setPromoDiscount(0); setAppliedPromo('');
      setPromoMessage({ type: 'error', text: err.response?.data?.message || 'Invalid code.' });
    }
  };

  const subtotal = getCartTotal();
  const discountAmount = (subtotal * promoDiscount) / 100;
  const finalTotalNPR = Math.round(subtotal - discountAmount);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!user) return alert("Please log in to checkout!");
    
    setIsProcessing(true);
    try {
      localStorage.setItem('ecoTourCheckout', JSON.stringify({ 
        fullName: checkoutData.fullName, phone: checkoutData.phone, address: checkoutData.address, cartItems: cart, 
        promoCode: appliedPromo // 🧠 Send code to Receipt page!
      }));

      const response = await axios.post('http://localhost:5000/api/payment/esewa-cart', { amount: finalTotalNPR });
      const esewaData = response.data;
      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
      for (const key in esewaData) {
        const hiddenField = document.createElement('input');
        hiddenField.setAttribute('type', 'hidden');
        hiddenField.setAttribute('name', key);
        hiddenField.setAttribute('value', esewaData[key]);
        form.appendChild(hiddenField);
      }
      document.body.appendChild(form); form.submit();
    } catch (err) { alert("Failed to connect to eSewa."); setIsProcessing(false); }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500">
        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart className="w-12 h-12 text-indigo-300 dark:text-indigo-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Looks like you haven't added any local crafts yet.</p>
        <Link to="/shop" className="bg-slate-900 dark:bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition shadow-lg">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3"><ShoppingCart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-6 border-b border-slate-100 dark:border-slate-800 last:border-b-0 group">
                  {item.image_url ? <img src={`http://localhost:5000${item.image_url}`} alt={item.title} className="w-24 h-24 object-cover rounded-2xl shadow-sm" /> : <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-slate-300" /></div>}
                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{item.category}</p>
                    <p className="font-black text-indigo-600 dark:text-indigo-400">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-400 hover:text-rose-500 transition"><Minus className="w-4 h-4" /></button>
                      <span className="font-bold text-slate-800 dark:text-white w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-400 hover:text-emerald-500 transition"><Plus className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sticky top-28 transition-colors">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">Order Summary</h3>
              
              <div className="space-y-3 mb-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                <div className="flex justify-between"><span>Items ({getCartCount()})</span><span>{formatPrice(subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">Free</span></div>
              </div>

              {/* 🎟️ NEW: PROMO CODE INPUT */}
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg mb-3">
                    <span className="font-bold flex items-center gap-1"><Tag className="w-4 h-4"/> Promo Code</span> 
                    <span className="font-bold">- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Promo Code" className="flex-grow bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" />
                  <button type="submit" className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 dark:hover:bg-indigo-500 transition">Apply</button>
                </form>
                {promoMessage && (
                  <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${promoMessage.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {promoMessage.type === 'success' ? <ShieldCheck className="w-3 h-3"/> : <X className="w-3 h-3"/>} {promoMessage.text}
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-8 text-2xl font-black text-slate-900 dark:text-white">
                <span>Total</span><span className="text-indigo-600 dark:text-indigo-400">{formatPrice(finalTotalNPR)}</span>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div><label className="block text-slate-700 dark:text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Full Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" required value={checkoutData.fullName} onChange={(e) => setCheckoutData({...checkoutData, fullName: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" /></div></div>
                <div><label className="block text-slate-700 dark:text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="tel" required value={checkoutData.phone} onChange={(e) => setCheckoutData({...checkoutData, phone: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" /></div></div>
                <div><label className="block text-slate-700 dark:text-slate-400 font-bold mb-1.5 text-xs uppercase tracking-wider">Address</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" required value={checkoutData.address} onChange={(e) => setCheckoutData({...checkoutData, address: e.target.value})} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" /></div></div>
                
                <button type="submit" disabled={isProcessing || !user} className="w-full bg-[#60bb46] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#519d3b] transition disabled:opacity-70 mt-4 flex items-center justify-center gap-2">
                  {isProcessing ? 'Processing...' : 'Pay Securely'} <ArrowRight className="w-5 h-5" />
                </button>
              </form>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure eSewa Checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Cart;