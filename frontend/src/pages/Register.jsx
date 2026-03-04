import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Gift } from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref'); // 🤝 NEW: Look for ?ref= in the URL!

  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    referred_by: refCode || '' // Pre-fill if a referral code exists
  });

  const [message, setMessage] = useState('');
  const[error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData,[e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 2000); 
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Network error!';
      setError(errorMsg);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 bg-slate-50 relative overflow-hidden font-sans">
      
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Join Eco Tour</h2>
          <p className="text-slate-500 font-medium text-sm">Create your account to get started.</p>
        </div>

        {/* 🤝 NEW: Affiliate Badge Visual Indicator */}
        {refCode && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mb-6 shadow-sm">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>You were invited by <span className="font-black text-emerald-700">{refCode}</span>!</span>
          </div>
        )}
        
        {message && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mb-5 text-sm font-bold text-center border border-emerald-100">{message}</div>}
        {error && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl mb-5 text-sm font-bold text-center border border-rose-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-sm">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:ring-2 focus:ring-emerald-500 transition outline-none font-medium text-slate-700 text-sm" placeholder="e.g. MountainExplorer" required />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-sm">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:ring-2 focus:ring-emerald-500 transition outline-none font-medium text-slate-700 text-sm" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-sm">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:ring-2 focus:ring-emerald-500 transition outline-none font-medium text-slate-700 text-sm" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition duration-300 shadow-lg disabled:opacity-70 mt-2 flex justify-center items-center">
            {isLoading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 pt-5 text-sm">
          <p className="text-slate-500 font-medium">Already have an account? <Link to="/login" className="text-emerald-600 font-black hover:underline ml-1">Sign in</Link></p>
        </div>

      </div>
    </div>
  );
};

export default Register;