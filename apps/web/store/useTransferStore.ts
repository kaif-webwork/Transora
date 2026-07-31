import { create } from 'zustand';
import { Transfer, TransferStatus } from '@swiftshare/shared';

interface TransferProgress {
  uploadedChunks: number;
  totalChunks: number;
  currentSpeedBps: number;
  etaSeconds: number;
  percentage: number;
}

interface TransferStoreState {
  activeTransfer: Transfer | null;
  progress: TransferProgress;
  isUploading: boolean;
  setActiveTransfer: (transfer: Transfer | null) => void;
  updateProgress: (uploadedChunks: number, totalChunks: number, speedBps: number) => void;
  resetProgress: () => void;
}

export const useTransferStore = create<TransferStoreState>((set) => ({
  activeTransfer: null,
  progress: {
    uploadedChunks: 0,
    totalChunks: 0,
    currentSpeedBps: 0,
    etaSeconds: 0,
    percentage: 0,
  },
  isUploading: false,
  setActiveTransfer: (transfer) => set({ activeTransfer: transfer }),
  updateProgress: (uploadedChunks, totalChunks, speedBps) => {
    const percentage = totalChunks > 0 ? Math.min(Math.round((uploadedChunks / totalChunks) * 100), 100) : 0;
    const remainingChunks = totalChunks - uploadedChunks;
    // Estimate 5MB per chunk
    const remainingBytes = remainingChunks * 5 * 1024 * 1024;
    const etaSeconds = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;

    set({
      progress: {
        uploadedChunks,
        totalChunks,
        currentSpeedBps: speedBps,
        etaSeconds,
        percentage,
      },
      isUploading: uploadedChunks < totalChunks,
    });
  },
  resetProgress: () =>
    set({
      progress: { uploadedChunks: 0, totalChunks: 0, currentSpeedBps: 0, etaSeconds: 0, percentage: 0 },
      isUploading: false,
    }),
}));
