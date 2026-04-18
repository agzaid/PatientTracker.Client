import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading = false
}) => {
  const { t } = useTranslation();

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages.map(pageNum => (
      <button
        key={pageNum}
        onClick={() => onPageChange(pageNum)}
        disabled={loading}
        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
          currentPage === pageNum
            ? 'bg-blue-600 text-white'
            : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
        }`}
      >
        {pageNum}
      </button>
    ));
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-700">
        {t('common.showing', { 
          start: (currentPage - 1) * pageSize + 1,
          end: Math.min(currentPage * pageSize, totalCount),
          total: totalCount
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('common.previous')}
        </button>
        
        <div className="flex items-center gap-1">
          {renderPageNumbers()}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
