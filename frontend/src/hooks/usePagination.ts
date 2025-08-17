import { useState, useMemo } from 'react';

export const usePagination = (totalItems: number, itemsPerPage: number = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() =>
    Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  return {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};