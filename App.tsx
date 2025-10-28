import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote } from './types';
import { fetchQuotesBatch } from './services/geminiService';
import QuoteCard from './components/QuoteCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import FavoritesList from './components/FavoritesList';

const CATEGORIES = ['随机', '爱', '勇气', '智慧', '成功', '幸福', '人生'];

const App: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteCache, setQuoteCache] = useState<Quote[]>([]);
  const [seenQuotes, setSeenQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Quote[]>(() => {
    try {
      const savedFavorites = localStorage.getItem('favoriteQuotes');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error("Error reading favorites from localStorage", error);
      return [];
    }
  });
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<string>(CATEGORIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  const isInitialMount = useRef(true);

  const fetchNewBatch = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newQuotes = await fetchQuotesBatch({ category, seenQuotes });
      if (newQuotes.length > 0) {
        setQuote(newQuotes[0]);
        setQuoteCache(newQuotes.slice(1));
        // Add to seen quotes to avoid immediate repetition
        setSeenQuotes(prev => [...prev, ...newQuotes].slice(-20));
      } else {
        setError('未能获取到新的名言。');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('获取名言时发生未知错误。');
      }
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [seenQuotes]);
  
  useEffect(() => {
    if (showFavorites) return;
    // Fetch only on initial mount or when category changes
     if (isInitialMount.current) {
        fetchNewBatch(currentCategory);
        isInitialMount.current = false;
     }
  }, [fetchNewBatch, currentCategory, showFavorites]);

  useEffect(() => {
    try {
        localStorage.setItem('favoriteQuotes', JSON.stringify(favorites));
    } catch (error) {
        console.error("Error saving favorites to localStorage", error);
    }
  }, [favorites]);
  
  const getNextQuote = () => {
    if (quoteCache.length > 0) {
      const nextQuote = quoteCache[0];
      setQuote(nextQuote);
      setQuoteCache(quoteCache.slice(1));
    } else {
      fetchNewBatch(currentCategory);
    }
  };
  
  const handleCategoryChange = (category: string) => {
    if (category !== currentCategory) {
        setCurrentCategory(category);
        setQuote(null);
        setQuoteCache([]);
        isInitialMount.current = true; // Force refetch
        fetchNewBatch(category);
    }
    setIsDropdownOpen(false);
  }

  const isFavorite = (quoteToCheck: Quote | null): boolean => {
    if (!quoteToCheck) return false;
    return favorites.some(fav => fav.quote === quoteToCheck.quote && fav.author === quoteToCheck.author);
  };
  
  const handleFavorite = () => {
    if (!quote) return;
    if (isFavorite(quote)) {
      setFavorites(favorites.filter(fav => !(fav.quote === quote.quote && fav.author === quote.author)));
    } else {
      setFavorites([...favorites, quote]);
    }
  };

  const handleShare = async (quoteToShare: Quote) => {
    const shareText = `"${quoteToShare.quote}"\n(${quoteToShare.translation})\n\n— ${quoteToShare.author}${quoteToShare.source ? `《${quoteToShare.source}》` : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '一句',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        await navigator.clipboard.writeText(shareText);
        alert('名言已复制到剪贴板');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('名言已复制到剪贴板');
    }
  };

  const handleRemoveFavorite = (quoteToRemove: Quote) => {
    setFavorites(favorites.filter(fav => !(fav.quote === quoteToRemove.quote && fav.author === quoteToRemove.author)));
  };


  return (
    <div className="bg-gray-100 min-h-screen font-sans flex flex-col items-center justify-center p-4 sm:p-8 relative">
      
       <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-30">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-all duration-200 flex items-center"
          >
            {currentCategory}
            <i className={`fas fa-chevron-down ml-2 transition-transform duration-300 ${isDropdownOpen ? 'transform rotate-180' : ''}`}></i>
          </button>
          <div 
            className={`absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isDropdownOpen ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}`}
          >
            {CATEGORIES.map(cat => (
              <a
                key={cat}
                href="#"
                onClick={(e) => { e.preventDefault(); handleCategoryChange(cat); }}
                className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${currentCategory === cat ? 'font-bold text-gray-900' : ''}`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>
      
      {!showFavorites && (
        <button
            onClick={() => setShowFavorites(true)}
            className="absolute top-6 right-6 sm:top-8 sm:right-8 px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-all duration-200 z-20"
        >
            我的收藏
        </button>
      )}

      <main className="w-full max-w-2xl mx-auto flex flex-col items-stretch pt-20">
        <div className="mb-8">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorDisplay message={error} onRetry={() => fetchNewBatch(currentCategory)} />}
            {!isLoading && !error && quote && !showFavorites && (
              <QuoteCard
                quote={quote.quote}
                author={quote.author}
                translation={quote.translation}
                source={quote.source}
                isFavorite={isFavorite(quote)}
                onFavorite={handleFavorite}
                onShare={() => handleShare(quote)}
              />
            )}
        </div>

        {!showFavorites && (
            <div className="flex justify-center items-center">
                <button
                    onClick={getNextQuote}
                    disabled={isLoading}
                    aria-label="换一句"
                    className="w-16 h-16 bg-white text-gray-800 font-semibold rounded-full shadow-lg border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading && !quote ? 
                        <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-800"></div> : 
                        <i className="fas fa-sync-alt text-2xl"></i>
                    }
                </button>
            </div>
        )}

        {showFavorites && (
          <div className="w-full">
            <FavoritesList favorites={favorites} onRemoveFavorite={handleRemoveFavorite} onShare={handleShare} onClearFavorites={() => setFavorites([])} />
            <div className="text-center mt-8">
              <button
                onClick={() => setShowFavorites(false)}
                className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-all duration-200"
              >
                返回
              </button>
            </div>
          </div>
        )}
      </main>
      
    </div>
  );
};

export default App;