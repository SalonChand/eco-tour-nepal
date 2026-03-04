import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CurrencyContext } from '../context/CurrencyContext'; 
import { Link } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code'; 
import domtoimage from 'dom-to-image'; 
import { jsPDF } from 'jspdf'; 
import { Ticket, MountainSnow, MapPin, Mail, ShieldAlert, ShoppingBag, Box, Tag, CreditCard, DollarSign, Package, Heart, Edit3, X, Camera, MessageSquare, ChevronRight, Wallet, CheckCircle2, Check, Gift, Copy, AlertCircle, PlayCircle, Download, Map, Users } from 'lucide-react'; // Added Users icon

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const { formatPrice } = useContext(CurrencyContext);
  
  const[bookedTours, setBookedTours] = useState([]);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const [myTours, setMyTours] = useState([]);
  const[myProducts, setMyProducts] = useState([]);
  const [tourSales, setTourSales] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]); 
  const[inboxContacts, setInboxContacts] = useState([]);
  
  const[escrowItems, setEscrowItems] = useState([]);
  const [wallet, setWallet] = useState({ wallet_pending: 0, wallet_available: 0 });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  
  const[checkInTicketId, setCheckInTicketId] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [ticketModal, setTicketModal] = useState(null);

  const[loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases'); 

  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🤝 UPGRADED: Added region, team_type, and team_size to edit state!
  const [editData, setEditData] = useState({ 
    username: '', bio: '', phone: '', address: '', region: 'Not Specified', team_type: 'solo', team_size: 1 
  });
  const [newProfilePic, setNewProfilePic] = useState(null);

  useEffect(() => {
    if (user) {
      setEditData({ 
        username: user.username || '', 
        bio: user.bio || '', 
        phone: user.phone || '', 
        address: user.address || '',
        region: user.region || 'Not Specified',
        team_type: user.team_type || 'solo',
        team_size: user.team_size || 1
      });
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const[bookedRes, orderedRes, toursRes, productsRes, tourSalesRes, prodSalesRes, wishRes, inboxRes, escrowRes, walletRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tours/booked/${user.id}`),
        axios.get(`http://localhost:5000/api/products/ordered/${user.id}`),
        axios.get(`http://localhost:5000/api/tours/user/${user.id}`),
        axios.get(`http://localhost:5000/api/products/user/${user.id}`),
        axios.get(`http://localhost:5000/api/tours/sales/${user.id}`),
        axios.get(`http://localhost:5000/api/products/sales/${user.id}`),
        axios.get(`http://localhost:5000/api/wishlist/${user.id}`),
        axios.get(`http://localhost:5000/api/chat/inbox/${user.id}`),
        axios.get(`http://localhost:5000/api/wallet/escrow-purchases/${user.id}`), 
        axios.get(`http://localhost:5000/api/wallet/balance/${user.id}`) 
      ]);
      setBookedTours(bookedRes.data); setOrderedProducts(orderedRes.data);
      setMyTours(toursRes.data); setMyProducts(productsRes.data);
      setTourSales(tourSalesRes.data); setProductSales(prodSalesRes.data);
      setWishlistItems(wishRes.data); setInboxContacts(inboxRes.data);
      setEscrowItems(escrowRes.data); setWallet(walletRes.data || { wallet_pending: 0, wallet_available: 0 });
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleReleaseFunds = async (id, type) => {
    if(window.confirm(`Mark this ${type} as completed and release funds to the seller?`)){
      try {
        await axios.post(`http://localhost:5000/api/wallet/release-${type}/${id}`);
        fetchProfileData();
        alert("Funds successfully released! Thank you.");
      } catch (err) { alert("Error releasing funds."); }
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if(parseFloat(payoutAmount) > parseFloat(wallet.wallet_available)) return alert("Insufficient available balance.");
    try {
      await axios.post('http://localhost:5000/api/wallet/payout', { user_id: user.id, amount: payoutAmount, bank_details: bankDetails });
      setWallet({ ...wallet, wallet_available: wallet.wallet_available - parseFloat(payoutAmount) });
      setPayoutAmount(''); setBankDetails('');
      alert("Payout requested successfully! Admin will review it soon.");
    } catch(err) { alert("Error requesting payout."); }
  };

  // 🤝 UPGRADED: Save the Collaboration Details
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData();
    formData.append('username', editData.username); 
    formData.append('bio', editData.bio);
    formData.append('phone', editData.phone); 
    formData.append('address', editData.address);
    formData.append('region', editData.region);
    formData.append('team_type', editData.team_type);
    formData.append('team_size', editData.team_size);

    if (newProfilePic) formData.append('profile_pic', newProfilePic);
    
    try {
      const res = await axios.put(`http://localhost:5000/api/users/update/${user.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      login(res.data.user, localStorage.getItem('token'));
      setShowEditModal(false);
    } catch (err) { alert("Failed to update profile."); }
    setIsSaving(false);
  };

  const handleRemoveWishlist = async (id, isTour) => {
    try {
      await axios.post('http://localhost:5000/api/wishlist/toggle', { user_id: user.id, tour_id: isTour ? id : null, product_id: !isTour ? id : null });
      setWishlistItems(wishlistItems.filter(item => (isTour ? item.tour_id !== id : item.product_id !== id)));
    } catch(err) {}
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/products/update-status/${orderId}`, { status: newStatus });
      setProductSales(prev => prev.map(sale => sale.id === orderId ? { ...sale, status: newStatus } : sale));
      alert(`Order marked as: ${newStatus}`);
    } catch (err) { alert("Failed to update status."); }
  };

  const handlePayBalance = async (booking) => {
    const remainingBalance = booking.amount - booking.amount_paid;
    if(window.confirm(`Redirect to eSewa to pay the remaining balance of Rs. ${remainingBalance}?`)) {
      try {
        const response = await axios.post('http://localhost:5000/api/payment/esewa-balance', { 
          amount: remainingBalance, bookingId: booking.booking_id 
        });
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
      } catch (err) { 
        alert(`eSewa Error: ${err.response?.data?.message || err.message}`); 
      }
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsCheckingIn(true);
    try {
      const res = await axios.post('http://localhost:5000/api/tours/check-in', { transaction_uuid: checkInTicketId, guide_id: user.id });
      alert(res.data.message);
      setCheckInTicketId('');
      fetchProfileData(); 
    } catch (err) { alert(err.response?.data?.message || "Invalid Ticket ID"); }
    setIsCheckingIn(false);
  };

  const downloadTicketPDF = async () => {
    try {
      const element = document.getElementById('printable-ticket');
      if (!element) return alert("Ticket not found!");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EcoTour_Ticket_${ticketModal.transaction_id.substring(0,6)}.pdf`);
    } catch (error) {
      alert("Failed to generate PDF. Check console.");
    }
  };

  const getStatusIndex = (status) => {
    if (status === 'Delivered') return 3; if (status === 'Shipped') return 2; if (status === 'Packed') return 1; return 0; 
  };
  const pipelineSteps = ['Processing', 'Packed', 'Shipped', 'Delivered'];

  const copyReferralLink = () => {
    const link = `http://localhost:5173/register?ref=${user.username}`;
    navigator.clipboard.writeText(link);
    alert("Referral link copied!");
  };

  if (!user) return <div className="text-center mt-32 text-xl text-rose-500 font-bold">Please log in!</div>;

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen pt-12 pb-20 font-sans transition-colors duration-500 relative">
      
      {/* 🎫 SAVED E-TICKET MODAL */}
      {ticketModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
          <div className="relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setTicketModal(null)} className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-2 rounded-full shadow-xl hover:scale-110 transition z-10"><X className="w-6 h-6"/></button>
            <div id="printable-ticket" className="text-left bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col sm:flex-row overflow-hidden relative shadow-2xl mx-auto w-full max-w-2xl p-2">
              <div className="p-6 md:p-8 bg-emerald-50 dark:bg-emerald-900/20 flex-grow relative rounded-2xl sm:rounded-r-none">
                <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5"/> Boarding Pass</h3>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 line-clamp-1">{ticketModal.title}</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm font-medium">
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Lead Traveler</p><p className="text-slate-800 dark:text-slate-200">{ticketModal.full_name || user.username}</p></div>
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Travelers</p><p className="text-slate-800 dark:text-slate-200">{ticketModal.travelers || 1} Person(s)</p></div>
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Travel Date</p><p className="text-slate-800 dark:text-slate-200">{ticketModal.booking_date ? new Date(ticketModal.booking_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Paid</p><p className="text-emerald-600 dark:text-emerald-400 font-black">Rs. {ticketModal.amount_paid}</p></div>
                </div>
                {ticketModal.payment_type === 'partial' && (
                  <div className="mt-6 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Balance Due:</span>
                    <span className="font-black text-slate-800 dark:text-white">Rs. {ticketModal.amount - ticketModal.amount_paid}</span>
                  </div>
                )}
              </div>
              <div className="p-6 md:p-8 bg-white dark:bg-slate-800 flex flex-col items-center justify-center border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-slate-200 dark:border-slate-700 relative shrink-0 rounded-2xl sm:rounded-l-none">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100"><QRCode value={ticketModal.transaction_id} size={110} level="H" /></div>
                <p className="text-[10px] text-slate-400 font-mono mt-3 text-center">TXN: <br/>{ticketModal.transaction_id.substring(0,8)}...</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 border px-2 py-0.5 rounded ${ticketModal.trek_status === 'in_progress' ? 'border-sky-200 bg-sky-50 text-sky-600' : 'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                  {ticketModal.trek_status === 'in_progress' ? 'Started' : 'Valid'}
                </p>
              </div>
            </div>
            <button onClick={downloadTicketPDF} className="mt-4 mx-auto flex items-center justify-center gap-2 bg-slate-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition shadow-lg"><Download className="w-5 h-5"/> Download PDF</button>
          </div>
        </div>
      )}
      
      {/* 🛠️ EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-4 flex justify-between items-center text-white sticky top-0 z-10"><h3 className="text-xl font-bold">Edit Profile</h3><button onClick={() => setShowEditModal(false)} className="hover:bg-black/20 p-1 rounded-full transition"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 border-4 border-emerald-50 dark:border-slate-700 overflow-hidden group">
                  {newProfilePic ? <img src={URL.createObjectURL(newProfilePic)} className="w-full h-full object-cover" /> : user.profile_pic && user.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${user.profile_pic}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-3xl">{user.username.charAt(0).toUpperCase()}</div>}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"><Camera className="w-6 h-6" /><input type="file" accept="image/*" className="hidden" onChange={(e) => setNewProfilePic(e.target.files[0])} /></label>
                </div>
              </div>
              
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Username</label><input type="text" value={editData.username} onChange={(e) => setEditData({...editData, username: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors" required /></div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Bio</label><textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} rows="2" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors"></textarea></div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Phone</label><input type="tel" value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors" /></div>
              <div><label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Address</label><input type="text" value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors" /></div>
              
              {/* 🤝 NEW: REGION & TEAM FIELDS (Only for Guides/Admins) */}
              {(user.role === 'guide' || user.role === 'admin') && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2 space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2"><MapPin className="text-emerald-500 w-4 h-4"/> Regional Collaboration</h4>
                  
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Operating Region</label>
                    <select value={editData.region} onChange={(e) => setEditData({...editData, region: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors">
                      <option value="Not Specified">Not Specified</option>
                      <option value="Everest Region">Everest Region</option>
                      <option value="Annapurna Region">Annapurna Region</option>
                      <option value="Kathmandu Valley">Kathmandu Valley</option>
                      <option value="Chitwan / Lumbini">Chitwan / Lumbini</option>
                      <option value="Langtang Region">Langtang Region</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Team Type</label>
                      <select value={editData.team_type} onChange={(e) => setEditData({...editData, team_type: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors">
                        <option value="solo">Solo Operator</option>
                        <option value="group">Agency / Group</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-sm">Team Size</label>
                      <input type="number" min="1" max="50" value={editData.team_size} onChange={(e) => setEditData({...editData, team_size: e.target.value})} disabled={editData.team_type === 'solo'} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white transition-colors disabled:opacity-50" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white font-black px-6 py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition mt-2">{isSaving ? 'Saving...' : 'Save Profile Changes'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-slate-900 rounded-[2rem] shadow-2xl p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group border border-transparent dark:border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
        <button onClick={() => setShowEditModal(true)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-2 md:px-4 md:py-2 rounded-xl backdrop-blur-sm transition flex items-center gap-2 border border-white/10 z-20"><Edit3 className="w-4 h-4" /> <span className="hidden md:block font-bold text-sm">Edit Profile</span></button>
        {user.profile_pic && user.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${user.profile_pic}`} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-xl ring-4 ring-slate-800 dark:ring-slate-700 z-10" /> : <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-6xl font-black shadow-xl ring-4 ring-slate-800 dark:ring-slate-700 z-10">{user.username.charAt(0).toUpperCase()}</div>}
        <div className="text-center md:text-left z-10 flex-grow">
          <h1 className="text-4xl font-black text-white mb-2">{user.username}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium mb-4">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {user.email}</span>
            {/* 🤝 NEW: Display Region & Team on Profile Header */}
            {user.region && user.region !== 'Not Specified' && <span className="flex items-center gap-1.5 text-cyan-400"><MapPin className="w-4 h-4" /> {user.region}</span>}
            {user.team_type === 'group' && <span className="flex items-center gap-1.5 text-amber-400"><Users className="w-4 h-4" /> Team of {user.team_size}</span>}
          </div>
          <span className="inline-flex items-center justify-center gap-2 text-slate-900 bg-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg"><ShieldAlert className="w-3.5 h-3.5" /> {user.role} ACCOUNT</span>
        </div>
      </div>

      {/* 🎛️ Navigation Tabs */}
      <div className="flex justify-center mb-10 overflow-x-auto pb-2">
        <div className="bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full inline-flex shadow-inner whitespace-nowrap transition-colors border border-transparent dark:border-slate-800">
          <button onClick={() => setActiveTab('purchases')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'purchases' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><CreditCard className="w-4 h-4" /> Purchases</button>
          <button onClick={() => setActiveTab('inbox')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><MessageSquare className="w-4 h-4" /> Inbox</button>
          <button onClick={() => setActiveTab('affiliate')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'affiliate' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Gift className="w-4 h-4" /> Refer & Earn</button>
          <button onClick={() => setActiveTab('favorites')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'favorites' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Heart className="w-4 h-4" /> Favorites</button>
          
          {(user.role === 'guide' || user.role === 'admin') && (
            <>
              <button onClick={() => setActiveTab('listings')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'listings' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Box className="w-4 h-4" /> Listings</button>
              <button onClick={() => setActiveTab('sales')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'sales' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Package className="w-4 h-4" /> Sales</button>
            </>
          )}
          <button onClick={() => setActiveTab('wallet')} className={`px-5 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'wallet' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Wallet className="w-4 h-4" /> Wallet</button>
        </div>
      </div>

      {loading ? <div className="text-center py-20 animate-pulse text-slate-400">Loading...</div> : (
        <div className="animate-in fade-in duration-500">

          {activeTab === 'affiliate' && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-colors">
                <Gift className="absolute -right-10 -bottom-10 w-64 h-64 text-white/10 transform -rotate-12" />
                <h2 className="text-3xl md:text-4xl font-black mb-4 relative z-10 tracking-tight">Refer & Earn 5% Commission! 💸</h2>
                <p className="text-emerald-50 dark:text-emerald-100 text-lg mb-8 max-w-xl relative z-10 leading-relaxed">Share your unique link below. When a friend signs up and books a tour, you instantly receive a 5% cash bonus straight into your Digital Wallet!</p>
                <div className="bg-slate-900/30 dark:bg-black/30 backdrop-blur-md p-2 pl-6 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <input type="text" readOnly value={`http://localhost:5173/register?ref=${user.username}`} className="w-full bg-transparent text-emerald-100 font-mono text-sm outline-none" />
                  <button onClick={copyReferralLink} className="w-full sm:w-auto bg-white dark:bg-emerald-500 text-teal-700 dark:text-white font-black px-6 py-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-400 transition shadow-lg flex items-center justify-center gap-2"><Copy className="w-5 h-5" /> Copy Link</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'purchases' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section>
                {escrowItems.filter(i => i.type === 'tour').length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5"/> Release Tour Funds</h2>
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-3xl p-6 space-y-4">
                      {escrowItems.filter(i => i.type === 'tour').map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm border border-transparent dark:border-slate-700">
                          <div><span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded mr-2 font-black">Tour</span><span className="font-bold dark:text-white">{item.title}</span></div>
                          <button onClick={() => handleReleaseFunds(item.id, item.type)} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-rose-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Complete</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">Booked Tours</h2>
                {bookedTours.length === 0 ? <p className="text-slate-500">No trips booked yet.</p> : (
                  <div className="space-y-4">
                    {bookedTours.map((b) => (
                      <div key={b.booking_id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 transition-colors relative overflow-hidden flex flex-col gap-3">
                        <div className="flex gap-4 items-center">
                          <img src={`http://localhost:5000${b.image_url}`} crossOrigin="anonymous" className="w-16 h-16 object-cover rounded-xl" />
                          <div className="flex-grow">
                            <h3 className="font-bold dark:text-white flex items-center gap-2">
                              {b.title} 
                              {b.trek_status === 'in_progress' && <span className="text-[10px] bg-sky-100 text-sky-700 px-2 rounded-md uppercase tracking-widest font-black">Trekking Now</span>}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-1">Txn: {b.transaction_id.substring(0, 15)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-800 dark:text-white font-black">{formatPrice(b.amount)}</p>
                            {b.payment_type === 'partial' ? (
                              <span className="text-amber-500 text-xs font-bold block mt-1">Pending: {formatPrice(b.amount - b.amount_paid)}</span>
                            ) : (
                              <span className="text-emerald-500 text-xs font-bold block mt-1">Fully Paid</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => setTicketModal(b)} className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-4 py-2 rounded-lg transition">
                            🎫 View E-Ticket
                          </button>
                          {b.payment_type === 'partial' && (
                            <button onClick={() => handlePayBalance(b)} className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-amber-600 transition">
                              Pay Balance
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                {escrowItems.filter(i => i.type === 'product').length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-4"><ShieldAlert className="w-5 h-5"/> Release Product Funds</h2>
                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-3xl p-6 space-y-4">
                      {escrowItems.filter(i => i.type === 'product').map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm border border-transparent dark:border-slate-700">
                          <div><span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded mr-2 font-black">Product</span><span className="font-bold dark:text-white">{item.title}</span></div>
                          <button onClick={() => handleReleaseFunds(item.id, item.type)} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-rose-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Received</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors">Ordered Products</h2>
                {orderedProducts.length === 0 ? <p className="text-slate-500">No products bought yet.</p> : (
                  <div className="space-y-6">
                    {orderedProducts.map((o) => {
                      const statusIdx = getStatusIndex(o.status);
                      return (
                        <div key={o.order_id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 transition-colors">
                          <div className="flex gap-4 items-center mb-4"><img src={`http://localhost:5000${o.image_url}`} className="w-12 h-12 object-cover rounded-lg" /><div className="flex-grow"><h3 className="font-bold text-slate-800 dark:text-white line-clamp-1">{o.title}</h3><p className="text-xs text-slate-400 font-mono">Txn: {o.transaction_id.substring(0, 10)}...</p></div><span className="text-indigo-600 dark:text-indigo-400 font-black">{formatPrice(o.amount)}</span></div>
                          <div className="relative pt-4 pb-2 px-2 mt-2 border-t border-slate-50 dark:border-slate-800/50">
                            <div className="absolute top-7 left-6 right-6 h-1 bg-slate-100 dark:bg-slate-800 rounded"></div>
                            <div className="absolute top-7 left-6 h-1 bg-indigo-500 dark:bg-indigo-400 rounded transition-all duration-700" style={{ width: `calc(${(statusIdx / 3) * 100}% - 24px)` }}></div>
                            <div className="relative flex justify-between z-10">
                              {pipelineSteps.map((step, idx) => (
                                <div key={step} className="flex flex-col items-center gap-2 w-16">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${idx <= statusIdx ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500'}`}>{idx <= statusIdx && <Check className="w-3.5 h-3.5" />}</div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${idx <= statusIdx ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'inbox' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><MessageSquare className="w-6 h-6" /></div><h2 className="text-2xl font-black text-slate-800 dark:text-white">My Messages</h2></div>
              {inboxContacts.length === 0 ? <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center"><p className="text-slate-500 dark:text-slate-400">Your inbox is empty.</p></div> : (
                <div className="space-y-4">
                  {inboxContacts.map((contact) => (
                    <Link to={`/message/${contact.contact_id}`} key={contact.contact_id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-700 transition group">
                      <div className="flex items-center gap-4">
                        {contact.contact_pic !== 'default.png' ? <img src={`http://localhost:5000${contact.contact_pic}`} className="w-14 h-14 rounded-full object-cover border dark:border-slate-700" /> : <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center font-black">{contact.contact_name.charAt(0)}</div>}
                        <div><h3 className="font-bold text-slate-800 dark:text-white text-lg">{contact.contact_name}</h3><p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{contact.contact_role}</p></div>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition"><ChevronRight className="w-5 h-5" /></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4"><div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl"><Heart className="w-6 h-6 fill-rose-600 dark:fill-rose-400" /></div><h2 className="text-2xl font-black text-slate-800 dark:text-white">My Saved Items</h2></div>
              {wishlistItems.length === 0 ? <div className="bg-slate-50 dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center"><p className="text-slate-500 dark:text-slate-400">Your wishlist is empty.</p></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {wishlistItems.map((item) => {
                    const isTour = item.tour_id !== null;
                    return (
                      <div key={item.wishlist_id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex gap-4 items-center relative pr-12 transition-colors">
                        <img src={`http://localhost:5000${isTour ? item.tour_image : item.product_image}`} className="w-20 h-20 object-cover rounded-xl" />
                        <div><span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1 inline-block ${isTour ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'}`}>{isTour ? 'Tour' : 'Product'}</span><h3 className="font-bold line-clamp-1 dark:text-white">{isTour ? item.tour_title : item.product_title}</h3><p className="text-slate-500 dark:text-slate-400 font-bold">{formatPrice(isTour ? item.tour_price : item.product_price)}</p></div>
                        <button onClick={() => handleRemoveWishlist(isTour ? item.tour_id : item.product_id, isTour)} className="absolute right-4 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition text-slate-300 dark:text-slate-600 hover:text-rose-500"><Heart className="w-6 h-6 fill-rose-500 text-rose-500" /></button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section><div className="flex justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4"><h2 className="text-2xl font-black text-slate-800 dark:text-white">Tours I Sell</h2><Link to="/add-tour" className="text-emerald-600 dark:text-emerald-400 font-bold">+ New</Link></div>{myTours.length === 0 ? <p className="text-slate-500">You haven't listed any tours.</p> : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{myTours.map((t) => (<div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"><img src={`http://localhost:5000${t.image_url}`} className="h-32 w-full object-cover" /><div className="p-4"><h3 className="font-bold dark:text-white">{t.title}</h3><p className="text-emerald-600 dark:text-emerald-400 font-black mb-2">{formatPrice(t.price)}</p><Link to={`/tours/${t.id}`} className="block text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-sm transition">View Page</Link></div></div>))}</div>)}</section>
              <section><div className="flex justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4"><h2 className="text-2xl font-black text-slate-800 dark:text-white">Products I Sell</h2><Link to="/add-product" className="text-indigo-600 dark:text-indigo-400 font-bold">+ New</Link></div>{myProducts.length === 0 ? <p className="text-slate-500">You haven't listed any products.</p> : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{myProducts.map((p) => (<div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden"><img src={`http://localhost:5000${p.image_url}`} className="h-32 w-full object-cover" /><div className="p-4"><h3 className="font-bold dark:text-white">{p.title}</h3><p className="text-indigo-600 dark:text-indigo-400 font-black mb-2">{formatPrice(p.price)}</p><Link to="/shop" className="block text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2 rounded-lg text-sm transition">View in Shop</Link></div></div>))}</div>)}</section>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section>
                <h2 className="text-2xl font-black flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-800 dark:text-white"><Ticket className="text-emerald-600 dark:text-emerald-400"/> Tour Bookings Received</h2>
                
                <form onSubmit={handleCheckIn} className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row gap-3">
                  <input type="text" value={checkInTicketId} onChange={(e) => setCheckInTicketId(e.target.value)} placeholder="Enter Ticket TXN ID..." className="flex-grow px-4 py-3 rounded-xl border border-emerald-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm bg-white dark:bg-slate-800 dark:text-white" required />
                  <button type="submit" disabled={isCheckingIn} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 whitespace-nowrap"><PlayCircle className="w-5 h-5"/> Check In</button>
                </form>

                {tourSales.length === 0 ? <p className="text-slate-500">No bookings yet.</p> : (
                  <div className="space-y-4">
                    {tourSales.map((sale, i) => (
                      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 relative overflow-hidden transition-colors">
                        <div className={`absolute top-0 left-0 w-2 h-full ${sale.trek_status === 'in_progress' ? 'bg-sky-500' : sale.trek_status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        <div className="pl-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold dark:text-white">{sale.title}</h3>
                              <span className="text-xs text-slate-400 font-mono">ID: {sale.transaction_id.substring(0,8)}...</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-800 dark:text-white font-black block">{formatPrice(sale.amount)}</span>
                              {sale.payment_type === 'partial' && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">BNPL (30%)</span>}
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800 p-3 text-sm rounded-xl border border-transparent dark:border-slate-700 dark:text-slate-300">
                            <p>Customer: {sale.full_name || sale.buyer_name}</p>
                            <p>Phone: {sale.phone}</p>
                            <p className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-bold flex items-center justify-between">
                              <span>Date: {new Date(sale.booking_date).toLocaleDateString()}</span>
                              <span className={`uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-md ${sale.trek_status === 'in_progress' ? 'bg-sky-100 text-sky-700' : sale.trek_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{sale.trek_status}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="text-2xl font-black flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 text-slate-800 dark:text-white"><Package className="text-indigo-600 dark:text-indigo-400"/> Orders to Ship</h2>
                {productSales.length === 0 ? <p className="text-slate-500">No orders yet.</p> : (
                  <div className="space-y-4">
                    {productSales.map((sale, i) => (
                      <div key={i} className="bg-indigo-50 dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 p-5 relative">
                        <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-indigo-900 dark:text-indigo-100 pr-24">{sale.title}</h3><span className="text-indigo-700 dark:text-indigo-400 font-black text-lg">{formatPrice(sale.amount)}</span></div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 border border-indigo-100 dark:border-slate-700 mb-3"><p>Customer: {sale.shipping_name || sale.buyer_name}</p><p>Phone: {sale.phone}</p><p className="text-rose-600 dark:text-rose-400 font-bold mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">Ship To: {sale.address}</p></div>
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl p-3 border border-indigo-100 dark:border-slate-700 shadow-sm"><span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status:</span><select value={sale.status === 'COMPLETE' ? 'Processing' : sale.status} onChange={(e) => handleStatusUpdate(sale.id, e.target.value)} className="text-xs font-black bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-none rounded-lg px-3 py-1.5 outline-none cursor-pointer"><option value="Processing">📦 Processing</option><option value="Packed">🧳 Packed</option><option value="Shipped">🚚 Shipped</option><option value="Delivered">✅ Delivered</option></select></div></div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 6: DIGITAL WALLET */}
          {activeTab === 'wallet' && (
             <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden"><ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" /><p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Pending in Escrow</p><h2 className="text-5xl font-black mb-2">{formatPrice(wallet.wallet_pending)}</h2><p className="text-xs text-slate-400 leading-relaxed">Funds securely held by Eco Tour Nepal. Released automatically when buyers mark their order as complete.</p></div>
                  <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white p-8 rounded-3xl shadow-xl shadow-amber-500/30 relative overflow-hidden"><Wallet className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" /><p className="text-amber-100 font-bold uppercase tracking-widest text-sm mb-2">Available for Payout</p><h2 className="text-5xl font-black mb-2">{formatPrice(wallet.wallet_available)}</h2><p className="text-xs text-amber-100 leading-relaxed">Ready to be withdrawn to your local bank account. (10% platform fee already deducted).</p></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2"><DollarSign className="text-amber-500"/> Request Bank Withdrawal</h3>
                  <form onSubmit={handleRequestPayout} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Amount to Withdraw</label><input type="number" max={wallet.wallet_available} value={payoutAmount} onChange={(e)=>setPayoutAmount(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                      <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bank Account Details</label><input type="text" placeholder="e.g. Nabil Bank, Acct 123456789, Ram Sharma" value={bankDetails} onChange={(e)=>setBankDetails(e.target.value)} required className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" /></div>
                    </div>
                    <button type="submit" disabled={!payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > parseFloat(wallet.wallet_available)} className="w-full bg-slate-900 dark:bg-amber-600 text-white font-black py-4 rounded-xl hover:bg-amber-500 dark:hover:bg-amber-500 transition disabled:opacity-50">Request Payout via Bank Transfer</button>
                  </form>
                </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Profile;