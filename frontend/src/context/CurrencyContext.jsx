import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('NPR'); // Default is Nepali Rupees
  const [exchangeRate, setExchangeRate] = useState(1); 

  // Fetch LIVE exchange rate when the app loads
  useEffect(() => {
    const fetchRate = async () => {
      try {
        // Free open-source exchange rate API
        const res = await axios.get('https://api.exchangerate-api.com/v4/latest/NPR');
        setExchangeRate(res.data.rates.USD);
      } catch (err) {
        console.error("Failed to fetch exchange rate, using standard fallback.");
        setExchangeRate(0.0075); // Fallback: 1 NPR ≈ $0.0075 USD
      }
    };
    fetchRate();
  }, []);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'NPR' ? 'USD' : 'NPR'));
  };

  // Magic function we will use everywhere to display prices!
  const formatPrice = (nprPrice) => {
    if (currency === 'NPR') return `Rs. ${nprPrice}`;
    
    // Convert to USD and keep 2 decimal places
    const usdPrice = (nprPrice * exchangeRate).toFixed(2);
    return `$${usdPrice} USD`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};