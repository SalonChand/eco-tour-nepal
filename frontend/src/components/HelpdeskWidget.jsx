import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { MessageSquare, X, Send, Headset } from 'lucide-react';

const socket = io.connect('http://localhost:5000');

const HelpdeskWidget = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Only run if the user is logged in AND they are NOT the admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      // Join their personal helpdesk room
      socket.emit('join_helpdesk', user.id);

      // Fetch history
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/helpdesk/${user.id}`);
          setChatHistory(res.data);
        } catch (err) { console.error("Failed to load helpdesk history"); }
      };
      fetchHistory();

      // Listen for replies from Admin
      const handleReceive = (data) => setChatHistory((prev) => [...prev, data]);
      socket.on('receive_helpdesk_message', handleReceive);

      return () => socket.off('receive_helpdesk_message', handleReceive);
    }
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isOpen]);

  const sendMessage = async () => {
    if (message.trim() !== '' && user) {
      const msgData = { user_id: user.id, sender_type: 'user', text: message };
      await socket.emit('send_helpdesk_message', msgData);
      setMessage('');
    }
  };

  // Don't show widget to Admins (they have the dashboard) or logged-out users
  if (!user || user.role === 'admin') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      
      {/* 🔴 Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        >
          <Headset className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {/* 💬 Open Chat Window */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-full"><Headset className="w-4 h-4" /></div>
              <div>
                <h3 className="font-black text-sm">Eco Tour Support</h3>
                <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">We usually reply instantly</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 bg-slate-50 overflow-y-auto flex flex-col gap-3">
            <div className="text-center my-4">
              <Headset className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">How can we help you today?</p>
            </div>
            
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col max-w-[85%] ${msg.sender_type === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-2.5 text-sm rounded-2xl shadow-sm ${msg.sender_type === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm'}`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-medium px-1">
                  {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question..." 
              className="flex-grow border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
            <button onClick={sendMessage} disabled={!message.trim()} className="bg-slate-900 text-white p-2.5 rounded-full hover:bg-emerald-600 transition disabled:opacity-50">
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default HelpdeskWidget;