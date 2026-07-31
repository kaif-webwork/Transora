import { create } from 'zustand';
import { Transfer, TransferStatus } from '@transora/shared';

interface ProgressData {
  uploadedChunks: number;
  totalChunks: number;
  currentSpeedBps: number;
  percentage: number;
  etaSeconds: number;
}

interface TransferState {
  currentTransfer: Transfer | null;
  uploadedChunks: number;
  totalChunks: number;
  transferSpeedBps: number;
  status: TransferStatus;
  isUploading: boolean;
  progress: ProgressData;
  setTransfer: (transfer: Transfer) => void;
  updateProgress: (uploadedChunks: number, totalChunks: number, speedBps: number) => void;
  setStatus: (status: TransferStatus) => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  currentTransfer: null,
  uploadedChunks: 0,
  totalChunks: 0,
  transferSpeedBps: 0,
  status: 'INITIALIZED',
  isUploading: false,
  progress: {
    uploadedChunks: 0,
    totalChunks: 0,
    currentSpeedBps: 0,
    percentage: 0,
    etaSeconds: 0,
  },
  setTransfer: (transfer) => set({ currentTransfer: transfer }),
  updateProgress: (uploadedChunks, totalChunks, speedBps) => {
    const percentage = totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0;
    const remainingChunks = Math.max(0, totalChunks - uploadedChunks);
    const chunkSize = 5 * 1024 * 1024;
    const remainingBytes = remainingChunks * chunkSize;
    const etaSeconds = speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;

    set({
      uploadedChunks,
      totalChunks,
      transferSpeedBps: speedBps,
      isUploading: uploadedChunks < totalChunks && uploadedChunks > 0,
      progress: {
        uploadedChunks,
        totalChunks,
        currentSpeedBps: speedBps,
        percentage,
        etaSeconds,
      },
    });
  },
  setStatus: (status) => set({ status, isUploading: status === 'UPLOADING' }),
}));
