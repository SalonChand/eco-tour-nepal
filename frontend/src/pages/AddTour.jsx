import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MountainSnow, UserCircle, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'; 
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor:[12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({ click(e) { setPosition({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return position ? <Marker position={position}></Marker> : null;
};

const AddTour = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  
  // 📍 NEW: Added region
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', duration_days: '', difficulty: 'Moderate', location: '', region: 'Kathmandu Valley', assigned_guide_id: '', guide_name: '', guide_email: '', guide_contact: ''
  });
  
  const[image, setImage] = useState(null);
  const [guidePhoto, setGuidePhoto] = useState(null);
  const [pinLocation, setPinLocation] = useState({ lat: 28.2096, lng: 83.9856 }); 
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/guides/list');
        setGuides(res.data);
      } catch (err) {}
    };
    fetchGuides();
  },[]);

  if (!user) return <div className="text-center mt-20 text-xl font-bold text-rose-600">Please log in.</div>;

  const handleChange = (e) => setFormData({ ...formData,[e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    const data = new FormData();
    data.append('guide_id', user.id); 
    data.append('assigned_guide_id', formData.assigned_guide_id || user.id);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('duration_days', formData.duration_days);
    data.append('difficulty', formData.difficulty);
    data.append('location', formData.location); 
    data.append('region', formData.region); // 📍 SEND REGION
    data.append('latitude', pinLocation.lat);
    data.append('longitude', pinLocation.lng);
    data.append('guide_name', formData.guide_name);
    data.append('guide_email', formData.guide_email);
    data.append('guide_contact', formData.guide_contact);
    if (image) data.append('image', image);
    if (guidePhoto) data.append('guide_photo', guidePhoto);

    try {
      const response = await axios.post('http://localhost:5000/api/tours/add', data, { headers: { 'Content-Type': 'multipart/form-data' }});
      setMessage(response.data.message);
      setTimeout(() => navigate('/tours'), 2000);
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong!'); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 mt-10 mb-20 font-sans transition-colors duration-500">
      <div className="flex items-center justify-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6 transition-colors">
        <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl transition-colors"><MountainSnow className="w-8 h-8" /></div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white transition-colors">Create Tour Listing</h2>
      </div>

      {message && <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl mb-6 font-bold text-center border border-emerald-100 dark:border-emerald-800 transition-colors">{message}</div>}
      {error && <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 p-4 rounded-xl mb-6 font-bold text-center border border-rose-100 dark:border-rose-800 transition-colors">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8 text-slate-700 dark:text-slate-300">
        
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">1. Trip Details</h3>
          <div><label className="block font-bold mb-2">Cover Image *</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required /></div>
          <div><label className="block font-bold mb-2">Tour Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required /></div>
          <div><label className="block font-bold mb-2">Description *</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required></textarea></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block font-bold mb-2">Price (Rs.) *</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required /></div>
            <div><label className="block font-bold mb-2">Duration (Days) *</label><input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required /></div>
            
            {/* 📍 NEW: Region Dropdown */}
            <div>
              <label className="block font-bold mb-2">Region *</label>
              <select name="region" value={formData.region} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors">
                <option value="Kathmandu Valley">Kathmandu Valley</option>
                <option value="Everest Region">Everest Region</option>
                <option value="Annapurna Region">Annapurna Region</option>
                <option value="Chitwan / Lumbini">Chitwan / Lumbini</option>
                <option value="Langtang Region">Langtang Region</option>
              </select>
            </div>

            <div><label className="block font-bold mb-2">Difficulty</label><select name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors"><option value="Easy">Easy</option><option value="Moderate">Moderate</option><option value="Hard">Hard</option></select></div>
            <div className="md:col-span-2"><label className="block font-bold mb-2">Specific Location Name *</label><input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Annapurna Base Camp" className="w-full border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" required /></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2"><MapPin className="text-rose-500" /> 2. Exact Starting Point</h3>
          <p className="text-sm font-medium">Click on the map to drop a pin exactly where this trek begins.</p>
          <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 relative z-0">
            <MapContainer center={[28.2096, 83.9856]} zoom={7} scrollWheelZoom={true} className="w-full h-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationPicker position={pinLocation} setPosition={setPinLocation} />
            </MapContainer>
          </div>
          <p className="text-xs text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-900/30 p-2 rounded-lg inline-block">Pin saved at: Lat {pinLocation.lat.toFixed(4)}, Lng {pinLocation.lng.toFixed(4)}</p>
        </div>

        <div className="bg-cyan-50 dark:bg-cyan-900/10 p-6 md:p-8 rounded-3xl border border-cyan-100 dark:border-cyan-800/50 space-y-6 transition-colors">
            <div className="flex items-center gap-3 border-b border-cyan-200/50 dark:border-cyan-800/50 pb-4 mb-2">
              <div className="bg-cyan-200 dark:bg-cyan-900/50 p-2 rounded-full text-cyan-700 dark:text-cyan-400"><UserCircle className="w-6 h-6" /></div>
              <div><h3 className="text-xl font-bold text-cyan-900 dark:text-cyan-100">3. Lead Guide</h3><p className="text-cyan-700 dark:text-cyan-400 text-sm">Select from registered guides, or enter manual details below.</p></div>
            </div>
            <select name="assigned_guide_id" value={formData.assigned_guide_id} onChange={handleChange} className="w-full border border-cyan-200 dark:border-cyan-800/50 p-4 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 dark:text-slate-200 transition-colors"><option value="">I am leading this tour myself</option>{guides.map(g => (<option key={g.id} value={g.id}>{g.username}</option>))}</select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div><label className="block text-cyan-900 dark:text-cyan-100 font-bold mb-2 text-sm">Manual Name</label><input type="text" name="guide_name" value={formData.guide_name} onChange={handleChange} className="w-full border border-cyan-200 dark:border-cyan-800/50 p-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" /></div>
              <div><label className="block text-cyan-900 dark:text-cyan-100 font-bold mb-2 text-sm">Manual Phone</label><input type="tel" name="guide_contact" value={formData.guide_contact} onChange={handleChange} className="w-full border border-cyan-200 dark:border-cyan-800/50 p-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" /></div>
              <div><label className="block text-cyan-900 dark:text-cyan-100 font-bold mb-2 text-sm">Manual Email</label><input type="email" name="guide_email" value={formData.guide_email} onChange={handleChange} className="w-full border border-cyan-200 dark:border-cyan-800/50 p-3 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 transition-colors" /></div>
              <div><label className="block text-cyan-900 dark:text-cyan-100 font-bold mb-2 text-sm">Manual Photo</label><input type="file" accept="image/*" onChange={(e) => setGuidePhoto(e.target.files[0])} className="w-full border border-cyan-200 dark:border-cyan-800/50 bg-white dark:bg-slate-800 dark:text-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 transition-colors" /></div>
            </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 dark:bg-cyan-600 text-white font-black text-xl py-5 rounded-2xl hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors shadow-xl">Publish Tour Listing</button>
      </form>
    </div>
  );
};
export default AddTour;