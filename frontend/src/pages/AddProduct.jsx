import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag } from 'lucide-react';

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // 📍 NEW: Added region
  const[formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'Handicrafts', region: 'Kathmandu Valley', stock_quantity: '1'
  });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) return <div className="text-center mt-20 text-xl font-bold text-rose-600">Please log in.</div>;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    const data = new FormData();
    data.append('seller_id', user.id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('region', formData.region); // 📍 SEND REGION
    data.append('stock_quantity', formData.stock_quantity);
    if (image) data.append('image', image);

    try {
      const response = await axios.post('http://localhost:5000/api/products/add', data, { headers: { 'Content-Type': 'multipart/form-data' }});
      setMessage(response.data.message);
      setTimeout(() => navigate('/shop'), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong!'); }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 mt-10 mb-20 transition-colors duration-500 font-sans">
      <div className="flex items-center justify-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6 transition-colors">
        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full transition-colors"><ShoppingBag className="w-8 h-8" /></div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white transition-colors">Sell Local Product</h2>
      </div>

      {message && <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl mb-6 font-bold text-center border border-emerald-100 dark:border-emerald-800">{message}</div>}
      {error && <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 p-4 rounded-xl mb-6 font-bold text-center border border-rose-100 dark:border-rose-800">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 text-slate-700 dark:text-slate-300">
        <div><label className="block font-bold mb-2">Product Image</label><input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors" required /></div>
        <div><label className="block font-bold mb-2">Product Name</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors" placeholder="e.g., Authentic Cashmere Pashmina" required /></div>
        <div><label className="block font-bold mb-2">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors" placeholder="Tell the story behind this product..." required></textarea></div>
        
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block font-bold mb-2">Price (Rs.)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors" required /></div>
          <div><label className="block font-bold mb-2">Stock</label><input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors" required /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold mb-2">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors">
              <option value="Handicrafts">Handicrafts & Arts</option>
              <option value="Clothing">Clothing & Pashmina</option>
              <option value="Food & Tea">Organic Food & Tea</option>
              <option value="Trekking Gear">Trekking Gear</option>
            </select>
          </div>
          {/* 📍 NEW: Region Dropdown */}
          <div>
            <label className="block font-bold mb-2">Made In Region</label>
            <select name="region" value={formData.region} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 transition-colors">
              <option value="Kathmandu Valley">Kathmandu Valley</option>
              <option value="Everest Region">Everest Region</option>
              <option value="Annapurna Region">Annapurna Region</option>
              <option value="Chitwan / Lumbini">Chitwan / Lumbini</option>
              <option value="Langtang Region">Langtang Region</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 dark:bg-orange-600 text-white font-black text-lg py-4 rounded-xl hover:bg-orange-500 transition duration-300 mt-4 shadow-lg">Publish Product</button>
      </form>
    </div>
  );
};

export default AddProduct;