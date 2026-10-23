import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { inputClass, labelClass, tableClass, thClass, tdClass } from '../utils/styles';
import { Alert, Button, Card, EmptyState, PageHeader } from './ui';

const getValue = (object, path) =>
  path.split('.').reduce((value, key) => value?.[key], object) ?? '';

const setValue = (object, path, value) => {
  const keys = path.split('.');
  const result = { ...object };
  let current = result;
  let source = object;

  keys.slice(0, -1).forEach((key) => {
    current[key] = { ...(source?.[key] || {}) };
    current = current[key];
    source = source?.[key];
  });
  current[keys[keys.length - 1]] = value;
  return result;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Could not read that file'));
  reader.readAsDataURL(file);
});

function ResourceForm({ fields, initialValues, onSubmit, onCancel, submitLabel, optionsByPath }) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.filter((field) => !field.visibleWhen || field.visibleWhen(values)).map((field) => (
          <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
            <label htmlFor={`resource-${field.name}`} className={labelClass}>{field.label}</label>
            {field.type === 'file' ? (
              <input
                id={`resource-${field.name}`}
                type="file"
                accept={field.accept}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  try {
                    const dataUrl = await readFileAsDataUrl(file);
                    setValues((current) => setValue(current, field.name, dataUrl));
                    setError('');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
                className={inputClass}
              />
            ) : field.type === 'select' ? (
              <select
                id={`resource-${field.name}`}
                required={field.required}
                value={getValue(values, field.name)}
                onChange={(event) => setValues((current) => {
                  let next = setValue(current, field.name, event.target.value);
                  const resetFields = field.resetFieldsOnValue?.[event.target.value] || [];
                  resetFields.forEach((path) => {
                    next = setValue(next, path, '');
                  });
                  return next;
                })}
                className={inputClass}
              >
                <option value="">Select...</option>
                {(field.options || optionsByPath[field.optionsFrom?.path] || []).map((option) => (
                  <option key={option.value ?? option._id} value={option.value ?? option._id}>
                    {option.label ?? option[field.optionsFrom?.label]}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`resource-${field.name}`}
                type={field.type || 'text'}
                required={field.required}
                value={getValue(values, field.name)}
                onChange={(event) =>
                  setValues((current) => setValue(current, field.name, event.target.value))
                }
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function ResourcePage({
  title,
  subtitle,
  noun,
  listPath,
  columns,
  fields,
  createFields,
  addLabel,
  canCreate,
  openCreateOnLoad = false,
  canEdit,
  updatePath,
  formValues,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(openCreateOnLoad);
  const [editing, setEditing] = useState(null);
  const [optionsByPath, setOptionsByPath] = useState({});

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(listPath);
      setRows(data.items);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listPath]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api(listPath);
        if (active) {
          setRows(data.items);
          setError('');
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [listPath]);

  useEffect(() => {
    if (!canCreate) return;
    const optionFields = createFields.filter((field) => field.optionsFrom);
    Promise.all(
      optionFields.map(async (field) => {
        const data = await api(field.optionsFrom.path);
        const key = field.optionsFrom.listKey ||
          Object.keys(data).find((property) => Array.isArray(data[property]));
        if (!key || !Array.isArray(data[key])) {
          throw new Error(`No options returned for ${field.label}`);
        }
        return [field.optionsFrom.path, data[key]];
      })
    )
      .then((entries) => setOptionsByPath(Object.fromEntries(entries)))
      .catch((err) => setError(err.message));
  }, [canCreate, createFields]);

  const createRow = async (values) => {
    await api(listPath, { method: 'POST', body: values });
    setShowCreate(false);
    await loadRows();
  };

  const updateRow = async (values) => {
    await api(updatePath(editing), { method: 'PUT', body: values });
    setEditing(null);
    await loadRows();
  };

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        {canCreate && (
          <Button onClick={() => setShowCreate((visible) => !visible)}>
            {showCreate ? 'Close' : addLabel}
          </Button>
        )}
      </PageHeader>
      {error && <Alert>{error}</Alert>}

      {showCreate && (
        <Card title={`Add ${noun}`}>
          <ResourceForm
            key="new-resource"
            fields={createFields}
            initialValues={{}}
            optionsByPath={optionsByPath}
            onSubmit={createRow}
            onCancel={() => setShowCreate(false)}
            submitLabel={`Create ${noun}`}
          />
        </Card>
      )}

      <Card>
        {loading ? (
          <EmptyState>Loading {noun}s...</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No {noun}s found.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.key} className={thClass}>{column.label}</th>)}
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {rows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((column) => (
                      <td key={column.key} className={tdClass}>
                        {column.render ? column.render(row) : column.value ? column.value(row) : row[column.key]}
                      </td>
                    ))}
                    <td className={tdClass}>
                      {canEdit(row) && (
                        <Button size="sm" variant="secondary" onClick={() => setEditing(row)}>Edit</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <Card title={`Edit ${noun}`}>
          <ResourceForm
            key={editing._id}
            fields={fields}
            initialValues={formValues(editing)}
            optionsByPath={{}}
            onSubmit={updateRow}
            onCancel={() => setEditing(null)}
            submitLabel="Save changes"
          />
        </Card>
      )}
    </div>
  );
}

export default ResourcePage;
