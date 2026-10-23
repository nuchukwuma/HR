import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { api } from '../utils/api';
import { Alert, Button } from './ui';
import { inputClass } from '../utils/styles';

function ChatWindow({ channelId, onRead }) {
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);   
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const boxRef = useRef(null);            
  const stickToBottomRef = useRef(true);  
  const oldHeightRef = useRef(null);      
  const busyRef = useRef(false);          

  useEffect(() => {
    api(`/channels/${channelId}/messages`)
      .then((data) => {
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setLoading(false);
        onRead(channelId); 
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [channelId, onRead]);

  useEffect(() => {
    const onNewMessage = (message) => {
      if (message.channelId !== channelId) return;
      setMessages((old) => (old.some((m) => m._id === message._id) ? old : [...old, message]));
      onRead(channelId);
    };

    socket.on('message:new', onNewMessage);
    return () => socket.off('message:new', onNewMessage); 
  }, [socket, channelId, onRead]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    if (oldHeightRef.current !== null) {

      box.scrollTop = box.scrollHeight - oldHeightRef.current;
      oldHeightRef.current = null;
    } else if (stickToBottomRef.current) {
      box.scrollTop = box.scrollHeight; 
    }
  }, [messages]);

  const loadOlder = async () => {
    if (busyRef.current || !hasMore || messages.length === 0) return;
    busyRef.current = true;
    setLoadingOlder(true);

    try {
      const data = await api(`/channels/${channelId}/messages?before=${messages[0]._id}`);
      oldHeightRef.current = boxRef.current.scrollHeight; 
      setMessages((old) => [...data.messages, ...old]);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      busyRef.current = false;
      setLoadingOlder(false);
    }
  };

  const handleScroll = () => {
    const box = boxRef.current;

    stickToBottomRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 40;

    if (box.scrollTop < 40) loadOlder();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    stickToBottomRef.current = true; 
    try {
      
      const res = await socket.timeout(5000).emitWithAck('message:send', { channelId, text });
      if (res.ok) {
        setText('');
        setError('');
      } else {
        setError(res.error);
      }
    } catch {
      setError('The server did not answer. Check your connection and try again.');
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}

      <div
        ref={boxRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Messages"
        className="h-80 space-y-3 overflow-y-auto rounded-lg border border-blue-100 bg-blue-50 p-3"
      >
        {hasMore && (
          <div className="text-center">
            <Button variant="secondary" size="sm" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? 'Loading...' : 'Load older messages'}
            </Button>
          </div>
        )}

        {loading && <p className="text-sm text-blue-900/60">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-blue-900/60">No messages yet. Say hello!</p>
        )}

        {messages.map((m) => {
          const mine = m.senderId._id === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-blue-600 text-white' : 'border border-blue-100 bg-white text-blue-950'
                }`}
              >
                <p className={`mb-0.5 text-xs ${mine ? 'text-blue-100' : 'text-blue-900/60'}`}>
                  <b>{mine ? 'You' : m.senderId.email}</b> · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-line break-words">{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
          aria-label="Message"
          maxLength={2000}
          className={inputClass}
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}

export default ChatWindow;
