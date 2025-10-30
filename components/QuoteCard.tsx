import React, { useState, useEffect } from 'react';

interface QuoteCardProps {
  quote: string;
  author: string;
  translation: string;
  source?: string;
  isFavorite: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, author, translation, source, isFavorite, onFavorite, onShare }) => {
  const [animateFavorite, setAnimateFavorite] = useState(false);
  const [animateShare, setAnimateShare] = useState(false);
  
  // State for toggling between original and translation
  const [showTranslationAsMain, setShowTranslationAsMain] = useState(false);
  
  // State to hold the currently displayed quote data for smooth transitions
  const [displayData, setDisplayData] = useState({ quote, author, translation, source });
  
  // State to manage the fade animation
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // If the quote prop changes, trigger the fade out-and-in animation
    if (displayData.quote !== quote) {
      setIsFading(true);
      const timer = setTimeout(() => {
        // After fade-out, update the content and reset states
        setDisplayData({ quote, author, translation, source });
        setShowTranslationAsMain(false); // Reset to show original text on new quote
        setIsFading(false); // Trigger fade-in
      }, 300); // This duration should match the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [quote, author, translation, source, displayData.quote]);


  const handleFavoriteClick = () => {
    if (!animateFavorite) {
      setAnimateFavorite(true);
    }
    onFavorite();
  };

  const handleShareClick = () => {
    if (!animateShare) {
      setAnimateShare(true);
    }
    onShare();
  };

  const mainText = showTranslationAsMain ? displayData.translation : displayData.quote;
  const secondaryText = showTranslationAsMain ? displayData.quote : displayData.translation;

  return (
    <div className="bg-white px-6 sm:px-10 pt-6 sm:pt-10 pb-16 rounded-lg shadow-lg border border-gray-200 min-h-[250px] flex flex-col justify-center relative transition-all duration-300">
      {/* Adjusted size and position for better aesthetics and less text overlap */}
      <span className="absolute top-3 left-3 text-7xl text-gray-100 font-serif z-0 select-none pointer-events-none">“</span>
      
      {/* The blockquote now has a transition for opacity */}
      <blockquote className={`text-center relative z-10 transition-opacity duration-300 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-xl sm:text-2xl md:text-3xl font-['Songti_SC','Noto_Serif_SC',serif] text-gray-800 mb-4 min-h-[72px] flex items-center justify-center">
          {mainText}
        </p>
        <p className="text-base text-gray-500 mb-6 font-sans min-h-[24px]">({secondaryText})</p>
        <footer className="text-md sm:text-lg text-gray-600 font-medium">
          — {displayData.author}
        </footer>
        {displayData.source && (
            <cite className="text-sm text-gray-400 mt-2 block not-italic">
                ({displayData.source})
            </cite>
        )}
      </blockquote>

      {/* Adjusted size and position for better aesthetics and less text overlap */}
      <span className="absolute bottom-14 right-3 text-7xl text-gray-100 font-serif z-0 select-none pointer-events-none">”</span>
      
      <div className="absolute bottom-6 right-6 flex items-center space-x-4 z-10">
        <button onClick={() => setShowTranslationAsMain(!showTranslationAsMain)} title="切换原文/翻译" className="text-gray-400 hover:text-gray-800 transition-colors duration-200">
          <i className="fas fa-language text-xl"></i>
        </button>
        <button onClick={handleFavoriteClick} title={isFavorite ? "取消收藏" : "收藏"} className="text-gray-400 hover:text-red-500 transition-colors duration-200">
          <i
            className={`fas fa-heart text-xl ${isFavorite ? 'text-red-500' : ''} ${animateFavorite ? 'animate-heartbeat' : ''}`}
            onAnimationEnd={() => setAnimateFavorite(false)}
          />
        </button>
        <button onClick={handleShareClick} title="分享" className="text-gray-400 hover:text-gray-800 transition-colors duration-200">
          <i
            className={`fas fa-share-alt text-xl ${animateShare ? 'animate-share-pop' : ''}`}
            onAnimationEnd={() => setAnimateShare(false)}
          />
        </button>
      </div>
    </div>
  );
};

export default QuoteCard;