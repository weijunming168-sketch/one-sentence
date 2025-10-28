
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-300 text-red-800 min-h-[250px] flex flex-col justify-center items-center text-center">
      <i className="fas fa-exclamation-triangle text-3xl mb-4 text-red-500"></i>
      <p className="font-semibold mb-1">糟糕，出错了</p>
      <p className="text-sm mb-4 text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors duration-200"
      >
        重试
      </button>
    </div>
  );
};

export default ErrorDisplay;
