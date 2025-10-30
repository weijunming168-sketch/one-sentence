import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote } from './types';
import { fetchQuotesBatch } from './services/geminiService';
import QuoteCard from './components/QuoteCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import FavoritesList from './components/FavoritesList';

const CATEGORIES = ['随机', '爱', '勇气', '智慧', '成功', '幸福', '人生'];

// Helper to create a unique identifier for a quote
const getQuoteId = (quote: Quote): string => `${quote.quote}|${quote.author}`;

const App: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteCache, setQuoteCache] = useState<Quote[]>([]);
  const [seenQuotes, setSeenQuotes] = useState<Quote[]>([]); // For API prompt (last 20)
  const [seenQuotesHistory, setSeenQuotesHistory] = useState<Set<string>>(() => { // For client-side check (all)
    try {
      const savedHistory = localStorage.getItem('seenQuotesHistory');
      return savedHistory ? new Set(JSON.parse(savedHistory)) : new Set();
    } catch (error) {
      console.error("Error reading seen quotes history from localStorage", error);
      return new Set();
    }
  });

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
  
  const needsToFetch = useRef(true);

  // Effect to save seen quotes history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('seenQuotesHistory', JSON.stringify(Array.from(seenQuotesHistory)));
    } catch (error) {
      console.error("Error saving seen quotes history to localStorage", error);
    }
  }, [seenQuotesHistory]);


  const fetchNewBatch = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    const maxRetries = 3;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const newQuotes = await fetchQuotesBatch({ category, seenQuotes });
            
            // Filter out quotes that have been seen before
            const freshQuotes = newQuotes.filter(q => !seenQuotesHistory.has(getQuoteId(q)));

            if (freshQuotes.length > 0) {
                const firstQuote = freshQuotes[0];
                const restOfQuotes = freshQuotes.slice(1);
                
                setQuote(firstQuote);
                setQuoteCache(restOfQuotes);
                
                // Update history with all fresh quotes
                setSeenQuotesHistory(prevHistory => {
                    const newHistory = new Set(prevHistory);
                    freshQuotes.forEach(q => newHistory.add(getQuoteId(q)));
                    return newHistory;
                });

                // Update the list for the API prompt (last 20 from the new batch)
                setSeenQuotes(prev => [...prev, ...freshQuotes].slice(-20));
                
                setIsLoading(false);
                return; // Exit function successfully
            }
            // If no fresh quotes, the loop will continue to retry
            
        } catch (err) {
            // Handle API error immediately and stop retrying
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('获取名言时发生未知错误。');
            }
            setQuote(null);
            setIsLoading(false);
            return;
        }
    }
    
    // If loop finishes without finding fresh quotes
    setError('未能获取到新的名言，请稍后再试或尝试更换分类。');
    setQuote(null);
    setIsLoading(false);

  }, [seenQuotes, seenQuotesHistory]);
  
  useEffect(() => {
    if (showFavorites) {
        return;
    }
    if (needsToFetch.current) {
        fetchNewBatch(currentCategory);
        needsToFetch.current = false;
    }
  }, [currentCategory, showFavorites, fetchNewBatch]);

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
      needsToFetch.current = true;
      fetchNewBatch(currentCategory);
    }
  };
  
  const handleCategoryChange = (category: string) => {
    if (category !== currentCategory) {
        setCurrentCategory(category);
        setQuote(null);
        setQuoteCache([]);
        needsToFetch.current = true;
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
    const shareText = `"${quoteToShare.quote}"\n(${quoteToShare.translation})\n\n— ${quoteToShare.author}${quoteToShare.source ? ` (${quoteToShare.source})` : ''}`;
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
    setFavorites(prevFavorites => 
      prevFavorites.filter(fav => !(fav.quote === quoteToRemove.quote && fav.author === quoteToRemove.author))
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans flex flex-col items-center p-4 sm:p-8">
      
      {!showFavorites && (
        <header className="w-full max-w-2xl mx-auto flex justify-between items-start mb-8">
          <h1 className="text-6xl font-bold text-gray-800 flex items-center font-['Songti_SC','Noto_Serif_SC',serif]">
            <span className="border-b-2 border-gray-600 pb-1">一</span>
            <span className="bg-gray-800 text-white px-3 ml-2 rounded-md">句</span>
          </h1>
          
          <div className="flex flex-col items-end">
            <button
                onClick={() => setShowFavorites(true)}
                className="w-36 justify-center px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-all duration-200 flex items-center"
            >
                我的收藏
            </button>
            <div className="relative mt-4">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-36 px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 transition-all duration-200 flex items-center justify-center"
              >
                <span>{currentCategory}</span>
                <i className={`fas fa-chevron-down ml-2 transition-transform duration-300 ${isDropdownOpen ? 'transform rotate-180' : ''}`}></i>
              </button>
              <div 
                className={`absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out z-30 ${isDropdownOpen ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'}`}
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
        </header>
      )}

      <main className="w-full max-w-2xl mx-auto flex flex-col items-stretch">
        <div className="mb-8">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorDisplay message={error} onRetry={() => { needsToFetch.current = true; fetchNewBatch(currentCategory); }} />}
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
                className="px-6 py-3 bg-white text-gray-800 font-semibold rounded-lg shadow-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200"
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