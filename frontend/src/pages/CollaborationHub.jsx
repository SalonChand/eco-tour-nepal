import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { Navigate, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { Users, MapPin, Send, MessageSquare, ShieldCheck, Phone, Mail, Building, User as UserIcon } from 'lucide-react';

const socket = io.connect('http://localhost:5000');

const CollaborationHub = () => {
  const { user } = useContext(AuthContext);
  const [directory, setDirectory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Only proceed if the user is a guide/admin AND has a specific region set
    if (user && (user.role === 'guide' || user.role === 'admin') && user.region && user.region !== 'Not Specified') {
      
      // 1. Fetch the Regional Directory
      const fetchDirectory = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/region/${user.region}`);
          // Filter out the current user so they don't see themselves in the directory
          setDirectory(res.data.filter(u => u.id !== user.id));
          setLoading(false);
        } catch (err) {
          console.error("Failed to fetch directory");
          setLoading(false);
        }
      };
      fetchDirectory();

      // 2. Join the Live Regional Socket Room
      socket.emit('join_regional_room', user.region);

      // 3. Listen for incoming live messages
      const handleReceive = (data) => {
        setMessages((prev) => [...prev, data]);
      };
      socket.on('receive_regional_message', handleReceive);

      return () => {
        socket.off('receive_regional_message', handleReceive);
      };
    } else {
      setLoading(false);
    }
  },[user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== '' && user) {
      const msgData = {
        region: user.region,
        author: user.username,
        profile_pic: user.profile_pic,
        is_verified: user.is_verified,
        user_id: user.id,
        text: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      await socket.emit('send_regional_message', msgData);
      setCurrentMessage('');
    }
  };

  // 🛡️ Security & Setup Checks
  if (!user || (user.role !== 'guide' && user.role !== 'admin')) return <Navigate to="/" />;
  
  if (!user.region || user.region === 'Not Specified') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <MapPin className="w-20 h-20 text-emerald-500 mb-6 animate-bounce" />
        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Set Your Region</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">To join the Collaboration Hub, you need to tell us where you operate. Please edit your profile and select an Operating Region.</p>
        <Link to="/profile" className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg">Go to Profile</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-80px)] flex flex-col font-sans transition-colors duration-500">
      
      {/* Header */}
      <div className="bg-slate-900 dark:bg-black py-8 px-4 text-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-emerald-900/20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Regional Co-op Hub</h1>
          <p className="text-emerald-400 font-bold flex items-center justify-center gap-1.5"><MapPin className="w-4 h-4"/> {user.region}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex-grow p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 h-full">
        
        {/* 📚 LEFT: REGIONAL DIRECTORY */}
        <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-[500px] lg:h-[calc(100vh-220px)] transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-3xl">
            <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2"><Users className="text-emerald-500 w-5 h-5"/> Local Partners ({directory.length})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? <p className="text-center text-slate-400 mt-10">Loading network...</p> : directory.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10 p-4">You are the first guide registered in this region! Say hello in the chat.</p>
            ) : (
              directory.map(partner => (
                <div key={partner.id} className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group transition-colors">
                  <div className="flex items-center gap-3">
                    {partner.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${partner.profile_pic}`} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center font-black"><UserIcon className="w-5 h-5" /></div>}
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1">
                        {partner.username} {partner.is_verified ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> : null}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        {partner.team_type === 'group' ? <Building className="w-3 h-3"/> : <UserIcon className="w-3 h-3"/>}
                        {partner.team_type === 'group' ? `Team of ${partner.team_size}` : 'Solo Guide'}
                      </p>
                    </div>
                  </div>
                  <Link to={`/user/${partner.id}`} className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full hover:bg-emerald-50 hover:text-emerald-600 transition"><MessageSquare className="w-4 h-4" /></Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 💬 RIGHT: LIVE REGIONAL CHAT */}
        <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col h-[500px] lg:h-[calc(100vh-220px)] transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-3xl flex justify-between items-center">
            <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2"><MessageSquare className="text-emerald-500 w-5 h-5"/> Live Bulletin Board</h2>
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium text-sm">Post a message to your regional network!</p>
                <p className="text-xs mt-1">Need coverage for a tour? Looking for group discounts? Ask here.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.user_id === user.id;
                return (
                  <div key={i} className={`flex gap-3 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <Link to={`/user/${msg.user_id}`} className="shrink-0 mt-1">
                        {msg.profile_pic && msg.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${msg.profile_pic}`} className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200" /> : <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center font-black text-xs">{msg.author.charAt(0)}</div>}
                      </Link>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      <div className="flex items-center gap-1 mb-1 mx-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{msg.author}</span>
                        {msg.is_verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 mx-1">{msg.time}</span>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 rounded-b-3xl">
            <input 
              type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Broadcast to the region..." 
              className="flex-grow border border-slate-200 dark:border-slate-700 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm transition-colors"
            />
            <button onClick={sendMessage} disabled={!currentMessage.trim()} className="bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-emerald-700 transition shadow-md shrink-0">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollaborationHub;