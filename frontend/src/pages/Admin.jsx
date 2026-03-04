import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Navigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Map, ShoppingBag, 
  Trash2, ShieldAlert, DollarSign, Activity, 
  Search, Bell, Download, MountainSnow, ClipboardCheck, CheckCircle2, XCircle, BadgeCheck, Headset, Send, ArrowUpRight, Wallet
} from 'lucide-react';

const socket = io.connect('http://localhost:5000');

const Admin = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [userRoleFilter, setUserRoleFilter] = useState('all'); 
  const[kycTab, setKycTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const[stats, setStats] = useState({ totalUsers: 0, totalTours: 0, totalProducts: 0, totalRevenue: 0 });
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Helpdesk States
  const [helpdeskUsers, setHelpdeskUsers] = useState([]);
  const[selectedHelpdeskUser, setSelectedHelpdeskUser] = useState(null);
  const [helpdeskMessages, setHelpdeskMessages] = useState([]);
  const [adminReply, setAdminReply] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData(activeTab, kycTab);
      fetchNotifications();
      
      socket.emit('join_helpdesk', 'admin'); 
      socket.on('admin_helpdesk_ping', () => fetchData('support')); 
      socket.on('receive_helpdesk_message', (data) => {
        setHelpdeskMessages(prev => [...prev, data]);
      });

      return () => {
        socket.off('admin_helpdesk_ping');
        socket.off('receive_helpdesk_message');
      }
    }
  }, [user, activeTab, kycTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  },[helpdeskMessages]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/notifications');
      setNotifications(res.data);
    } catch (err) {}
  };

  const fetchData = async (tab, currentKycTab) => {
    setLoading(true); setDataList([]); setSearchQuery('');
    try {
      if (tab === 'overview') {
        const res = await axios.get('http://localhost:5000/api/admin/stats');
        setStats(res.data);
      } else if (tab === 'applications') {
        const url = currentKycTab === 'pending' ? '/api/applications/pending' : '/api/applications/history';
        const res = await axios.get(`http://localhost:5000${url}`);
        setDataList(res.data);
      } else if (tab === 'support') {
        const res = await axios.get('http://localhost:5000/api/helpdesk/admin/active-chats');
        setHelpdeskUsers(res.data);
      } else if (tab === 'payouts') {
        const res = await axios.get('http://localhost:5000/api/wallet/admin/payouts');
        setDataList(res.data);
      } else {
        const res = await axios.get(`http://localhost:5000/api/admin/${tab}`);
        setDataList(res.data);
      }
    } catch (err) {}
    setLoading(false);
  };

  const handleDelete = async (type, id) => {
    if (window.confirm(`Are you sure you want to permanently delete this ${type}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/${type}/${id}`);
        setDataList(dataList.filter(item => item.id !== id));
      } catch (err) { alert(`Failed to delete ${type}.`); }
    }
  };

  const handleApprove = async (id, userId) => {
    if (window.confirm("Approve this seller and grant them the Verified Badge?")) {
      try {
        await axios.post(`http://localhost:5000/api/applications/approve/${id}`, { user_id: userId });
        setDataList(dataList.filter(app => app.id !== id));
        alert("Seller approved successfully! ✅");
      } catch (err) { alert("Error approving seller."); }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this application?")) {
      try {
        await axios.post(`http://localhost:5000/api/applications/reject/${id}`);
        setDataList(dataList.filter(app => app.id !== id));
      } catch (err) { alert("Error rejecting seller."); }
    }
  };

  const handleMarkPaid = async (payoutId) => {
    if(window.confirm("Mark as paid? Ensure you have actually wired the money to their bank account!")) {
      try {
        await axios.put(`http://localhost:5000/api/wallet/admin/payouts/${payoutId}/pay`);
        fetchData('payouts');
      } catch (err) { alert("Failed to mark as paid."); }
    }
  };

  const openSupportChat = async (supportUser) => {
    setSelectedHelpdeskUser(supportUser);
    socket.emit('join_helpdesk', supportUser.user_id);
    const res = await axios.get(`http://localhost:5000/api/helpdesk/${supportUser.user_id}`);
    setHelpdeskMessages(res.data);
  };

  const sendAdminReply = async () => {
    if (adminReply.trim() !== '' && selectedHelpdeskUser) {
      const msgData = { user_id: selectedHelpdeskUser.user_id, sender_type: 'admin', text: adminReply };
      await socket.emit('send_helpdesk_message', msgData);
      setAdminReply('');
    }
  };

  const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num || 0);

  const getFilteredData = () => {
    if (activeTab === 'overview' || activeTab === 'support') return[];
    let filtered = dataList;
    if (activeTab === 'users' && userRoleFilter !== 'all') {
      const roleMap = { 'admin': 'admin', 'customer': 'user', 'seller': 'guide' };
      filtered = filtered.filter(u => u.role === roleMap[userRoleFilter]);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q)));
    }
    return filtered;
  };

  const handleExportCSV = () => {
    if (displayData.length === 0) return alert("No data to export!");
    const headers = Object.keys(displayData[0]).join(',');
    const rows = displayData.map(obj => Object.values(obj).map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `EcoTour_${activeTab}_Report.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const displayData = getFilteredData();

  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 🖥️ DESKTOP SIDEBAR (Hidden on mobile) */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <Link to="/" className="flex items-center gap-2 text-white font-black tracking-tight hover:opacity-80 transition"><MountainSnow className="w-6 h-6 text-emerald-500" /> Eco Tour Admin</Link>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Main Menu</div>
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard className="w-5 h-5" /> Overview</button>
            <button onClick={() => setActiveTab('support')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'support' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <div className="flex items-center gap-3"><Headset className="w-5 h-5" /> Support Desk</div>
              {helpdeskUsers.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">{helpdeskUsers.length}</span>}
            </button>
            <button onClick={() => { setActiveTab('applications'); setKycTab('pending'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'applications' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><ClipboardCheck className="w-5 h-5" /> KYC Approvals</button>
            <button onClick={() => setActiveTab('payouts')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'payouts' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Wallet className="w-5 h-5" /> Seller Payouts</button>
            <button onClick={() => { setActiveTab('users'); setUserRoleFilter('all'); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users className="w-5 h-5" /> Users & Roles</button>
            <button onClick={() => setActiveTab('tours')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'tours' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Map className="w-5 h-5" /> Tours & Bookings</button>
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><ShoppingBag className="w-5 h-5" /> Shop Inventory</button>
          </nav>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-20 shrink-0">
          <div className="flex items-center text-xs md:text-sm font-medium text-slate-500">
            {/* Mobile Logo visible only when sidebar is hidden */}
            <Link to="/" className="md:hidden flex items-center gap-1.5 text-emerald-700 font-black tracking-tight mr-3"><MountainSnow className="w-5 h-5" /></Link>
            <span className="hidden md:inline">Admin</span><span className="mx-2 hidden md:inline">/</span><span className="capitalize text-slate-900 font-bold">{activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {activeTab !== 'overview' && activeTab !== 'support' && (
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-64" />
              </div>
            )}
            
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-400 hover:text-slate-800 transition p-1">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-sm">Recent Sales</h3></div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm font-medium">No recent activity.</div> : notifications.map((n, i) => (
                        <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 items-start">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'booking' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                          <div><p className="text-sm text-slate-700 leading-tight"><span className="font-bold text-slate-900">{n.username}</span> just {n.type === 'booking' ? 'booked a tour' : 'ordered a product'} for <span className="font-bold text-emerald-600">Rs. {formatCurrency(n.amount)}</span>.</p></div>
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 📱 NEW: MOBILE NAVIGATION TABS (Scrollable Horizontally) */}
        <div className="md:hidden bg-slate-900 text-white flex overflow-x-auto shrink-0 border-b border-slate-800 p-2 gap-2 hide-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><LayoutDashboard className="w-3.5 h-3.5" /> Overview</button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'support' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Headset className="w-3.5 h-3.5" /> Support {helpdeskUsers.length > 0 && <span className="bg-rose-500 w-2 h-2 rounded-full ml-1"></span>}</button>
          <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'applications' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ClipboardCheck className="w-3.5 h-3.5" /> KYC</button>
          <button onClick={() => setActiveTab('payouts')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'payouts' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400'}`}><Wallet className="w-3.5 h-3.5" /> Payouts</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Users className="w-3.5 h-3.5" /> Users</button>
          <button onClick={() => setActiveTab('tours')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'tours' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Map className="w-3.5 h-3.5" /> Tours</button>
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ShoppingBag className="w-3.5 h-3.5" /> Shop</button>
        </div>

        {/* 📱 MOBILE SEARCH BAR (Visible only when not on overview/support) */}
        {activeTab !== 'overview' && activeTab !== 'support' && (
          <div className="md:hidden bg-white p-3 border-b border-slate-200 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8" onClick={() => setShowNotifications(false)}>
          
          <div className="hidden md:flex justify-between items-end mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">{activeTab === 'applications' ? 'KYC Applications' : activeTab}</h1>
              <p className="text-sm text-slate-500 mt-1">{activeTab === 'applications' ? 'Review seller legal documents and track history.' : 'Manage your platform data.'}</p>
            </div>
            {activeTab !== 'overview' && activeTab !== 'support' && (
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-sm"><Download className="w-4 h-4" /> Export CSV</button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 text-slate-400"><Activity className="w-8 h-8 animate-spin mb-4 text-emerald-500" /></div>
          ) : (
            <>
              {/* 🎧 SUPPORT DESK */}
              {activeTab === 'support' && (
                <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] gap-4 md:gap-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className={`w-full md:w-1/3 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${selectedHelpdeskUser ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50"><h2 className="font-black text-lg md:text-xl text-slate-800 flex items-center gap-2"><Headset className="text-emerald-500 w-5 h-5"/> Tickets</h2></div>
                    <div className="overflow-y-auto flex-1 p-2">
                      {helpdeskUsers.length === 0 ? <p className="text-center p-6 text-slate-400 font-medium text-sm">No active requests.</p> : 
                        helpdeskUsers.map(u => (
                          <div key={u.user_id} onClick={() => openSupportChat(u)} className={`p-3 md:p-4 rounded-xl cursor-pointer transition mb-2 flex gap-3 ${selectedHelpdeskUser?.user_id === u.user_id ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                            {u.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${u.profile_pic}`} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" /> : <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-black">{u.username.charAt(0)}</div>}
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-slate-800 text-sm">{u.username}</h4>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{u.last_message}</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className={`flex-1 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col ${!selectedHelpdeskUser ? 'hidden md:flex' : 'flex'}`}>
                    {selectedHelpdeskUser ? (
                      <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                          {/* Mobile Back Button */}
                          <button onClick={() => setSelectedHelpdeskUser(null)} className="md:hidden p-1 mr-1 text-slate-500 bg-white rounded-md border"><ArrowUpRight className="w-4 h-4 rotate-225" /></button>
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <h2 className="font-black text-slate-800 text-sm md:text-base">Chatting with {selectedHelpdeskUser.username}</h2>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 flex flex-col gap-4">
                          {helpdeskMessages.map((msg, i) => (
                            <div key={i} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.sender_type === 'admin' ? 'self-end items-end' : 'self-start items-start'}`}>
                              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 mb-1 px-1 uppercase tracking-wider">{msg.sender_type === 'admin' ? 'You' : selectedHelpdeskUser.username}</span>
                              <div className={`px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-sm text-sm ${msg.sender_type === 'admin' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                          <input type="text" value={adminReply} onChange={(e) => setAdminReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()} placeholder="Type reply..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
                          <button onClick={sendAdminReply} disabled={!adminReply.trim()} className="bg-emerald-600 text-white p-2.5 rounded-full hover:bg-emerald-700 transition disabled:opacity-50"><Send className="w-4 h-4 ml-0.5"/></button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        <Headset className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
                        <p className="font-bold text-sm md:text-base">Select a user to begin assisting them.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 📊 OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div><span className="flex items-center text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><ArrowUpRight className="w-3 h-3 mr-1" /> +14.5%</span></div><p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Gross Revenue</p><h3 className="text-xl md:text-2xl font-black text-slate-900">Rs. {formatCurrency(stats.totalRevenue)}</h3></div>
                  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div></div><p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Total Users</p><h3 className="text-xl md:text-2xl font-black text-slate-900">{stats.totalUsers}</h3></div>
                  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-amber-50 rounded-lg"><Map className="w-5 h-5 text-amber-600" /></div></div><p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Active Tours</p><h3 className="text-xl md:text-2xl font-black text-slate-900">{stats.totalTours}</h3></div>
                  <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-indigo-50 rounded-lg"><ShoppingBag className="w-5 h-5 text-indigo-600" /></div></div><p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Shop Inventory</p><h3 className="text-xl md:text-2xl font-black text-slate-900">{stats.totalProducts}</h3></div>
                </div>
              )}

              {/* 🏦 PAYOUTS MANAGER */}
              {activeTab === 'payouts' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Seller</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Bank Details</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Amount</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase text-right">Status / Action</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dataList.length === 0 ? <tr><td colSpan="4" className="p-8 md:p-12 text-center text-slate-400 text-xs md:text-sm font-medium">No payout requests found.</td></tr> : dataList.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="px-4 md:px-6 py-3 md:py-4"><p className="font-bold text-slate-900 text-sm">{req.username}</p><p className="text-[10px] md:text-xs text-slate-500">{req.email}</p></td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono text-slate-600">{req.bank_details}</td>
                            <td className="px-4 md:px-6 py-3 md:py-4 font-black text-amber-600 text-sm">Rs. {formatCurrency(req.amount)}</td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                              {req.status === 'pending' ? (
                                <button onClick={() => handleMarkPaid(req.id)} className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 text-white text-[10px] md:text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-600 transition">Mark Paid</button>
                              ) : (
                                <span className="px-2 md:px-3 py-1 bg-emerald-100 text-emerald-700 font-black text-[9px] md:text-[10px] uppercase rounded-md tracking-widest">Paid ✅</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 👑 KYC APPLICATIONS */}
              {activeTab === 'applications' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-3 md:p-4 border-b border-slate-100 flex gap-2 bg-slate-50/50 overflow-x-auto hide-scrollbar">
                    <button onClick={() => setKycTab('pending')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${kycTab === 'pending' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>Pending</button>
                    <button onClick={() => setKycTab('history')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${kycTab === 'history' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>History</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Applicant</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Contact & PAN</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">Details</th><th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase text-right">{kycTab === 'pending' ? 'Action' : 'Status & Date'}</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayData.length === 0 ? <tr><td colSpan="4" className="p-8 md:p-12 text-center text-slate-400 text-xs md:text-sm font-medium">No records found.</td></tr> : displayData.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50">
                            <td className="px-4 md:px-6 py-3 md:py-4"><p className="font-bold text-slate-900 text-sm">{app.full_name}</p><p className="text-[10px] md:text-xs text-slate-500">ID: {app.user_id}</p></td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm"><p className="text-slate-800 font-medium">{app.phone} / {app.email}</p><p className="text-slate-500 font-mono text-[10px] md:text-xs mt-1 border inline-block px-1.5 py-0.5 rounded bg-white">PAN: {app.pan_number}</p></td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm"><p className="text-slate-600"><span className="font-semibold">Nation:</span> {app.nationality}</p><p className="text-slate-600"><span className="font-semibold">Exp:</span> {app.experience_years} Yrs</p></td>
                            <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                              {kycTab === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <a href={`http://localhost:5000${app.certificate_url}`} target="_blank" rel="noreferrer" className="px-2 md:px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-bold rounded-lg border border-blue-100">ID</a>
                                  <button onClick={() => handleApprove(app.id, app.user_id)} className="px-2 md:px-3 py-1.5 bg-emerald-600 text-white text-[10px] md:text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> <span className="hidden sm:inline">Approve</span></button>
                                  <button onClick={() => handleReject(app.id)} className="px-2 md:px-3 py-1.5 bg-rose-50 text-rose-700 text-[10px] md:text-xs font-bold rounded-lg flex items-center gap-1"><XCircle className="w-3 h-3"/> <span className="hidden sm:inline">Reject</span></button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`px-2 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-md ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{app.status}</span>
                                  <span className="text-[10px] md:text-xs text-slate-400 font-medium">{new Date(app.updated_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 👥 RESTORED USERS, TOURS, & PRODUCTS TABLES */}
              {(activeTab === 'users' || activeTab === 'tours' || activeTab === 'products') && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in duration-300">
                  
                  {activeTab === 'users' && (
                    <div className="p-3 md:p-4 border-b border-slate-100 flex gap-2 bg-slate-50/50 overflow-x-auto hide-scrollbar">
                      <button onClick={() => setUserRoleFilter('all')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${userRoleFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>All</button>
                      <button onClick={() => setUserRoleFilter('admin')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${userRoleFilter === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>Admins</button>
                      <button onClick={() => setUserRoleFilter('customer')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${userRoleFilter === 'customer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>Customers</button>
                      <button onClick={() => setUserRoleFilter('seller')} className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all ${userRoleFilter === 'seller' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>Sellers</button>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">ID</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">{activeTab === 'users' ? 'User Info' : 'Details'}</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">{activeTab === 'users' ? 'Role' : activeTab === 'tours' ? 'Guide' : 'Seller'}</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase">{activeTab === 'users' ? 'Joined' : 'Price'}</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-semibold text-slate-500 uppercase text-right">Act</th>
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-slate-100">
                        {displayData.length === 0 ? (
                          <tr><td colSpan="5" className="p-8 md:p-12 text-center text-slate-400 text-xs md:text-sm font-medium">No records found.</td></tr>
                        ) : (
                          displayData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono text-slate-400">#{item.id}</td>
                              
                              <td className="px-4 md:px-6 py-3 md:py-4">
                                <div className="flex items-center gap-3">
                                  {activeTab === 'users' ? (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200 shrink-0">
                                      {(item.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                      {item.image_url ? <img src={`http://localhost:5000${item.image_url}`} className="w-full h-full object-cover" /> : <MountainSnow className="w-full h-full p-2 text-slate-300" />}
                                    </div>
                                  )}
                                  <div className="overflow-hidden">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px] md:max-w-[200px]">{item.username || item.title}</p>
                                      {activeTab === 'users' && item.is_verified ? <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified" /> : null}
                                    </div>
                                    {activeTab === 'users' && <p className="text-[10px] md:text-xs text-slate-500 truncate max-w-[120px] md:max-w-[200px]">{item.email}</p>}
                                    {activeTab !== 'users' && <p className="text-[10px] md:text-xs text-slate-400 w-32 md:w-48 truncate">{item.description}</p>}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-4 md:px-6 py-3 md:py-4">
                                {activeTab === 'users' ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-xs font-bold uppercase tracking-wider ${
                                    item.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 
                                    item.role === 'guide' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {item.role === 'user' ? 'Customer' : item.role === 'guide' ? 'Seller' : 'Admin'}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-600 font-medium">
                                    <ShieldAlert className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[80px] md:max-w-[150px]">{item.guide_name || item.seller_name}</span>
                                  </div>
                                )}
                              </td>

                              <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-slate-600">
                                {activeTab === 'users' 
                                  ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) 
                                  : <span className="text-emerald-700">Rs. {formatCurrency(item.price)}</span>
                                }
                              </td>

                              <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                                <div className="flex justify-end items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                  {!(activeTab === 'users' && item.id === user.id) && (
                                    <button 
                                      onClick={() => handleDelete(activeTab === 'users' ? 'user' : activeTab === 'tours' ? 'tour' : 'product', item.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;