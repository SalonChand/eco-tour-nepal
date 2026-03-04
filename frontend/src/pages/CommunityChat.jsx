import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, MessageCircle, Users, BadgeCheck, Image as ImageIcon, Camera, X, Reply, Heart, Languages } from 'lucide-react';

const socket = io.connect('http://localhost:5000');

const CommunityChat = () => {
  const { user } = useContext(AuthContext);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const[replyingTo, setReplyingTo] = useState(null);
  const [translatingId, setTranslatingId] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/chat');
        const parsedData = response.data.map(msg => ({
          ...msg, liked_by: typeof msg.liked_by === 'string' ? JSON.parse(msg.liked_by || '[]') :[]
        }));
        setMessageList(parsedData);
      } catch (err) { console.error("History error", err); }
    };
    fetchHistory();

    socket.on('receive_message', (data) => setMessageList((list) =>[...list, { ...data, liked_by: [] }]));
    socket.on('update_likes', (data) => {
      setMessageList((list) => list.map(msg => msg.id === data.msg_id ? { ...msg, liked_by: data.liked_by } : msg));
    });

    return () => { socket.off('receive_message'); socket.off('update_likes'); };
  },[]);

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

    socket.emit('like_message', { msg_id: msgId, liked_by: newLikes });
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
        author: user.username,
        text: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        profile_pic: user.profile_pic,
        is_verified: user.is_verified,
        user_id: user.id,
        image_url: uploadedImageUrl,
        reply_to_author: replyingTo ? replyingTo.author : null,
        reply_to_text: replyingTo ? replyingTo.text : null,
      };
      
      await socket.emit('send_message', messageData);
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
      if (word.startsWith('@')) return <span key={i} className="text-emerald-500 font-black cursor-pointer hover:underline">{word} </span>;
      return word + ' ';
    });
  };

  if (!user) return <div className="text-center mt-32 text-xl font-bold text-rose-500">Please log in to chat.</div>;

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
        
        <div className="bg-slate-900 text-white p-4 md:p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400"><MessageCircle className="w-5 h-5 md:w-6 md:h-6" /></div>
            <div><h2 className="text-xl md:text-2xl font-black tracking-tight">Global Chat</h2><p className="text-slate-400 text-xs md:text-sm font-medium">Say hello to the community!</p></div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Live
          </span>
        </div>

        <div className="flex-grow p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col gap-6 scroll-smooth transition-colors duration-500">
          {messageList.map((msg, index) => {
            const isMe = msg.author === user?.username;
            const likesCount = msg.liked_by?.length || 0;
            const didILike = msg.liked_by?.includes(user?.id);

            return (
              <div key={index} className={`flex gap-3 w-full group ${isMe ? 'justify-end' : 'justify-start'}`}>
                
                {!isMe && (
                  <Link to={`/user/${msg.user_id}`} className="shrink-0 mt-1 hover:opacity-80 transition" title="View Profile">
                    {msg.profile_pic && msg.profile_pic !== 'default.png' ? <img src={`http://localhost:5000${msg.profile_pic}`} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-800" /> : <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex justify-center items-center font-black">{msg.author.charAt(0)}</div>}
                  </Link>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                  
                  <div className="flex items-center gap-1.5 mb-1 mx-1">
                    <Link to={`/user/${msg.user_id}`} className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition">
                      {msg.author}
                    </Link>
                    {msg.is_verified && <BadgeCheck className="w-3 h-3 text-emerald-500" title="Verified" />}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium ml-1">{msg.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full"><Reply className="w-4 h-4" /></button>
                      </div>
                    )}

                    <div className="relative">
                      {msg.reply_to_author && (
                        <div className={`p-2 mb-1 text-xs md:text-sm rounded-lg opacity-80 border-l-4 ${isMe ? 'bg-emerald-700/50 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                          <p className="font-bold text-[10px] md:text-xs mb-0.5">{msg.reply_to_author}</p>
                          <p className="truncate max-w-[150px] md:max-w-[200px]">{msg.reply_to_text}</p>
                        </div>
                      )}

                      <div className={`p-3 md:p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed relative ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm'}`}>
                        
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
                              <div className={`mt-2 pt-2 border-t text-xs md:text-sm italic ${isMe ? 'border-emerald-400/50 text-emerald-100' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
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
                          <button onClick={() => handleTranslate(msg.id, msg.text)} className={`p-1.5 rounded-full transition ${translatingId === msg.id ? 'text-emerald-500 bg-emerald-50 animate-pulse' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'}`} title="Translate to English"><Languages className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleLike(msg.id, msg.liked_by ||[])} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-full"><Heart className={`w-4 h-4 ${didILike ? 'fill-rose-500 text-rose-500' : ''}`} /></button>
                        <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full"><Reply className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} /> 
        </div>

        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col shrink-0 transition-colors duration-500">
          {(replyingTo || imagePreview) && (
            <div className="bg-slate-50 dark:bg-slate-950 px-4 md:px-6 py-2 md:py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                {replyingTo && (
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-bold text-emerald-600 flex items-center gap-1"><Reply className="w-3 h-3"/> Replying to {replyingTo.author}</span>
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
              <label className="p-2 md:p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition" title="Upload Image">
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              <label className="p-2 md:p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition md:hidden" title="Take Photo">
                <Camera className="w-5 h-5 md:w-6 md:h-6" />
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <textarea 
              value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your message... (Use @ to mention)" 
              className="flex-grow border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl px-4 py-2.5 md:px-5 md:py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-800 dark:text-white text-sm md:text-base font-medium transition-all min-h-[40px] md:min-h-[50px] max-h-24 md:max-h-32 resize-none"
              rows="1"
            />
            <button onClick={sendMessage} disabled={!currentMessage.trim() && !selectedImage} className="bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-emerald-700 transition shadow-lg shrink-0 mb-0.5">
              <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityChat;