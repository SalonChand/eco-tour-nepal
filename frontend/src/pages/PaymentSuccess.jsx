import { useEffect, useState, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code'; 
import domtoimage from 'dom-to-image'; 
import { jsPDF } from 'jspdf'; 
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext'; 
import { CurrencyContext } from '../context/CurrencyContext'; 
import { CheckCircle2, Receipt, ArrowRight, ShoppingBag, Map, Download, AlertCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const { user } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext); 
  const { formatPrice } = useContext(CurrencyContext); 
  
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const[error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [purchaseType, setPurchaseType] = useState('Tour');
  const[checkoutDetails, setCheckoutDetails] = useState({});

  useEffect(() => {
    const processPayment = async () => {
      const encodedData = searchParams.get('data');

      if (encodedData && user && !isSaved) {
        try {
          const decodedString = atob(encodedData);
          const parsedData = JSON.parse(decodedString);
          setPaymentData(parsedData);

          if (parsedData.status === 'COMPLETE') {
            const txnId = parsedData.transaction_uuid;
            const details = JSON.parse(localStorage.getItem('ecoTourCheckout') || '{}');
            setCheckoutDetails(details);

            if (txnId.startsWith('CART-')) {
              setPurchaseType('Cart');
              await axios.post('http://localhost:5000/api/payment/save-cart', {
                user_id: user.id, 
                transaction_uuid: txnId, 
                status: parsedData.status,
                full_name: details.fullName, 
                phone: details.phone, 
                address: details.address, 
                cart_items: details.cartItems,
                promo_code: details.promoCode // 🎟️ BURNS PROMO CODE
              });
              clearCart(); 

            } else if (txnId.startsWith('PROD-')) {
              setPurchaseType('Product');
              await axios.post('http://localhost:5000/api/payment/save-order', {
                user_id: user.id, 
                transaction_uuid: txnId, 
                amount: parsedData.total_amount, 
                status: parsedData.status,
                full_name: details.fullName, 
                phone: details.phone, 
                address: details.address,
                promo_code: details.promoCode // 🎟️ BURNS PROMO CODE
              });

            } else if (txnId.startsWith('BAL-')) {
              setPurchaseType('Balance');
              await axios.post('http://localhost:5000/api/payment/pay-balance', {
                user_id: user.id, 
                transaction_uuid: txnId, 
                amount_paid: parsedData.total_amount, 
                status: parsedData.status
              });

            } else {
              setPurchaseType('Tour');
              await axios.post('http://localhost:5000/api/payment/save-booking', {
                user_id: user.id, 
                transaction_uuid: txnId, 
                total_amount: details.totalAmount, 
                amount_paid: details.amountPaid, 
                payment_type: details.paymentType, 
                status: parsedData.status, 
                full_name: details.fullName, 
                phone: details.phone, 
                address: details.address, 
                travelers: details.travelers, 
                booking_date: details.bookingDate, 
                looking_for_buddy: details.lookingForBuddy,
                promo_code: details.promoCode // 🎟️ BURNS PROMO CODE
              });
            }
            setIsSaved(true);
            localStorage.removeItem('ecoTourCheckout');
          }
        } catch (err) { setError('Failed to save to database.'); }
      } else if (!user) { setError('Please log in.'); }
    };
    processPayment();
  }, [searchParams, user, isSaved]);

  const downloadTicketPDF = async () => {
    try {
      const element = document.getElementById('printable-ticket');
      if (!element) return alert("Ticket not found!");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EcoTour_Ticket_${paymentData.transaction_uuid.substring(0,6)}.pdf`);
    } catch (error) {
      alert("Failed to generate PDF. Check console.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-12 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500 relative">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
        
        <div className={`absolute top-0 left-0 w-full h-3 ${purchaseType === 'Product' || purchaseType === 'Cart' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative ${purchaseType === 'Product' || purchaseType === 'Cart' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
          <CheckCircle2 className={`w-12 h-12 relative z-10 ${purchaseType === 'Product' || purchaseType === 'Cart' ? 'text-indigo-500 dark:text-indigo-400' : 'text-emerald-500 dark:text-emerald-400'}`} />
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${purchaseType === 'Product' || purchaseType === 'Cart' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
        </div>

        <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Payment Confirmed!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Thank you for booking with Eco Tour Nepal 🌿</p>
        
        {isSaved && <div className={`border px-4 py-2 rounded-lg text-sm font-bold mb-8 inline-block ${purchaseType === 'Product' || purchaseType === 'Cart' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>✅ Saved to your Profile</div>}
        {error && <p className="text-rose-500 mb-8 font-medium bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">{error}</p>}

        {paymentData ? (
          <>
            {/* 🎫 DIGITAL E-TICKET FOR TOURS */}
            {purchaseType === 'Tour' && (
              <div id="printable-ticket" className="mb-10 text-left bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl flex flex-col sm:flex-row overflow-hidden relative shadow-lg mx-auto w-full max-w-xl transition-colors">
                <div className="p-6 md:p-8 bg-emerald-50 dark:bg-emerald-900/20 flex-grow relative">
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900/80 backdrop-blur-sm rounded-full hidden sm:block"></div>
                  <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5"/> Boarding Pass</h3>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 line-clamp-1">Eco Tour Adventure</h2>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm font-medium">
                    <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Lead Traveler</p><p className="text-slate-800 dark:text-slate-200">{checkoutDetails.fullName || user.username}</p></div>
                    <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Travelers</p><p className="text-slate-800 dark:text-slate-200">{checkoutDetails.travelers || 1} Person(s)</p></div>
                    <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Travel Date</p><p className="text-slate-800 dark:text-slate-200">{checkoutDetails.bookingDate ? new Date(checkoutDetails.bookingDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Paid</p><p className="text-emerald-600 dark:text-emerald-400 font-black">Rs. {paymentData.total_amount}</p></div>
                  </div>
                  {checkoutDetails.paymentType === 'partial' && (
                    <div className="mt-6 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Balance Due:</span>
                      <span className="font-black text-slate-800 dark:text-white">Rs. {checkoutDetails.totalAmount - checkoutDetails.amountPaid}</span>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8 bg-white dark:bg-slate-800 flex flex-col items-center justify-center border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-slate-200 dark:border-slate-700 relative shrink-0">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100"><QRCode value={paymentData.transaction_uuid} size={110} level="H" /></div>
                  <p className="text-[10px] text-slate-400 font-mono mt-3 text-center">TXN: <br/>{paymentData.transaction_uuid.substring(0,8)}...</p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 border px-2 py-0.5 rounded border-emerald-200 bg-emerald-50 text-emerald-600`}>Valid</p>
                </div>
              </div>
            )}

            {/* Standard Receipt for Products/Cart/Balance */}
            {(purchaseType === 'Product' || purchaseType === 'Cart' || purchaseType === 'Balance') && (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-2xl text-left mb-10 border border-slate-200 dark:border-slate-700 border-dashed relative">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4"><Receipt className="w-5 h-5 text-slate-400" /><h3 className="font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase text-sm">{purchaseType === 'Balance' ? 'Balance Payment Receipt' : 'Official Receipt'}</h3></div>
                <div className="space-y-4 font-medium">
                  <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Amount Paid</span><span className={`font-black text-xl ${purchaseType === 'Balance' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>Rs. {paymentData.total_amount}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500 dark:text-slate-400">Transaction ID</span><span className="font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 break-all">{paymentData.transaction_uuid}</span></div>
                </div>
              </div>
            )}

          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 font-medium animate-pulse">Loading receipt details...</div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {purchaseType === 'Tour' && paymentData && (
            <button onClick={downloadTicketPDF} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 px-6 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-300 border border-slate-200 dark:border-slate-700">
              <Download className="w-5 h-5" /> Download Ticket (PDF)
            </button>
          )}

          <Link to="/profile" className="flex flex-grow items-center justify-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-emerald-600 dark:hover:bg-emerald-500 transition duration-300 shadow-lg hover:shadow-emerald-500/30">
            View My Profile <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;