import React from 'react';

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
  return (
    <div className="bg-white p-6 sm:p-10 rounded-lg shadow-lg border border-gray-200 min-h-[250px] flex flex-col justify-center relative transition-all duration-300">
      <blockquote className="text-center">
        <p className="text-xl sm:text-2xl md:text-3xl font-['Songti_SC','Noto_Serif_SC',serif] text-gray-800 mb-4 relative z-10">
          <span className="absolute -top-6 -left-6 text-8xl text-gray-100 font-serif z-0">“</span>
          {quote}
          <span className="absolute -bottom-10 -right-6 text-8xl text-gray-100 font-serif z-0">”</span>
        </p>
        <p className="text-base text-gray-500 mb-6 font-sans z-10 relative">({translation})</p>
        <footer className="text-md sm:text-lg text-gray-600 font-medium z-10 relative">
          — {author}
        </footer>
        {source && (
            <cite className="text-sm text-gray-400 mt-2 block not-italic z-10 relative">
                《{source}》
            </cite>
        )}
      </blockquote>
      <div className="absolute bottom-4 right-4 flex items-center space-x-4 z-10">
        <button onClick={onFavorite} title={isFavorite ? "取消收藏" : "收藏"} className="text-gray-400 hover:text-red-500 transition-colors duration-200">
          <i className={`fas fa-heart text-xl ${isFavorite ? 'text-red-500' : ''}`}></i>
        </button>
        <button onClick={onShare} title="分享" className="text-gray-400 hover:text-gray-800 transition-colors duration-200">
          <i className="fas fa-share-alt text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default QuoteCard;