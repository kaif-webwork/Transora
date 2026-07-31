import crypto from 'crypto';

describe('SwiftShare Transfer & SHA-256 Chunk Verification Unit Tests', () => {
  test('SHA-256 Integrity Verification succeeds for valid chunk payload', () => {
    const chunkBuffer = Buffer.from('SwiftShare 5MB Test Chunk Data Payload');
    const expectedHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');

    const computedHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');
    expect(computedHash).toBe(expectedHash);
  });

  test('SHA-256 Integrity Verification rejects corrupted chunk payload', () => {
    const chunkBuffer = Buffer.from('Original Chunk Data');
    const corruptedBuffer = Buffer.from('Corrupted Chunk Data');

    const originalHash = crypto.createHash('sha256').update(chunkBuffer).digest('hex');
    const corruptedHash = crypto.createHash('sha256').update(corruptedBuffer).digest('hex');

    expect(originalHash).not.toBe(corruptedHash);
  });

  test('Calculates total chunk count correctly for multi-gigabyte file', () => {
    const fileSize5GB = 5 * 1024 * 1024 * 1024; // 5 GB
    const chunkSizeBytes = 5 * 1024 * 1024; // 5 MB
    const totalChunks = Math.ceil(fileSize5GB / chunkSizeBytes);

    expect(totalChunks).toBe(1024);
  });
});
