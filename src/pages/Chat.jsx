import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { api } from '../utils/api';
import ChatWindow from '../components/ChatWindow';
import NewChannelForm from '../components/NewChannelForm';
import ChannelMembers from '../components/ChannelMembers';
import { Alert, Button, PageHeader } from '../components/ui';

function Chat() {
  const { user } = useAuth();
  const socket = useSocket();
  const canCreate = user.role === 'manager' || user.role === 'hr';

  const [channels, setChannels] = useState([]);
  const [chosenId, setChosenId] = useState(null); 
  const [reloadKey, setReloadKey] = useState(0); 
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    api('/channels')
      .then((data) => {
        setChannels(data.channels);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [reloadKey]);

  const current = channels.find((c) => c._id === chosenId) || channels[0];
  const currentId = current?._id;

  useEffect(() => {
    const onNewMessage = (message) => {
      if (message.channelId === currentId) return;    

      if (message.senderId._id === user._id) return;    


      setChannels((old) =>
        old.map((c) => (c._id === message.channelId ? { ...c, unread: c.unread + 1 } : c))
      );
    };

    socket.on('message:new', onNewMessage);
    socket.on('channel:new', reload);     

    socket.on('channel:removed', reload); 

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('channel:new', reload);
      socket.off('channel:removed', reload);
    };
  }, [socket, currentId, user._id, reload]);

  const markRead = useCallback((channelId) => {
    api(`/channels/${channelId}/read`, { method: 'POST' }).catch(() => {});
    setChannels((old) => old.map((c) => (c._id === channelId ? { ...c, unread: 0 } : c)));
  }, []);

  const handleCreated = (channel) => {
    setChosenId(channel._id);
    setShowForm(false);
    reload();
  };

  return (
    <div>
      <PageHeader title="Chat" >
        {canCreate && (
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'New channel'}</Button>
        )}
      </PageHeader>
      {error && <Alert>{error}</Alert>}
      {showForm && <NewChannelForm onCreated={handleCreated} />}

      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">

        <nav aria-label="Channels" className="rounded-xl border border-blue-100 bg-white p-2 shadow-sm md:self-start">
          <h2 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-900/60">Channels</h2>
          <ul className="space-y-1">
            {channels.map((c) => {
              const active = c._id === currentId;
              const showBadge = !active && c.unread > 0;
              return (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => setChosenId(c._id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      active ? 'bg-blue-50 font-semibold text-blue-700' : 'text-blue-900 hover:bg-blue-100'
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      {c.name} <span className="text-xs font-normal text-blue-400">{c.type}</span>
                    </span>
                    {showBadge && (
                      <span
                        aria-label={`${c.unread} unread`}
                        className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white"
                      >
                        {c.unread > 99 ? '99+' : c.unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {current ? (
          <section className="min-w-0 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-blue-950">{current.name}</h2>
            {current.type === 'group' && <ChannelMembers channel={current} onChanged={reload} />}
            <ChatWindow key={current._id} channelId={current._id} onRead={markRead} />
          </section>
        ) : (
          <p className="text-sm text-blue-900/60">No channels yet.</p>
        )}
      </div>
    </div>
  );
}

export default Chat;
