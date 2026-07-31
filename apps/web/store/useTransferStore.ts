import { create } from 'zustand';
import { Transfer, TransferStatus } from '@transora/shared';

interface TransferState {
  currentTransfer: Transfer | null;
  uploadedChunks: number;
  totalChunks: number;
  transferSpeedBps: number;
  status: TransferStatus;
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
  setTransfer: (transfer) => set({ currentTransfer: transfer }),
  updateProgress: (uploadedChunks, totalChunks, speedBps) =>
    set({ uploadedChunks, totalChunks, transferSpeedBps: speedBps }),
  setStatus: (status) => set({ status }),
}));
