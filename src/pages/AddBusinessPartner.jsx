import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, PageHeader } from '../components/ui';
import { businessPartnerApi } from '../utils/api';
import { inputClass, labelClass } from '../utils/styles';

const DEPARTMENTS = [
  'Engineering',
  'Sales & Marketing',
  'Product & Design',
  'Human Resources',
  'Finance & Operations',
  'Customer Support',
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  department: 'Engineering',
  assignedTeams: '',
  status: 'Active',
  notes: '',
};

export default function AddBusinessPartner() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) =>
    setFormData((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.department) errors.department = 'Please select a department';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setError('');
    setSubmitting(true);
    const payload = {
      ...formData,
      assignedTeams: formData.assignedTeams
        ? formData.assignedTeams.split(',').map((team) => team.trim()).filter(Boolean)
        : [],
    };

    try {
      const result = await businessPartnerApi.create(payload);
      if (!result.success) throw new Error(result.message || 'Could not save business partner');
      navigate('/partners');
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Error saving partner data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Add business partner" subtitle="Add a partner and their team coverage details.">
        <Button variant="secondary" onClick={() => navigate('/partners')}>Cancel</Button>
      </PageHeader>

      <Card>
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="partner-name">Full name *</label>
            <input id="partner-name" value={formData.name} onChange={updateField('name')} className={inputClass} required />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="partner-email">Email address *</label>
              <input id="partner-email" type="email" value={formData.email} onChange={updateField('email')} className={inputClass} required />
              {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="partner-phone">Phone</label>
              <input id="partner-phone" value={formData.phone} onChange={updateField('phone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="partner-department">Department *</label>
              <select id="partner-department" value={formData.department} onChange={updateField('department')} className={inputClass} required>
                {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
              </select>
              {formErrors.department && <p className="mt-1 text-xs text-red-600">{formErrors.department}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="partner-status">Status</label>
              <select id="partner-status" value={formData.status} onChange={updateField('status')} className={inputClass}>
                <option>Active</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="partner-teams">Assigned teams</label>
            <input id="partner-teams" placeholder="Comma-separated team names" value={formData.assignedTeams} onChange={updateField('assignedTeams')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="partner-notes">Notes / coverage scope</label>
            <textarea id="partner-notes" rows={3} value={formData.notes} onChange={updateField('notes')} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/partners')}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save partner'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
