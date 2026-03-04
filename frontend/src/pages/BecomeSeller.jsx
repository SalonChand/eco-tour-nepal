import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, UploadCloud, CheckCircle2 } from 'lucide-react';

const BecomeSeller = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: user?.email || '', dob: '', 
    nationality: 'Nepali', experience_years: '0', pan_number: ''
  });
  const [certificate, setCertificate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) return <div className="text-center mt-32 text-xl font-bold text-rose-600">Please log in to apply.</div>;
  if (user.role === 'guide' || user.role === 'admin') return <div className="text-center mt-32 text-xl font-bold text-emerald-600">You are already a verified seller/admin! ✅</div>;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setCertificate(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); setError('');
    
    if (!certificate) {
      setError("Please upload your citizenship, passport, or guide certificate.");
      setIsSubmitting(false); return;
    }

    const data = new FormData();
    data.append('user_id', user.id);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('certificate', certificate);

    try {
      await axios.post('http://localhost:5000/api/applications/submit', data, { headers: { 'Content-Type': 'multipart/form-data' }});
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Submission failed.');
    }
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-black text-slate-800 mb-4">Application Submitted!</h1>
        <p className="text-lg text-slate-600 max-w-lg">Thank you for applying. Our admin team will securely review your KYC details. You will be granted verified seller access shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100 mt-12 mb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-4 bg-emerald-500"></div>
      
      <div className="flex flex-col items-center text-center mb-10 mt-4">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-4"><ShieldCheck className="w-10 h-10" /></div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Partner with Us</h2>
        <p className="text-slate-500 font-medium mt-2">Submit your KYC details to get the Verified Badge ✅ and start selling tours and local products.</p>
      </div>

      {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl mb-8 font-bold text-center border border-rose-100">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Legal Full Name *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Phone Number *</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Date of Birth *</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Nationality *</label><input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div><label className="block text-slate-700 font-bold mb-2 text-sm">Years of Experience</label><input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" required /></div>
          <div className="md:col-span-2"><label className="block text-slate-700 font-bold mb-2 text-sm">PAN Number / Tax ID *</label><input type="text" name="pan_number" value={formData.pan_number} onChange={handleChange} className="w-full border p-4 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50" placeholder="Required for receiving payouts" required /></div>
        </div>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 mt-8">
          <UploadCloud className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <label className="block text-slate-800 font-black mb-1 text-lg">Upload Govt ID or Guide Certificate *</label>
          <p className="text-sm text-slate-500 mb-4">Must be a clear image or PDF (Citizenship, Passport, or License)</p>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="mx-auto block w-full max-w-sm text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer" required />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-black text-xl py-5 rounded-2xl hover:bg-emerald-600 transition duration-300 shadow-xl mt-8 disabled:opacity-70 flex justify-center">
          {isSubmitting ? 'Submitting securely...' : 'Submit KYC Application'}
        </button>
      </form>
    </div>
  );
};
export default BecomeSeller;