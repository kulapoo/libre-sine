import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { MovieCollection, CreateMovieCollection, UpdateMovieCollection } from '../types';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collection: CreateMovieCollection | UpdateMovieCollection) => void;
  collection?: MovieCollection | null;
  isLoading?: boolean;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  collection,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    is_default: false,
  });

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name,
        url: collection.url,
        is_default: collection.is_default,
      });
    } else {
      setFormData({
        name: '',
        url: '',
        is_default: false,
      });
    }
  }, [collection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collection) {
      const updateData: UpdateMovieCollection = {};
      if (formData.name !== collection.name) updateData.name = formData.name;
      if (formData.url !== collection.url) updateData.url = formData.url;
      onSubmit(updateData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg sm:rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-base sm:text-lg font-medium leading-6 text-gray-900"
                >
                  {collection ? 'Edit Collection' : 'Add New Collection'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-3 sm:mt-4">
                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <label htmlFor="url" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/movies.json"
                      required
                    />
                  </div>

                  {!collection && (
                    <div className="mb-3 sm:mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_default}
                          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-xs sm:text-sm text-gray-700">Set as default collection</span>
                      </label>
                    </div>
                  )}

                  <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm sm:text-base rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                      {isLoading ? 'Saving...' : collection ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};