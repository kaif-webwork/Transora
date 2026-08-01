export type TransferStatus = 'INITIALIZED' | 'UPLOADING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
export type TransferMode = 'CLOUD_CHUNK' | 'WEBRTC_LAN';
export type ExpiryType = '1_HOUR' | '24_HOURS' | '7_DAYS' | 'NEVER';
export type UserRole = 'USER' | 'ADMIN';
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    storageQuotaBytes: number;
    storageUsedBytes: number;
    createdAt: string;
}
export interface FileMetadata {
    id: string;
    transferId: string;
    fileName: string;
    filePath: string;
    fileSizeBytes: number;
    mimeType: string;
    sha256Checksum: string;
}
export interface Transfer {
    id: string;
    senderId?: string;
    title: string;
    description?: string;
    shareCode: string;
    transferMode: TransferMode;
    status: TransferStatus;
    isE2EE: boolean;
    encryptionSalt?: string;
    passwordHash?: string;
    maxDownloads?: number;
    downloadCount: number;
    totalSizeBytes: number;
    totalChunks: number;
    uploadedChunks: number;
    expiryType: ExpiryType;
    expiresAt?: string;
    createdAt: string;
    files: FileMetadata[];
}
export interface InitTransferRequest {
    shareCode?: string;
    title?: string;
    description?: string;
    password?: string;
    expiryType?: ExpiryType;
    maxDownloads?: number;
    transferMode?: TransferMode;
    isE2EE?: boolean;
    encryptionSalt?: string;
    files: {
        fileName: string;
        fileSizeBytes: number;
        mimeType: string;
        sha256Checksum: string;
        chunkSizeBytes: number;
        totalChunks: number;
    }[];
}
export interface ServerToClientEvents {
    'chunk:progress': (data: {
        transferId: string;
        uploadedChunks: number;
        totalChunks: number;
        speedBps: number;
    }) => void;
    'transfer:complete': (data: {
        transferId: string;
        shareCode: string;
        downloadUrl: string;
    }) => void;
    'receiver:joined': (data: {
        transferId: string;
    }) => void;
    'webrtc:signal': (data: {
        senderId: string;
        signal: any;
    }) => void;
}
export interface ClientToServerEvents {
    'transfer:join': (data: {
        transferId: string;
        role: 'sender' | 'receiver';
    }) => void;
    'webrtc:signal': (data: {
        transferId: string;
        signal: any;
    }) => void;
}
//# sourceMappingURL=index.d.ts.map