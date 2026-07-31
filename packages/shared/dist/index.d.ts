export type UserRole = 'GUEST' | 'USER' | 'ADMIN';
export type TransferStatus = 'INITIALIZED' | 'UPLOADING' | 'READY' | 'DOWNLOADING' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
export type TransferMode = 'CLOUD_CHUNK' | 'WEBRTC_LAN' | 'DIRECT_P2P';
export type LinkExpiryType = '1_HOUR' | '24_HOURS' | '7_DAYS' | 'NEVER';
export interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: UserRole;
    isVerified: boolean;
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
export interface FileChunkInfo {
    index: number;
    sizeBytes: number;
    sha256Checksum: string;
    isUploaded: boolean;
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
    hasPassword?: boolean;
    maxDownloads?: number;
    downloadCount: number;
    totalSizeBytes: number;
    totalChunks: number;
    uploadedChunks: number;
    expiryType: LinkExpiryType;
    expiresAt?: string;
    createdAt: string;
    files: FileMetadata[];
}
export interface InitTransferRequest {
    title: string;
    description?: string;
    transferMode?: TransferMode;
    isE2EE?: boolean;
    encryptionSalt?: string;
    password?: string;
    maxDownloads?: number;
    expiryType?: LinkExpiryType;
    files: {
        fileName: string;
        fileSizeBytes: number;
        mimeType: string;
        sha256Checksum: string;
        chunkSizeBytes: number;
        totalChunks: number;
    }[];
}
export interface InitTransferResponse {
    transferId: string;
    shareCode: string;
    shareUrl: string;
    uploadUrls?: {
        fileId: string;
        chunkIndex: number;
        uploadUrl: string;
    }[];
}
export interface ChunkUploadMetadata {
    transferId: string;
    fileId: string;
    chunkIndex: number;
    chunkSizeBytes: number;
    sha256Checksum: string;
}
export interface SystemStats {
    totalUsers: number;
    activeTransfers: number;
    completedTransfers: number;
    totalBytesTransferred: number;
    activeSockets: number;
}
export interface SocketServerToClientEvents {
    'transfer:status_changed': (data: {
        transferId: string;
        status: TransferStatus;
    }) => void;
    'chunk:progress': (data: {
        transferId: string;
        fileId: string;
        chunkIndex: number;
        totalUploadedChunks: number;
        totalChunks: number;
        speedBps: number;
        percentage: number;
    }) => void;
    'chunk:available': (data: {
        transferId: string;
        fileId: string;
        chunkIndex: number;
    }) => void;
    'receiver:joined': (data: {
        transferId: string;
        receiverSocketId: string;
    }) => void;
    'webrtc:signal': (data: {
        senderSocketId: string;
        signal: any;
    }) => void;
    'notification': (data: {
        type: 'success' | 'info' | 'warning' | 'error';
        message: string;
    }) => void;
}
export interface SocketClientToServerEvents {
    'transfer:join': (data: {
        transferId: string;
        role: 'sender' | 'receiver';
    }) => void;
    'transfer:leave': (data: {
        transferId: string;
    }) => void;
    'chunk:notify_uploaded': (data: {
        transferId: string;
        fileId: string;
        chunkIndex: number;
    }) => void;
    'webrtc:signal': (data: {
        targetSocketId: string;
        signal: any;
    }) => void;
}
//# sourceMappingURL=index.d.ts.map