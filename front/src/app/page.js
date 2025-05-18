'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [fileId, setFileId] = useState('');

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!fileId.trim()) {
      toast.error('Please enter a file ID');
      return;
    }
    router.push(`/download/${fileId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-4xl font-bold text-center">File Exchanger</h1>
      
      <div className="w-full max-w-md">
        <form onSubmit={handleDownload} className="flex flex-col gap-4">
          <input
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Enter file ID"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="File ID input"
          />
          <button
            type="submit"
            className="w-full p-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Download Files
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="mb-4">or</p>
        <Link
          href="/upload"
          className="text-blue-500 hover:text-blue-600 underline"
          tabIndex={0}
        >
          Upload new files
        </Link>
      </div>
    </div>
  );
}
