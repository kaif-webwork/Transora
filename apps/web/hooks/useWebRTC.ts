import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebRTC(transferId: string, role: 'sender' | 'receiver') {
  const [peerConnected, setPeerConnected] = useState(false);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!transferId) return;

    const socket = io('/', { path: '/socket.io' });
    socketRef.current = socket;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    socket.emit('transfer:join', { transferId, role });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc:signal', {
          targetSocketId: transferId,
          signal: { candidate: event.candidate },
        });
      }
    };

    if (role === 'sender') {
      const dc = pc.createDataChannel('swiftshare_lan');
      dc.onopen = () => {
        setPeerConnected(true);
        setDataChannel(dc);
      };
      dc.onclose = () => setPeerConnected(false);
    } else {
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.onopen = () => {
          setPeerConnected(true);
          setDataChannel(dc);
        };
        dc.onclose = () => setPeerConnected(false);
      };
    }

    socket.on('receiver:joined', async () => {
      if (role === 'sender') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:signal', { targetSocketId: transferId, signal: { offer } });
      }
    });

    socket.on('webrtc:signal', async ({ signal }) => {
      if (signal.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:signal', { targetSocketId: transferId, signal: { answer } });
      } else if (signal.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    return () => {
      socket.disconnect();
      pc.close();
    };
  }, [transferId, role]);

  return { peerConnected, dataChannel };
}
