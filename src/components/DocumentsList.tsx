import React from 'react';
import { DocumentDto } from '@/services/documentApi';
import { FileText, Download, ImageIcon, Eye } from 'lucide-react';

interface DocumentsListProps {
  documents: DocumentDto[];
  imageUrls: Record<number, string>;
  onDownload: (document: DocumentDto) => void;
  onView: (document: DocumentDto) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ 
  documents, 
  imageUrls, 
  onDownload,
  onView
}) => {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-2 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {doc.contentType.startsWith('image/') ? (
                <ImageIcon className="w-3 h-3 text-gray-600" />
              ) : (
                <FileText className="w-3 h-3 text-gray-600" />
              )}
              <p className="text-xs font-medium text-gray-900 truncate">
                {doc.originalFileName}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onView(doc)}
                className="p-1 rounded hover:bg-gray-100 transition"
                title="View"
              >
                <Eye className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={() => onDownload(doc)}
                className="p-1 rounded hover:bg-gray-100 transition"
                title="Download"
              >
                <Download className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>
          {doc.contentType.startsWith('image/') && imageUrls[doc.id] && (
            <img
              src={imageUrls[doc.id]}
              alt={doc.originalFileName}
              className="w-full max-h-48 object-contain bg-gray-100 cursor-pointer"
              onClick={() => window.open(imageUrls[doc.id], '_blank')}
            />
          )}
          <div className="px-2 py-1 text-[10px] text-gray-500 border-t border-gray-100">
            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentsList;
