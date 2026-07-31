import { Server, Socket } from 'socket.io';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a transfer room (sender or receiver)
    socket.on('transfer:join', ({ transferId, role }) => {
      socket.join(transferId);
      console.log(`[Socket.IO] Socket ${socket.id} joined room ${transferId} as ${role}`);

      if (role === 'receiver') {
        // Notify room that receiver has joined
        socket.to(transferId).emit('receiver:joined', {
          transferId,
          receiverSocketId: socket.id,
        });
      }
    });

    // WebRTC Signaling Relay (Offer, Answer, ICE Candidates for LAN P2P mode)
    socket.on('webrtc:signal', ({ targetSocketId, signal }) => {
      io.to(targetSocketId).emit('webrtc:signal', {
        senderSocketId: socket.id,
        signal,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}
