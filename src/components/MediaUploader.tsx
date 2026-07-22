import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadWithProgressToSupabase, deleteFromSupabase } from '../utils/supabaseStorage';
import { toast } from 'react-hot-toast';

interface MediaUploaderProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  bucket?: string;
  label?: string;
  className?: string;
  category?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
  status: 'uploading' | 'success' | 'error';
}

export default function MediaUploader({
  urls = [],
  onChange,
  multiple = false,
  maxFiles = 5,
  accept = "image/*",
  bucket = "images",
  label = "Upload Media",
  className = "",
  category = "general"
}: MediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const urlsRef = useRef(urls);
  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);

  const startUpload = async (uploadItem: UploadingFile) => {
    try {
      const url = await uploadWithProgressToSupabase(
        uploadItem.file,
        bucket,
        (progress) => {
          setUploads(prev => prev.map(u => 
            u.id === uploadItem.id ? { ...u, progress, status: 'uploading', error: undefined } : u
          ));
        },
        category
      );

      if (url) {
        setUploads(prev => prev.map(u => 
          u.id === uploadItem.id ? { ...u, status: 'success', progress: 100 } : u
        ));
        
        if (multiple) {
          const updatedUrls = [...urlsRef.current, url];
          urlsRef.current = updatedUrls;
          onChange(updatedUrls);
        } else {
          urlsRef.current = [url];
          onChange([url]);
        }
        
        // Remove from uploading state after brief delay
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== uploadItem.id));
          URL.revokeObjectURL(uploadItem.previewUrl);
        }, 500);
      } else {
        throw new Error("Upload failed");
      }
    } catch (err: any) {
      setUploads(prev => prev.map(u => 
        u.id === uploadItem.id ? { ...u, status: 'error', error: err.message || "Failed to upload" } : u
      ));
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Check capacity
    const currentTotal = multiple ? urls.filter(url => url && url.trim() !== '').length + uploads.length : 0;
    const allowed = multiple ? Math.max(0, maxFiles - currentTotal) : 1;
    
    if (allowed === 0) {
      toast.error(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    const filesToUpload = fileArray.slice(0, allowed);

    // If single file, we replace the existing url
    if (!multiple) {
      if (urls.length > 0) {
        // Auto-cleanup the old file from bucket
        deleteFromSupabase(urls[0], bucket);
      }
      setUploads([]); // clear any failed uploads
    }

    const newUploads = filesToUpload.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading' as const
    }));

    setUploads(prev => multiple ? [...prev, ...newUploads] : newUploads);

    newUploads.forEach(startUpload);
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    deleteFromSupabase(urlToRemove, bucket); // auto cleanup
    onChange(urls.filter(url => url !== urlToRemove));
  };

  const handleRemoveUpload = (id: string) => {
    const item = uploads.find(u => u.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const handleRetryUpload = (uploadItem: UploadingFile) => {
    setUploads(prev => prev.map(u => 
      u.id === uploadItem.id ? { ...u, status: 'uploading', error: undefined, progress: 0 } : u
    ));
    startUpload(uploadItem);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [urls, uploads, multiple, maxFiles]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      {(!multiple) || (multiple && urls.filter(url => url && url.trim() !== '').length + uploads.length < maxFiles) ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition flex flex-col items-center justify-center text-center cursor-pointer ${
            isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = ''; // reset
            }}
          />
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full mb-3 shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <p className="font-bold text-gray-700 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-1">
            Drag and drop or click to select {multiple ? `(max ${maxFiles})` : ''}
          </p>
        </div>
      ) : null}

      {/* Grid of uploaded and uploading items */}
      {(urls.filter(url => url && url.trim() !== '').length > 0 || uploads.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          
          {/* Completed Uploads */}
          {urls.filter(url => url && url.trim() !== '').map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square flex items-center justify-center">
              {accept.includes('image') ? (
                <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
              ) : (
                <div className="text-emerald-600"><ImageIcon className="w-8 h-8" /></div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => window.open(url, '_blank')}
                  className="bg-white text-gray-900 p-1.5 rounded-full hover:bg-gray-200 shadow-sm transition tooltip"
                  title="View Larger"
                >
                  <Upload className="w-4 h-4 transform rotate-45" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm transition tooltip"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Uploading items */}
          {uploads.map((u) => (
            <div key={u.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
              <img src={u.previewUrl} alt="preview" className={`w-full h-full object-cover ${u.status === 'uploading' ? 'opacity-50 blur-[2px]' : ''}`} />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
                {u.status === 'uploading' && (
                  <div className="w-3/4 bg-gray-200 rounded-full h-2 shadow-sm overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 transition-all duration-300 ease-out" 
                      style={{ width: `${u.progress}%` }}
                    ></div>
                  </div>
                )}
                
                {u.status === 'error' && (
                  <div className="bg-white/90 p-2 rounded-lg text-center shadow-lg border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-[10px] font-bold text-red-600 mb-2">{u.error}</p>
                    <div className="flex gap-2 justify-center">
                      <button type="button" onClick={() => handleRetryUpload(u)} className="bg-emerald-100 text-emerald-700 p-1 rounded hover:bg-emerald-200"><RefreshCw className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleRemoveUpload(u.id)} className="bg-gray-200 text-gray-700 p-1 rounded hover:bg-gray-300"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Replace option for single upload when max reached */}
      {!multiple && urls.length === 1 && uploads.length === 0 && (
         <div className="text-center">
           <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
           >
             Replace Media
           </button>
           <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            multiple={false}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
         </div>
      )}
    </div>
  );
}
