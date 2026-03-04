import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, ArrowLeft, ShieldCheck, User, Image as ImageIcon, Camera, X, Reply, Heart, BadgeCheck, Languages } from 'lucide-react';

const socket = io.connect('http://localhost:5000');

const DirectChat = () => {
  const { receiverId } = useParams();
  const { user } = useContext(AuthContext);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [receiverProfile, setReceiverProfile] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [translatingId, setTranslatingId] = useState(null);
  const[zoomedImage, setZoomedImage] = useState(null);

  const messagesEndRef = useRef(null);

  const roomId = user ? `room_${Math.min(user.id, parseInt(receiverId))}_${Math.max(user.id, parseInt(receiverId))}` : null;

  useEffect(() => {
    if (!user) return;

    const fetchReceiver = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${receiverId}`);
        setReceiverProfile(res.data.user);
      } catch (err) {}
    };
    fetchReceiver();

    socket.emit('join_private_room', roomId);

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/private/${roomId}`);
        const parsedData = res.data.map(msg => ({
          ...msg, liked_by: typeof msg.liked_by === 'string' ? JSON.parse(msg.liked_by || '[]') :[]
        }));
        setMessageList(parsedData);
      } catch (err) {}
    };
    fetchHistory();

    const handleReceiveMessage = (data) => setMessageList((list) =>[...list, { ...data, liked_by: [] }]);
    socket.on('receive_private_message', handleReceiveMessage);

    const handleUpdateLikes = (data) => {
      setMessageList((list) => list.map(msg => msg.id === data.msg_id ? { ...msg, liked_by: data.liked_by } : msg));
    };
    socket.on('update_private_likes', handleUpdateLikes);

    return () => { socket.off('receive_private_message'); socket.off('update_private_likes'); };
  }, [user, receiverId, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLike = (msgId, currentLikes) => {
    if (!user) return;
    let newLikes = [...currentLikes];
    if (newLikes.includes(user.id)) newLikes = newLikes.filter(id => id !== user.id); 
    else newLikes.push(user.id); 

    socket.emit('like_private_message', { msg_id: msgId, liked_by: newLikes, room_id: roomId });
    setMessageList((list) => list.map(msg => msg.id === msgId ? { ...msg, liked_by: newLikes } : msg));
  };

  const sendMessage = async () => {
    if ((currentMessage.trim() !== '' || selectedImage) && user) {
      let uploadedImageUrl = null;
      
      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        try {
          const res = await axios.post('http://localhost:5000/api/chat/upload-image', formData);
          uploadedImageUrl = res.data.image_url;
        } catch (err) { return; }
      }

      const messageData = {
        room_id: roomId,
        sender_id: user.id,
        receiver_id: parseInt(receiverId),
        text: currentMessage,
        sender_name: user.username,
        sender_pic: user.profile_pic,
        is_verified: user.is_verified,
        created_at: new Date().toISOString(),
        image_url: uploadedImageUrl,
        reply_to_author: replyingTo ? replyingTo.sender_name : null,
        reply_to_text: replyingTo ? replyingTo.text : null,
      };
      
      await socket.emit('send_private_message', messageData);
      setCurrentMessage(''); setSelectedImage(null); setImagePreview(null); setReplyingTo(null);
    }
  };

  const handleTranslate = async (msgId, text) => {
    if (!text) return;
    setTranslatingId(msgId);
    try {
      const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|en`);
      const translatedText = res.data.responseData.translatedText;
      setMessageList((list) => list.map(msg => msg.id === msgId ? { ...msg, translated_text: translatedText } : msg));
    } catch (err) { alert("Translation service unavailable."); }
    setTranslatingId(null);
  };

  const renderTextWithMentions = (text) => {
    if (!text) return null;
    return text.split(' ').map((word, i) => {
      if (word.startsWith('@')) return <span key={i} className="text-indigo-300 font-black cursor-pointer hover:underline">{word} </span>;
      return word + ' ';
    });
  };

  if (!user) return <div className="text-center mt-32 text-xl font-bold text-rose-500">Please log in.</div>;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 font-sans relative">
      
      {/* 🔍 FULL SCREEN IMAGE ZOOM MODAL (Lens cursor removed!) */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed Fullscreen" 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px] transition-colors duration-500">
        
        <div className="bg-slate-900 text-white p-4 md:p-6 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <Link to={-1} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft className="w-5 h-5" /></Link>
            {receiverProfile ? (
              <Link to={`/user/${receiverId}`} className="flex items-center gap-3 group">
                {receiverProfile.profile_pic && receiverProfile.profile_pic !== 'default.png' ? (
                  <img src={`http://localhost:5000${receiverProfile.profile_pic}`} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-indigo-400 transition" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-700 flex items-center justify-center font-bold border-2 border-slate-600"><User className="w-5 h-5 md:w-6 md:h-6 text-slate-300" /></div>
                )}
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight flex items-center gap-1 group-hover:text-indigo-300 transition">
                    {receiverProfile.username} {receiverProfile.is_verified && <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-emerald-500" />}
                  </h2>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium capitalize">{receiverProfile.role}</p>
                </div>
              </Link>
            ) : (
              <div className="animate-pulse flex items-center gap-3"><div className="w-12 h-12 bg-slate-700 rounded-full"></div><div className="w-24 h-4 bg-slate-700 rounded"></div></div>
            )}
          </div>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold relative z-10 hidden sm:block">Private Chat 🔒</span>
        </div>

        <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-6 scroll-smooth transition-colors duration-500">
          {messageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">This is a secure 1-on-1 connection.</p>
            </div>
          ) : (
            messageList.map((msg, index) => {
              const isMe = msg.sender_id === user.id;
              const likesCount = msg.liked_by?.length || 0;
              const didILike = msg.liked_by?.includes(user?.id);

              return (
                <div key={index} className={`flex gap-3 w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                  
                  {!isMe && (
                    <div className="shrink-0 mt-1">
                      {msg.sender_pic && msg.sender_pic !== 'default.png' ? <img src={`http://localhost:5000${msg.sender_pic}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-sm" /> : <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center font-black text-xs md:text-sm">{msg.sender_name.charAt(0).toUpperCase()}</div>}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                    <div className="flex items-center gap-2">
                      
                      {isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full"><Reply className="w-4 h-4" /></button>
                        </div>
                      )}

                      <div className="relative">
                        {msg.reply_to_author && (
                          <div className={`p-2 mb-1 text-xs md:text-sm rounded-lg opacity-80 border-l-4 ${isMe ? 'bg-indigo-700/50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                            <p className="font-bold text-[10px] md:text-xs mb-0.5">{msg.reply_to_author}</p>
                            <p className="truncate max-w-[150px] md:max-w-[200px]">{msg.reply_to_text}</p>
                          </div>
                        )}

                        <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed relative ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                          
                          {/* 📸 IMAGE HERE (cursor-pointer instead of zoom-in) */}
                          {msg.image_url && (
                            <img 
                              src={`http://localhost:5000${msg.image_url}`} 
                              alt="attachment"
                              onClick={() => setZoomedImage(`http://localhost:5000${msg.image_url}`)}
                              className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-xl mb-2 cursor-pointer hover:opacity-85 transition-opacity border border-black/10 dark:border-white/10 shadow-sm" 
                            />
                          )}

                          {msg.text && (
                            <div>
                              <p className="whitespace-pre-wrap">{renderTextWithMentions(msg.text)}</p>
                              {msg.translated_text && (
                                <div className={`mt-2 pt-2 border-t text-xs md:text-sm italic ${isMe ? 'border-indigo-400/50 text-indigo-100' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                  <Languages className="w-3 h-3 inline mr-1 opacity-70"/> {msg.translated_text}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {likesCount > 0 && (
                            <div className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] md:text-xs font-bold text-rose-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700`} onClick={() => handleLike(msg.id, msg.liked_by)}>
                              ❤️ {likesCount}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isMe && (
                        <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                          {msg.text && !msg.translated_text && (
                            <button onClick={() => handleTranslate(msg.id, msg.text)} className={`p-1.5 rounded-full transition ${translatingId === msg.id ? 'text-indigo-500 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'}`} title="Translate to English"><Languages className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleLike(msg.id, msg.liked_by ||[])} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full"><Heart className={`w-4 h-4 ${didILike ? 'fill-rose-500 text-rose-500' : ''}`} /></button>
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full"><Reply className="w-4 h-4" /></button>
                        </div>
                      )}

                    </div>
                    <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 mt-1 mx-1 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} /> 
        </div>

        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col shrink-0 transition-colors duration-500">
          {(replyingTo || imagePreview) && (
            <div className="bg-slate-50 dark:bg-slate-950 px-4 md:px-6 py-2 md:py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                {replyingTo && (
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-bold text-indigo-600 flex items-center gap-1"><Reply className="w-3 h-3"/> Replying to {replyingTo.sender_name}</span>
                    <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate max-w-[150px] md:max-w-[200px]">{replyingTo.text}</span>
                  </div>
                )}
                {imagePreview && <img src={imagePreview} className="h-10 w-10 md:h-12 md:w-12 rounded object-cover border border-slate-300 shadow-sm" />}
              </div>
              <button onClick={() => { setReplyingTo(null); setImagePreview(null); setSelectedImage(null); }} className="p-1 md:p-1.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:bg-rose-100 hover:text-rose-600"><X className="w-3 h-3 md:w-4 md:h-4"/></button>
            </div>
          )}

          <div className="p-3 md:p-4 flex gap-2 md:gap-3 items-end relative">
            <div className="flex gap-1 shrink-0 pb-1">
              <label className="p-2 md:p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition" title="Upload Image">
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <textarea 
              value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message securely... (Use @ to mention)" 
              className="flex-grow border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl px-4 py-2.5 md:px-5 md:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm md:text-base font-medium transition-all min-h-[40px] md:min-h-[50px] max-h-24 md:max-h-32 resize-none"
              rows="1"
            />
            <button onClick={sendMessage} disabled={!currentMessage.trim() && !selectedImage} className="bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-indigo-700 transition shadow-lg shrink-0 mb-0.5">
              <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DirectChat;