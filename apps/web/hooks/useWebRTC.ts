import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebRTC(transferId: string, isSender: boolean) {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!transferId) return;

    const socket: Socket = io('/', { path: '/socket.io' });

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc:signal', { transferId, signal: { candidate: event.candidate } });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnectionState('connected');
      if (pc.connectionState === 'failed') setConnectionState('failed');
    };

    if (isSender) {
      const dc = pc.createDataChannel('transora_lan');
      dc.binaryType = 'arraybuffer';
      dc.onopen = () => setConnectionState('connected');
      setDataChannel(dc);

      pc.createOffer().then((offer) => {
        pc.setLocalDescription(offer);
        socket.emit('webrtc:signal', { transferId, signal: { offer } });
      });
    } else {
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dc.binaryType = 'arraybuffer';
        dc.onopen = () => setConnectionState('connected');
        setDataChannel(dc);
      };
    }

    socket.emit('transfer:join', { transferId, role: isSender ? 'sender' : 'receiver' });

    socket.on('webrtc:signal', async (data: { signal: any }) => {
      const { signal } = data;
      if (signal.offer && !isSender) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:signal', { transferId, signal: { answer } });
      } else if (signal.answer && isSender) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    });

    return () => {
      pc.close();
      socket.disconnect();
    };
  }, [transferId, isSender]);

  return { connectionState, dataChannel };
}
