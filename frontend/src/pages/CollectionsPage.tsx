import React, { useState } from 'react';
import { useMovieCollections, useCreateMovieCollection, useUpdateMovieCollection, useDeleteMovieCollection, useMoviesFromCollection } from '../hooks/useMovieCollections';
import { CollectionCard } from '../components/CollectionCard';
import { CollectionModal } from '../components/CollectionModal';
import { MovieDisplay } from '../components/MovieDisplay';
import { SearchBar } from '../components/SearchBar';
import type { MovieCollection, CreateMovieCollection, UpdateMovieCollection } from '../types';

export const CollectionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<MovieCollection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<MovieCollection | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: collectionsData, isLoading: collectionsLoading } = useMovieCollections({
    page: currentPage,
    limit: 20,
    search,
  });

  const { data: movies, isLoading: moviesLoading } = useMoviesFromCollection(selectedCollection?.url);
  
  const createMutation = useCreateMovieCollection();
  const updateMutation = useUpdateMovieCollection();
  const deleteMutation = useDeleteMovieCollection();

  const handleCreate = () => {
    setEditingCollection(null);
    setShowModal(true);
  };

  const handleEdit = (collection: MovieCollection) => {
    setEditingCollection(collection);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleView = (collection: MovieCollection) => {
    setSelectedCollection(collection);
  };

  const handleSubmit = async (data: CreateMovieCollection | UpdateMovieCollection) => {
    if (editingCollection) {
      await updateMutation.mutateAsync({ id: editingCollection.id, collection: data as UpdateMovieCollection });
    } else {
      await createMutation.mutateAsync(data as CreateMovieCollection);
    }
    setShowModal(false);
    setEditingCollection(null);
  };

  const totalPages = collectionsData ? Math.ceil(collectionsData.total / collectionsData.limit) : 1;

  if (selectedCollection) {
    return (
      <div>
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setSelectedCollection(null)}
            className="mb-3 sm:mb-4 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-700 hover:text-blue-500 transition-colors"
          >
            ← Back to Collections
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {selectedCollection.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{selectedCollection.url}</p>
        </div>

        {moviesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : movies && movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {movies.map((movie, idx) => (
              <MovieDisplay key={idx} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No movies found in this collection</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">Movie Collections</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <SearchBar onSearch={setSearch} />
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Collection
          </button>
        </div>
      </header>

        {collectionsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : collectionsData && collectionsData.collections.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {collectionsData.collections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm sm:text-base text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No collections found</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Collection
            </button>
          </div>
        )}

        <CollectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingCollection(null);
          }}
          onSubmit={handleSubmit}
          collection={editingCollection}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
    </div>
  );
};