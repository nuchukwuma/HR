import { useSearchParams } from 'react-router-dom';
import ResourcePage from '../components/ResourcePage';
import { Avatar, Badge } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { formatDate, fullName } from '../utils/format';

const statusTone = { active: 'green', invited: 'amber', deactivated: 'red' };

const columns = [
  {
    key: 'photo',
    label: '',
    value: () => '',
    render: (r) => <Avatar src={r.profilePhoto} name={fullName(r.personalInfo)} size="sm" />,
  },
  { key: 'name', label: 'Name', value: (r) => fullName(r.personalInfo) },
  { key: 'email', label: 'Email', value: (r) => r.userId?.email },
  { key: 'role', label: 'Role', value: (r) => r.userId?.role },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'team', label: 'Team', value: (r) => r.userId?.teamId?.name || '' },
  { key: 'employmentType', label: 'Type' },
  { key: 'hireDate', label: 'Hired', render: (r) => formatDate(r.hireDate) },
  {
    key: 'status',
    label: 'Account',
    value: (r) => r.userId?.status,
    render: (r) => <Badge tone={statusTone[r.userId?.status]}>{r.userId?.status}</Badge>,
  },
];

const employmentTypes = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
];

// HR: the form for a NEW employee (creates the login account and the profile together)
const addFields = [
  { name: 'email', label: 'Work email', type: 'email', required: true },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      { value: 'employee', label: 'Employee' },
      { value: 'manager', label: 'Manager' },
      { value: 'hr', label: 'HR' },
    ],
  },
  { name: 'firstName', label: 'First name', required: true },
  { name: 'lastName', label: 'Last name', required: true },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
  { name: 'hireDate', label: 'Hire date', type: 'date', required: true },
  { name: 'jobTitle', label: 'Job title', required: true },
  { name: 'employmentType', label: 'Employment type', type: 'select', required: true, options: employmentTypes },
  { name: 'teamId', label: 'Team', type: 'select', optionsFrom: { path: '/teams', listKey: 'teams', label: 'name' } },
  { name: 'managerId', label: 'Manager', type: 'select', optionsFrom: { path: '/employees/managers', label: 'email' } },
];

// HR: the form for EDITING a profile
const hrEditFields = [
  { name: 'personalInfo.firstName', label: 'First name', required: true },
  { name: 'personalInfo.lastName', label: 'Last name', required: true },
  { name: 'personalInfo.email', label: 'Contact email', type: 'email', required: true },
  { name: 'personalInfo.phoneNumber', label: 'Phone' },
  { name: 'personalInfo.address', label: 'Address', full: true },
  { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
  { name: 'hireDate', label: 'Hire date', type: 'date', required: true },
  { name: 'jobTitle', label: 'Job title', required: true },
  { name: 'employmentType', label: 'Employment type', type: 'select', required: true, options: employmentTypes },
  { name: 'emergencyContact.name', label: 'Emergency contact name' },
  { name: 'emergencyContact.phone', label: 'Emergency contact phone' },
  { name: 'emergencyContact.relationship', label: 'Relationship' },
];

// An employee editing their OWN details: only contact information
const selfEditFields = [
  { name: 'phoneNumber', label: 'Phone' },
  { name: 'address', label: 'Address' },
  { name: 'emergencyContact.name', label: 'Emergency contact name' },
  { name: 'emergencyContact.phone', label: 'Emergency contact phone' },
  { name: 'emergencyContact.relationship', label: 'Relationship' },
];

function EmployeeData() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isHr = user.role === 'hr';

  const subtitle = isHr
    ? 'Everyone in the company.'
    : user.role === 'manager'
      ? 'You and the people on your team.'
      : 'Your own details.';

  return (
    <ResourcePage
      title="Employee Data"
      subtitle={subtitle}
      noun="employee"
      listPath="/employees"
      columns={columns}
      fields={isHr ? hrEditFields : selfEditFields}
      createFields={addFields}
      addLabel="Add employee"
      canCreate={isHr}
      openCreateOnLoad={isHr && searchParams.get('create') === '1'}
      // HR may edit anyone. Everyone else may edit only their own row.
      canEdit={(row) => isHr || (user.role === 'employee' && row.userId?._id === user._id)}
      updatePath={(row) => (isHr ? `/profiles/${row.userId._id}` : '/profiles/me')}
      formValues={(row) =>
        isHr
          ? {
              ...row,
              dateOfBirth: row.dateOfBirth?.slice(0, 10),
              hireDate: row.hireDate?.slice(0, 10),
            }
          : {
              phoneNumber: row.personalInfo?.phoneNumber,
              address: row.personalInfo?.address,
              emergencyContact: row.emergencyContact,
            }
      }
    />
  );
}

export default EmployeeData;
