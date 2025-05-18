'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedId, setUploadedId] = useState(null);
  const uploadInProgress = useRef(false);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (uploadInProgress.current) {
      return; // Prevent double submission
    }

    setUploading(true);
    uploadInProgress.current = true;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadedId(response.data.id);
      toast.success('Files uploaded successfully!');
      setFiles([]); // Clear files after successful upload
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Error uploading files');
    } finally {
      setUploading(false);
      uploadInProgress.current = false;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <Link
        href="/"
        className="absolute top-4 left-4 text-blue-500 hover:text-blue-600"
        tabIndex={0}
      >
        ← Back to Home
      </Link>

      <h1 className="text-4xl font-bold text-center">Upload Files</h1>

      <div className="w-full max-w-md">
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <p>Drag & drop files here, or click to select files</p>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Selected files:</h3>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="text-sm">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full mt-4 p-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>

      {uploadedId && (
        <div className="text-center mt-4">
          <p className="mb-2">Files uploaded successfully! Your file ID is:</p>
          <code className="bg-gray-100 p-2 rounded select-all">{uploadedId}</code>
          <p className="mt-4">
            <Link
              href={`/download/${uploadedId}`}
              className="text-blue-500 hover:text-blue-600 underline"
              tabIndex={0}
            >
              Download your files
            </Link>
          </p>
        </div>
      )}
    </div>
  );
} 