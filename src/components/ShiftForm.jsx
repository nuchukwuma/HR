import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../utils/api';
import { Alert, Button, Card } from './ui';
import { inputClass, labelClass } from '../utils/styles';

const schema = z
  .object({
    userId: z.string().min(1, 'Choose an employee'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  })
  .refine(
    (d) => !d.startTime || !d.endTime || new Date(d.endTime) > new Date(d.startTime),
    { message: 'End time must be after start time', path: ['endTime'] }
  );

function ShiftForm({ onCreated }) {
  const [people, setPeople] = useState([]);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    api('/shifts/people')
      .then((data) => setPeople(data.people))
      .catch((err) => setServerError(err.message));
  }, []);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await api('/shifts', {
        method: 'POST',
        body: {
          userId: data.userId,

          startTime: new Date(data.startTime).toISOString(),
          endTime: new Date(data.endTime).toISOString(),
        },
      });
      reset();
      onCreated();
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <Card title="Add a shift">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="shift-user" className={labelClass}>Employee</label>
          <select id="shift-user" {...register('userId')} className={inputClass}>
            <option value="">Select...</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>{p.email}</option>
            ))}
          </select>
          {errors.userId && <p className="mt-1 text-xs text-red-600">{errors.userId.message}</p>}
        </div>

        <div>
          <label htmlFor="shift-start" className={labelClass}>Start</label>
          <input id="shift-start" type="datetime-local" {...register('startTime')} className={inputClass} />
          {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p>}
        </div>

        <div>
          <label htmlFor="shift-end" className={labelClass}>End</label>
          <input id="shift-end" type="datetime-local" {...register('endTime')} className={inputClass} />
          {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p>}
        </div>

        <div className="sm:col-span-3">
          {serverError && <Alert>{serverError}</Alert>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Create shift'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ShiftForm;
