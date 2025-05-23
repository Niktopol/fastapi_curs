'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function Download({ params }) {
  const downloadStarted = useRef(false);

  useEffect(() => {
    const downloadFile = async () => {
      if (downloadStarted.current) {
        return;
      }
      downloadStarted.current = true;

      try {
        const response = await fetch(`http://localhost:8000/download/${params.id}`);
        
        if (!response.ok) {
          throw new Error('File not found');
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'downloaded-file';
        
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
          if (matches && matches[1]) {
            filename = decodeURIComponent(matches[1]);
          } else {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
            }
          }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Download started!');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Error downloading file');
      }
    };

    downloadFile();

    return () => {
      downloadStarted.current = false;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <Link
        href="/"
        className="absolute top-4 left-4 text-blue-500 hover:text-blue-600"
        tabIndex={0}
      >
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold text-center">Downloading Files</h1>
      
      <div className="text-center">
        <p className="mb-4">Your download should start automatically.</p>
        <p>If it doesn't start, try refreshing the page.</p>
      </div>
    </div>
  );
} 