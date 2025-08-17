import React from 'react';
import type { MovieCollection } from '../types';

interface CollectionCardProps {
  collection: MovieCollection;
  onEdit: (collection: MovieCollection) => void;
  onDelete: (id: number) => void;
  onView: (collection: MovieCollection) => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  onEdit, 
  onDelete,
  onView 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{collection.name}</h3>
        {collection.is_default && (
          <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            Default
          </span>
        )}
      </div>
      
      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 truncate">{collection.url}</p>
      
      <div className="flex gap-2">
        <button
          onClick={() => onView(collection)}
          className="flex-1 px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          View Movies
        </button>
        
        {!collection.is_default && (
          <>
            <button
              onClick={() => onEdit(collection)}
              className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(collection.id)}
              className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};