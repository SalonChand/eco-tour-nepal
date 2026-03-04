import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './context/AuthContext';
import { CurrencyContext } from './context/CurrencyContext';
import { CartContext } from './context/CartContext';
import { ThemeContext } from './context/ThemeContext';
import { 
  MountainSnow, LogOut, LogIn, UserPlus, RefreshCw, Menu, X, 
  Compass, ShoppingBag, MessageCircle, ShoppingCart, Bell, Moon, Sun,
  ChevronDown, Plus, ShieldCheck, Heart, User, LayoutDashboard
} from 'lucide-react';

// Import all pages
import Register from './pages/Register';
import Login from './pages/Login';
import AddTour from './pages/AddTour';
import Home from './pages/Home';
import ExploreTours from './pages/ExploreTours';
import TourDetails from './pages/TourDetails';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';
import CommunityChat from './pages/CommunityChat';
import DirectChat from './pages/DirectChat'; 
import Admin from './pages/Admin';
import Shop from './pages/Shop';
import AddProduct from './pages/AddProduct';
import PublicProfile from './pages/PublicProfile';
import BecomeSeller from './pages/BecomeSeller';
import ForgotPassword from './pages/ForgotPassword';
import Cart from './pages/Cart';
import CollaborationHub from './pages/CollaborationHub';
import Footer from './components/Footer';
import HelpdeskWidget from './components/HelpdeskWidget'; 

