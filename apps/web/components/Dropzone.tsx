'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, Folder, X, ShieldCheck, Lock, HardDrive } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function Dropzone({ onFilesSelected }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
      onFilesSelected(filesArr);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
      onFilesSelected(filesArr);
    }
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative cursor-pointer rounded-3xl p-12 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
          isDragOver
            ? 'border-brand-500 bg-brand-500/10 shadow-2xl shadow-brand-500/20'
            : 'border-white/20 bg-slate-900/40 hover:border-white/40 hover:bg-slate-900/60'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-neon-purple/5 pointer-events-none" />

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-neon-purple flex items-center justify-center mb-6 shadow-xl shadow-brand-500/30">
          <UploadCloud className="w-10 h-10 text-white animate-pulse" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          Drop your files or folders here
        </h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Support for images, videos, 4K ISOs, APKs, archives, and directories of any size with multi-lane parallel chunking.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:brightness-110 transition"
          >
            Select Files
          </button>
          <span className="text-xs text-slate-500 font-medium">OR</span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">
            Paste from Clipboard (Ctrl + V)
          </span>
        </div>
      </motion.div>

      {/* Selected Files List Preview */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 space-y-2 max-h-60 overflow-y-auto pr-2"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
              <span>{selectedFiles.length} File(s) Selected</span>
              <span>Total: {formatSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}</span>
            </div>

            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/10 text-sm"
              >
                <div className="flex items-center gap-3 truncate">
                  <File className="w-4 h-4 text-brand-400 shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">({formatSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
