import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { ShoppingBag, BookOpen, Download, AlertCircle, CheckCircle, Package } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const Bookstore = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/bookstore/books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        console.error('Data is not an array:', data);
        setBooks([]);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (book) => {
    setPurchasing(book.id);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/bookstore/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ book_id: book.id }),
      });

      const data = await response.json();
      console.log('Purchase response:', data);

      if (!response.ok) {
        console.error('Purchase failed:', data);
        setMessage({ type: 'error', text: data.detail || t('purchaseFailed') });
        return;
      }

      if (book.book_type === 'digital') {
        // Digital book - redirect to PayFast
        redirectToPayFast(data.payfast_data);
      } else {
        // Physical book - redirect to PayFast
        redirectToPayFast(data.payfast_data);
      }

    } catch (error) {
       console.error('Purchase error exception:', error);
       setMessage({ type: 'error', text: `Network error or server unavailable. Please try again later. (${error.message})` });
     } finally {
       setPurchasing(null);
       fetchBooks(); // Refresh stock
     }
  };

  const redirectToPayFast = (payfastData) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://sandbox.payfast.co.za/eng/process'; // Use https://www.payfast.co.za/eng/process for production

    Object.entries(payfastData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const getStockColor = (stock, bookType) => {
    if (bookType === 'digital') return 'text-green-500';
    if (stock === 0) return 'text-red-500';
    if (stock <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStockText = (stock, bookType) => {
    if (bookType === 'digital') return 'Unlimited digital copies';
    if (stock === 0) return t('outOfStock');
    if (stock <= 3) return `Only ${stock} left!`;
    return `${stock} ${t('inStock')}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t('bookstoreTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('bookstoreSubtitle')}</p>
          <p className="text-sm text-orange-500 mt-1">{t('freeShipping')}</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
          }`}>
            {message.type === 'error'
              ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
              : <CheckCircle className="w-5 h-5 flex-shrink-0" />
            }
            <span>{message.text}</span>
          </div>
        )}

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No books available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const isOutOfStock = book.book_type === 'physical' && book.stock === 0;
              const hasPurchased = book.purchased;
              
              return (
                <div key={book.id} className={`glass rounded-2xl overflow-hidden border border-white/5 flex flex-col transition-all duration-300 ${
                  isOutOfStock ? 'opacity-60 grayscale-[0.5]' : ''
                } ${hasPurchased ? 'ring-2 ring-green-500/50' : ''}`}>
                  {/* Book Cover */}
                  <div className="h-48 bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center relative">
                    {book.cover_image ? (
                      <img src={book.cover_image} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="w-16 h-16 text-orange-500/50" />
                    )}
                    
                    {/* Out of Stock Overlay */}
                    {isOutOfStock && !hasPurchased && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm tracking-wider shadow-lg transform -rotate-12 border-2 border-white/20">
                          {t('outOfStock').toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Purchased Overlay */}
                    {hasPurchased && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-white text-green-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xl border-2 border-green-500/20">
                          <CheckCircle className="w-4 h-4" />
                          {t('completed').toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Book Type Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 shadow-md ${
                      book.book_type === 'digital'
                        ? 'bg-blue-500/80 text-white backdrop-blur-md'
                        : 'bg-orange-500/80 text-white backdrop-blur-md'
                    }`}>
                      {book.book_type === 'digital'
                        ? <><Download className="w-3 h-3" /> {t('digitalBook')}</>
                        : <><Package className="w-3 h-3" /> {t('physicalBook')}</>
                      }
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                    <p className="text-sm text-muted-foreground mt-2 flex-1 line-clamp-2">{book.description}</p>

                    {/* Stock / Purchased Status */}
                    <div className={`text-sm font-medium mt-3 flex items-center gap-2 ${
                      hasPurchased ? 'text-green-500' : getStockColor(book.stock, book.book_type)
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        hasPurchased ? 'bg-green-500' : isOutOfStock ? 'bg-red-500' : 'animate-pulse ' + (book.stock <= 3 && book.book_type !== 'digital' ? 'bg-yellow-500' : 'bg-green-500')
                      }`} />
                      {hasPurchased ? 'You already own this book' : getStockText(book.stock, book.book_type)}
                    </div>

                    {/* Price & Buy */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <span className={`text-xl font-bold ${isOutOfStock || hasPurchased ? 'text-muted-foreground' : 'text-orange-500'}`}>
                        R{book.price}
                      </span>
                      <button
                        onClick={() => handlePurchase(book)}
                        disabled={purchasing === book.id || isOutOfStock || hasPurchased}
                        className={`px-4 py-2 rounded-xl font-medium text-sm transition-all active:scale-95 ${
                          isOutOfStock || hasPurchased
                            ? 'bg-muted text-muted-foreground cursor-not-allowed border border-white/5'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                        }`}
                      >
                        {purchasing === book.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : hasPurchased ? (
                          'Owned'
                        ) : isOutOfStock ? (
                          t('outOfStock')
                        ) : (
                          t('buyNow')
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Bookstore;