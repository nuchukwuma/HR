import { useState, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import ShiftForm from '../components/ShiftForm';
import ShiftDetails from '../components/ShiftDetails';
import SwapRequests from '../components/SwapRequests';
import { Alert, Button, Card, PageHeader } from '../components/ui';

function Shifts() {
  const { user } = useAuth();
  const canManage = user.role === 'manager' || user.role === 'hr';

  const [shifts, setShifts] = useState([]);
  const [range, setRange] = useState(null);       // the dates the calendar is showing
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [swapKey, setSwapKey] = useState(0);      // bump to reload the swap list
  const [error, setError] = useState('');

  const loadShifts = useCallback(async () => {
    if (!range) return;
    try {
      const data = await api(`/shifts?from=${range.start}&to=${range.end}`);
      setShifts(data.shifts);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [range]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadShifts();
}, [loadShifts]);

  const refresh = () => {
    loadShifts();
    setSwapKey((k) => k + 1);
  };

  const events = shifts.map((s) => {
    const mine = s.userId._id === user._id;
    const who = mine ? 'My shift' : s.userId.email;
    return {
      id: s._id,
      // the status is in the title so cancelled/missed shifts are obvious without any CSS
      title: s.status === 'scheduled' ? who : `${who} (${s.status})`,
      start: s.startTime,
      end: s.endTime,
    };
  });

  const selectedShift = shifts.find((s) => s._id === selectedId);

  return (
    <div>
      <PageHeader title="Shifts" subtitle="Your schedule. Click a shift to see details, clock in or out, or ask for a swap.">
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : 'Add shift'}</Button>
        )}
      </PageHeader>
      {error && <Alert>{error}</Alert>}

      {showForm && (
        <ShiftForm
          onCreated={() => {
            setShowForm(false);
            loadShifts();
          }}
        />
      )}

      <Card>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          eventClick={(info) => setSelectedId(info.event.id)}
          datesSet={(arg) =>
            setRange({ start: arg.start.toISOString(), end: arg.end.toISOString() })
          }
          height="auto"
        />
      </Card>

      {selectedShift && (
        <ShiftDetails
          key={selectedShift._id}
          shift={selectedShift}
          onChanged={refresh}
          onClose={() => setSelectedId(null)}
        />
      )}

      <SwapRequests refreshKey={swapKey} onChanged={refresh} />
    </div>
  );
}

export default Shifts;
