import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './layouts/MainLayout';

const MoviesPage = lazy(() => import('./pages/MoviesPage').then(module => ({ default: module.MoviesPage })));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage').then(module => ({ default: module.CollectionsPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Suspense fallback={
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<MoviesPage />} />
            <Route path="collections" element={<CollectionsPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="watch-later" element={<div className="text-center py-12 text-gray-500">Watch Later coming soon</div>} />
            <Route path="genres" element={<div className="text-center py-12 text-gray-500">Genres coming soon</div>} />
            <Route path="settings" element={<div className="text-center py-12 text-gray-500">Settings coming soon</div>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;