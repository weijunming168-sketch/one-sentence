import React from 'react';
import { Quote } from '../types';

interface FavoritesListProps {
  favorites: Quote[];
  onRemoveFavorite: (quote: Quote) => void;
  onShare: (quote: Quote) => void;
  onClearFavorites: () => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onRemoveFavorite, onShare, onClearFavorites }) => {
  
  const handleClear = () => {
    if (window.confirm('确定要清空所有收藏吗？')) {
      onClearFavorites();
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-inner border border-gray-200">
        <i className="fas fa-star text-3xl mb-4"></i>
        <p>还没有收藏任何名言</p>
        <p className="text-sm">点击名言卡片上的 <i className="fas fa-heart"></i> 图标来收藏你喜欢的名言。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">我的收藏</h2>
        <button 
          onClick={handleClear}
          className="px-3 py-1 text-sm bg-red-50 text-red-600 font-semibold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
        >
          清空收藏
        </button>
      </div>
      {favorites.map((fav, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-start transition-all duration-200 hover:shadow-lg hover:border-gray-300">
          <div className="flex-grow pr-4">
            <p className="font-['Songti_SC','Noto_Serif_SC',serif] text-lg text-gray-800">
              {fav.quote}
            </p>
             <p className="text-sm text-gray-500 mt-1">({fav.translation})</p>
            <p className="text-sm text-gray-600 mt-2">— {fav.author} {fav.source && <span className="text-gray-400">《{fav.source}》</span>}</p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0 pt-1">
             <button onClick={() => onShare(fav)} title="分享" className="text-gray-400 hover:text-gray-800 transition-colors duration-200">
                <i className="fas fa-share-alt text-lg"></i>
             </button>
             <button onClick={() => onRemoveFavorite(fav)} title="取消收藏" className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                <i className="fas fa-trash-alt text-lg"></i>
             </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FavoritesList;