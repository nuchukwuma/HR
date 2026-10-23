import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessPartnerApi } from '../utils/api';
import { inputClass, labelClass, tableClass, thClass, tdClass } from '../utils/styles';
import { Alert, Avatar, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui';

const DEPARTMENTS = [
  'Engineering',
  'Sales & Marketing',
  'Product & Design',
  'Human Resources',
  'Finance & Operations',
  'Customer Support',
];

const blankForm = {
  name: '',
  email: '',
  phone: '',
  department: 'Engineering',
  assignedTeams: '',
  status: 'Active',
  notes: '',
};

const statusTone = (status) => {
  if (status === 'Active') return 'green';
  if (status === 'On Leave') return 'amber';
  return 'gray';
};

export default function BusinessPartnerPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState(blankForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const getPartners = useCallback(() => businessPartnerApi.getAll({
    search,
    department: selectedDept,
    status: selectedStatus,
  }), [search, selectedDept, selectedStatus]);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPartners();
      if (result.success) setPartners(result.data);
    } catch (error) {
      showToast(error.message || 'Failed to load business partners', 'error');
    } finally {
      setLoading(false);
    }
  }, [getPartners, showToast]);

  useEffect(() => {
    let active = true;
    getPartners()
      .then((result) => {
        if (active && result.success) setPartners(result.data);
      })
      .catch((error) => {
        if (active) showToast(error.message || 'Failed to load business partners', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getPartners, showToast]);

  const openEdit = (partner) => {
    setCurrentPartner(partner);
    setFormData({
      name: partner.name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      department: partner.department || 'Engineering',
      assignedTeams: Array.isArray(partner.assignedTeams)
        ? partner.assignedTeams.join(', ')
        : partner.assignedTeams || '',
      status: partner.status || 'Active',
      notes: partner.notes || '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    if (!formData.department) errors.department = 'Please select a department';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = {
      ...formData,
      assignedTeams: formData.assignedTeams
        ? formData.assignedTeams.split(',').map((team) => team.trim()).filter(Boolean)
        : [],
    };

    try {
      const result = await businessPartnerApi.update(currentPartner._id, payload);
      if (!result.success) throw new Error(result.message || 'Could not save business partner');
      showToast('Business partner updated');
      setIsFormOpen(false);
      await fetchPartners();
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Error saving partner data', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentPartner) return;
    setSubmitting(true);
    try {
      const result = await businessPartnerApi.delete(currentPartner._id);
      if (!result.success) throw new Error(result.message || 'Could not delete business partner');
      showToast('Business partner deleted');
      setIsDeleteOpen(false);
      await fetchPartners();
    } catch (error) {
      showToast(error.message || 'Failed to delete business partner', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field) => (event) =>
    setFormData((current) => ({ ...current, [field]: event.target.value }));

  const actions = (partner) => (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={() => {
        setCurrentPartner(partner);
        setIsDetailOpen(true);
      }}>View</Button>
      <Button size="sm" variant="secondary" onClick={() => openEdit(partner)}>Edit</Button>
      <Button size="sm" variant="danger" onClick={() => {
        setCurrentPartner(partner);
        setIsDeleteOpen(true);
      }}>Delete</Button>
    </div>
  );

  return (
    <div>
      {toast && (
        <div className="fixed right-6 top-6 z-50 w-[min(24rem,calc(100vw-3rem))]">
          <Alert type={toast.type === 'error' ? 'error' : 'success'}>{toast.message}</Alert>
        </div>
      )}

      <PageHeader
        title="Business Partners"
      >
        <Button onClick={() => navigate('/partners/new')}>Add business partner</Button>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="search"
            aria-label="Search business partners"
            placeholder="Search by name, email, or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={inputClass}
          />
          <select
            aria-label="Filter by department"
            value={selectedDept}
            onChange={(event) => setSelectedDept(event.target.value)}
            className={inputClass}
          >
            <option value="All">All departments</option>
            {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
          </select>
          <select
            aria-label="Filter by status"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className={inputClass}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On leave</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              Cards
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><EmptyState>Loading business partners...</EmptyState></Card>
      ) : partners.length === 0 ? (
        <Card>
          <EmptyState>No business partners found. Try changing the filters or add a partner.</EmptyState>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Partner</th>
                  <th className={thClass}>Department</th>
                  <th className={thClass}>Assigned teams</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {partners.map((partner) => (
                  <tr key={partner._id} className="hover:bg-blue-50/60">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Avatar name={partner.name} size="sm" />
                        <div>
                          <p className="font-medium text-blue-950">{partner.name}</p>
                          <p className="text-xs text-blue-900/60">{partner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>{partner.department}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {partner.assignedTeams?.length
                          ? partner.assignedTeams.map((team) => <Badge key={team}>{team}</Badge>)
                          : <span className="text-blue-900/50">Unassigned</span>}
                      </div>
                    </td>
                    <td className={tdClass}><Badge tone={statusTone(partner.status)}>{partner.status}</Badge></td>
                    <td className={tdClass}>{actions(partner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.map((partner) => (
            <Card key={partner._id} className="mb-0">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={partner.name} />
                  <div>
                    <h2 className="font-semibold text-blue-950">{partner.name}</h2>
                    <p className="text-sm text-blue-900/60">{partner.department}</p>
                  </div>
                </div>
                <Badge tone={statusTone(partner.status)}>{partner.status}</Badge>
              </div>
              <div className="space-y-1 text-sm text-blue-900">
                <p>{partner.email}</p>
                <p>{partner.phone || 'No phone listed'}</p>
              </div>
              <div className="my-4">
                <p className={labelClass}>Assigned teams</p>
                <div className="flex flex-wrap gap-1">
                  {partner.assignedTeams?.length
                    ? partner.assignedTeams.map((team) => <Badge key={team}>{team}</Badge>)
                    : <span className="text-sm text-blue-900/50">Unassigned</span>}
                </div>
              </div>
              {actions(partner)}
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && currentPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-blue-950/40 p-4">
          <Card className="my-auto w-full max-w-xl">
            <h2 className="mb-4 text-lg font-semibold text-blue-950">
              Edit business partner
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="partner-name">Full name *</label>
                <input id="partner-name" value={formData.name} onChange={updateField('name')} className={inputClass} />
                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="partner-email">Email address *</label>
                  <input id="partner-email" type="email" value={formData.email} onChange={updateField('email')} className={inputClass} />
                  {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="partner-phone">Phone</label>
                  <input id="partner-phone" value={formData.phone} onChange={updateField('phone')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="partner-department">Department *</label>
                  <select id="partner-department" value={formData.department} onChange={updateField('department')} className={inputClass}>
                    {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
                  </select>
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
                <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save partner'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isDetailOpen && currentPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-blue-950/40 p-4">
          <Card className="my-auto w-full max-w-lg">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={currentPartner.name} />
                <div>
                  <h2 className="font-semibold text-blue-950">{currentPartner.name}</h2>
                  <p className="text-sm text-blue-900/60">{currentPartner.department}</p>
                </div>
              </div>
              <Badge tone={statusTone(currentPartner.status)}>{currentPartner.status}</Badge>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className={labelClass}>Email</dt><dd className="text-blue-950">{currentPartner.email}</dd></div>
              <div><dt className={labelClass}>Phone</dt><dd className="text-blue-950">{currentPartner.phone || 'Not provided'}</dd></div>
              <div>
                <dt className={labelClass}>Assigned teams</dt>
                <dd className="flex flex-wrap gap-1">
                  {currentPartner.assignedTeams?.length
                    ? currentPartner.assignedTeams.map((team) => <Badge key={team}>{team}</Badge>)
                    : <span className="text-blue-900/50">Unassigned</span>}
                </dd>
              </div>
              <div><dt className={labelClass}>Notes</dt><dd className="text-blue-900">{currentPartner.notes || 'No notes available.'}</dd></div>
            </dl>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {isDeleteOpen && currentPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-lg font-semibold text-blue-950">Delete business partner?</h2>
            <p className="my-3 text-sm text-blue-900/70">
              Delete {currentPartner.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="danger" disabled={submitting} onClick={handleDelete}>
                {submitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
