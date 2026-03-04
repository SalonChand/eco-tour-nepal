import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Failed to send OTP.'); }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      setMessage(res.data.message);
      setStep(3);
    } catch (err) { setError(err.response?.data?.message || 'Invalid or expired OTP.'); }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', { email, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to reset password.'); }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 bg-slate-50 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-slate-100 relative z-10">
        
        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100"><Mail className="w-6 h-6" /></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Forgot Password?</h2>
              <p className="text-slate-500 text-sm font-medium">We'll send you a recovery code.</p>
            </div>
            
            {error && <p className="text-rose-500 mb-4 text-sm font-bold bg-rose-50 p-3 rounded-xl text-center border border-rose-100">{error}</p>}
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-sm">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:ring-2 focus:ring-emerald-500 transition outline-none font-medium text-slate-700 text-sm" placeholder="name@example.com" required />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-emerald-600 transition duration-300 shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 mt-2">
                {isLoading ? 'Sending...' : 'Send Code'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-indigo-100"><KeyRound className="w-6 h-6" /></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Enter OTP</h2>
              <p className="text-slate-500 text-sm font-medium">Code sent to <span className="font-bold text-slate-700">{email}</span></p>
            </div>
            
            {message && <p className="text-emerald-600 mb-4 text-sm font-bold bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100">{message}</p>}
            {error && <p className="text-rose-500 mb-4 text-sm font-bold bg-rose-50 p-3 rounded-xl text-center border border-rose-100">{error}</p>}
            
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-sm">6-Digit Code</label>
                <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition outline-none font-black text-center tracking-[0.5em] text-lg text-slate-700" placeholder="••••••" required />
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition duration-300 shadow-lg disabled:opacity-70 flex justify-center items-center gap-2 mt-2">
                {isLoading ? 'Verifying...' : 'Verify Code'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100"><Lock className="w-6 h-6" /></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Secure Account</h2>
              <p className="text-slate-500 text-sm font-medium">Create a new, strong password.</p>
            </div>
            
            {message && <p className="text-emerald-600 mb-4 text-sm font-bold bg-emerald-50 p-3 rounded-xl text-center border border-emerald-100">{message}</p>}
            {error && <p className="text-rose-500 mb-4 text-sm font-bold bg-rose-50 p-3 rounded-xl text-center border border-rose-100">{error}</p>}
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-sm">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl py-3 pl-10 pr-4 bg-slate-50 focus:ring-2 focus:ring-emerald-500 transition outline-none font-medium text-slate-700 text-sm" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 transition duration-300 shadow-lg disabled:opacity-70 flex justify-center items-center mt-2">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <Link to="/login" className="text-slate-500 text-sm font-bold hover:text-slate-800 flex items-center justify-center gap-1 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;