function AppContent() {
  const { user, logout } = useContext(AuthContext);
  const { currency, toggleCurrency } = useContext(CurrencyContext);
  const { getCartCount } = useContext(CartContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  
  const[isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const [notifications, setNotifications] = useState([]);
  const[showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  const createRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (createRef.current && !createRef.current.contains(event.target)) setIsCreateOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  },[]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCreateOpen(false);
    setIsProfileOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  },[isMobileMenuOpen]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
          setNotifications(res.data);
        } catch (err) {}
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.put(`http://localhost:5000/api/notifications/read/${user.id}`);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const navLinkClass = (path) => {
    const isActive = location.pathname === path || (path === '/tours' && location.pathname.startsWith('/tours/'));
    return `group relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm ${
      isActive 
        ? 'text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/30' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
    }`;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500">
      
      {/* 🌟 ULTRA-PREMIUM NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-500 supports-[backdrop-filter]:bg-white/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center gap-4">
          
          {/* LEFT: Logo */}
          <div className="flex shrink-0 items-center">
            <Link to="/" onClick={closeMenu} className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-cyan-600 to-emerald-500 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 group-hover:shadow-cyan-500/40 transition-all duration-300">
                <MountainSnow className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                EcoTour
              </span>
            </Link>
          </div>

          {/* CENTER: Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-md">
              <Link to="/tours" className={navLinkClass('/tours')}><Compass className="w-4 h-4" /> Explore</Link>
              <Link to="/shop" className={navLinkClass('/shop')}><ShoppingBag className="w-4 h-4" /> Market</Link>
              <Link to="/chat" className={navLinkClass('/chat')}><MessageCircle className="w-4 h-4" /> Community</Link>
              {(user?.role === 'guide' || user?.role === 'admin') && (
                <Link to="/collab" className={navLinkClass('/collab')}>🤝 Co-op</Link>
              )}
            </div>
          </nav>

          {/* RIGHT: Tools & Profile */}
          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4">
            
            {/* Utility Icons (Theme, Currency, Cart, Notifications) */}
            <div className="hidden sm:flex items-center gap-1 pr-4 border-r border-slate-200 dark:border-slate-800">
              
              <button onClick={toggleTheme} className="p-2.5 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button onClick={toggleCurrency} className="flex items-center gap-1.5 p-2.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-xs font-bold uppercase tracking-wider">
                <RefreshCw className={`w-4 h-4 ${currency === 'USD' ? 'animate-spin-once' : ''}`} /> 
                <span className="hidden xl:inline">{currency}</span>
              </button>

              <Link to="/cart" className="relative p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all group">
                <ShoppingCart className="w-5 h-5" />
                {getCartCount() > 0 && <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm transform group-hover:scale-110 transition-transform">{getCartCount()}</span>}
              </Link>

              {user && (
                <div className="relative" ref={notifRef}>
                  <button onClick={() => { setShowNotifications(!showNotifications); markAsRead(); }} className={`relative p-2.5 rounded-full transition-all ${showNotifications ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400' : 'text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">{unreadCount}</span>}
                  </button>

                  {/* Desktop Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full font-bold">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center"><Bell className="w-10 h-10 mb-3 opacity-20"/> You're all caught up!</div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`p-5 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${n.is_read ? '' : 'bg-cyan-50/50 dark:bg-cyan-900/10'}`}>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">{n.title} {!n.is_read && <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Auth & Menus */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-colors flex items-center gap-1.5 shadow-sm">
                      <LayoutDashboard className="w-4 h-4"/> Admin
                    </Link>
                  )}
                  
                  {/* Smart Create Dropdown for Sellers */}
                  {(user.role === 'guide' || user.role === 'admin') ? (
                    <div className="relative" ref={createRef}>
                      <button onClick={() => setIsCreateOpen(!isCreateOpen)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl transition-colors font-bold text-sm shadow-lg shadow-cyan-500/20">
                        <Plus className="w-4 h-4" /> Create <ChevronDown className={`w-4 h-4 transition-transform ${isCreateOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isCreateOpen && (
                        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in p-2">
                          <Link to="/add-tour" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors font-bold text-sm"><MountainSnow className="w-5 h-5 text-cyan-500"/> New Tour Listing</Link>
                          <Link to="/add-product" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 transition-colors font-bold text-sm mt-1"><ShoppingBag className="w-5 h-5 text-orange-500"/> New Shop Item</Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/become-seller" className="text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Become Partner
                    </Link>
                  )}
                  
                  {/* Profile Avatar Dropdown */}
                  <div className="relative ml-2" ref={profileRef}>
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center focus:outline-none ring-2 ring-transparent hover:ring-cyan-500 rounded-full transition-all duration-300">
                      {user.profile_pic && user.profile_pic !== 'default.png' ? (
                        <img src={`http://localhost:5000${user.profile_pic}`} alt={user.username} className="w-11 h-11 rounded-full object-cover shadow-md" />
                      ) : (
                        <div className="w-11 h-11 bg-gradient-to-tr from-slate-700 to-slate-900 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-4 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-center">
                          {user.profile_pic && user.profile_pic !== 'default.png' ? (
                            <img src={`http://localhost:5000${user.profile_pic}`} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 shadow-md" />
                          ) : (
                            <div className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-3">{user.username.charAt(0)}</div>
                          )}
                          <p className="font-black text-slate-800 dark:text-white truncate text-lg">{user.username}</p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">{user.email}</p>
                        </div>
                        <div className="p-3 space-y-1">
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors"><User className="w-4 h-4 text-slate-400" /> My Profile</Link>
                          <Link to="/cart" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors"><ShoppingCart className="w-4 h-4 text-slate-400" /> Cart & Purchases</Link>
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors"><Heart className="w-4 h-4 text-rose-400" /> Saved Items</Link>
                        </div>
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                           <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-bold text-rose-600 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 ml-2">
                  <Link to="/login" className="px-5 py-2.5 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm">Log In</Link>
                  <Link to="/register" className="px-6 py-2.5 bg-slate-900 dark:bg-cyan-600 text-white rounded-xl hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-all shadow-lg font-bold text-sm">Sign Up</Link>
                </div>
              )}
            </div>

            {/* 📱 MOBILE HAMBURGER BUTTON (Visible only on phones) */}
            <div className="lg:hidden flex items-center gap-1 sm:gap-3">
              <Link to="/cart" className="relative p-2 text-slate-600 dark:text-slate-300">
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">{getCartCount()}</span>}
              </Link>
              <button className="p-2 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* 🍔 FULL SCREEN MOBILE MENU OVERLAY */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <MountainSnow className="w-6 h-6 text-cyan-600" />
                <span className="text-xl font-black text-slate-800 dark:text-white">EcoTour</span>
              </div>
              <button onClick={closeMenu} className="p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-8 flex flex-col gap-8">
              
              {user ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                  <Link to="/profile" onClick={closeMenu} className="flex items-center gap-4">
                    {user.profile_pic && user.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${user.profile_pic}`} className="w-14 h-14 rounded-full object-cover shadow-sm" /> : <div className="w-14 h-14 bg-slate-900 dark:bg-cyan-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-sm">{user.username.charAt(0).toUpperCase()}</div>}
                    <div><p className="font-black text-slate-800 dark:text-white text-lg leading-tight">{user.username}</p><p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-1">View Profile &rarr;</p></div>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/login" onClick={closeMenu} className="p-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl">Log In</Link>
                  <Link to="/register" onClick={closeMenu} className="p-4 text-center bg-slate-900 dark:bg-cyan-600 text-white font-bold rounded-2xl shadow-lg">Sign Up</Link>
                </div>
              )}

              <nav className="flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Discover</p>
                <Link to="/tours" onClick={closeMenu} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"><Compass className="w-6 h-6 text-cyan-500"/> Explore Trips</Link>
                <Link to="/shop" onClick={closeMenu} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"><ShoppingBag className="w-6 h-6 text-orange-500"/> Local Market</Link>
                <Link to="/chat" onClick={closeMenu} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"><MessageCircle className="w-6 h-6 text-indigo-500"/> Community Chat</Link>
                {(user?.role === 'guide' || user?.role === 'admin') && <Link to="/collab" onClick={closeMenu} className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">🤝 Co-op Hub</Link>}
              </nav>

              {user && (
                <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Tools & Actions</p>
                  {user.role === 'admin' && <Link to="/admin" onClick={closeMenu} className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold rounded-2xl flex items-center justify-center gap-2"><LayoutDashboard className="w-5 h-5"/> Admin Panel</Link>}
                  
                  {(user.role === 'guide' || user.role === 'admin') ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/add-tour" onClick={closeMenu} className="p-4 flex flex-col items-center justify-center gap-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold rounded-2xl text-sm"><MountainSnow className="w-5 h-5"/> Add Tour</Link>
                      <Link to="/add-product" onClick={closeMenu} className="p-4 flex flex-col items-center justify-center gap-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold rounded-2xl text-sm"><Package className="w-5 h-5"/> Add Product</Link>
                    </div>
                  ) : (
                    <Link to="/become-seller" onClick={closeMenu} className="p-4 text-center bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><ShieldCheck className="w-5 h-5"/> Become a Partner</Link>
                  )}
                </div>
              )}

              <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-6 grid grid-cols-2 gap-4 pb-8">
                <button onClick={toggleTheme} className="p-4 flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} Theme
                </button>
                <button onClick={toggleCurrency} className="p-4 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm">
                  <RefreshCw className="w-5 h-5" /> {currency}
                </button>
                {user && (
                  <button onClick={() => { logout(); closeMenu(); }} className="col-span-2 p-4 text-center text-rose-600 font-bold border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center justify-center gap-2 transition-colors">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </header>

      {/* 🚀 PAGE ROUTING */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<ExploreTours />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/add-tour" element={<AddTour />} />
          <Route path="/tours/:id" element={<TourDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/chat" element={<CommunityChat />} />
          <Route path="/message/:receiverId" element={<DirectChat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/user/:id" element={<PublicProfile />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/collab" element={<CollaborationHub />} /> 
        </Routes>
      </main>

      <Footer />
      <HelpdeskWidget /> 
    </div>
  );
}

// Wrap to provide router context
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;