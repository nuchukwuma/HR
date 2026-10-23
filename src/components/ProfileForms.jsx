// src/components/ProfileForms.jsx
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../schemas/profileSchema';
import { api } from '../utils/api';
import { Alert, Avatar, Button, Card } from './ui';
import { inputClass, labelClass } from '../utils/styles';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2MB, must match the backend's limit
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Reads a chosen file into a data URL string (e.g. "data:image/png;base64,...."),
// which is the simplest way to send a small image to our server: no extra
// packages, no file storage folder, just one more string field on the profile.
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

function ProfileForm({ userId }) {
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema) });

  // Load the existing profile into the form
  useEffect(() => {
    api(`/profiles/${userId}`)
      .then(({ profile }) => {
        reset({
          ...profile,
          dateOfBirth: profile.dateOfBirth?.slice(0, 10), // date inputs need yyyy-mm-dd
          hireDate: profile.hireDate?.slice(0, 10),
        });
        setPhotoUrl(profile.profilePhoto || null);
      })
      .catch(() => setServerError('Could not load profile'));
  }, [userId, reset]);

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again later
    if (!file) return;

    setPhotoError('');
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That image is too large (max 2MB).');
      return;
    }

    setPhotoUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { profile } = await api(`/profiles/${userId}/photo`, { method: 'POST', body: { photo: dataUrl } });
      setPhotoUrl(profile.profilePhoto);
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError('');
    setSaved(false);
    try {
      await api(`/profiles/${userId}`, { method: 'PUT', body: data });
      setSaved(true);
    } catch (err) {
      setServerError(err.message);
    }
  };

  const displayName = `${getValues('personalInfo.firstName') || ''} ${getValues('personalInfo.lastName') || ''}`.trim();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && <Alert>{serverError}</Alert>}
      {saved && <Alert type="success">Saved</Alert>}

      <Card title="Photo">
        <div className="flex items-center gap-4">
          <Avatar src={photoUrl} name={displayName} size="lg" />
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={photoUploading}>
              {photoUploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="mt-1 text-xs text-blue-900/60">JPEG, PNG or WebP, up to 2MB.</p>
            {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoPick} />
          </div>
        </div>
      </Card>

      <Card title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-first" className={labelClass}>First name</label>
            <input id="pf-first" {...register('personalInfo.firstName')} className={inputClass} />
            {errors.personalInfo?.firstName && <p className="mt-1 text-xs text-red-600">{errors.personalInfo.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="pf-last" className={labelClass}>Last name</label>
            <input id="pf-last" {...register('personalInfo.lastName')} className={inputClass} />
            {errors.personalInfo?.lastName && <p className="mt-1 text-xs text-red-600">{errors.personalInfo.lastName.message}</p>}
          </div>
          <div>
            <label htmlFor="pf-phone" className={labelClass}>Phone</label>
            <input id="pf-phone" {...register('personalInfo.phoneNumber')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-dob" className={labelClass}>Date of birth</label>
            <input id="pf-dob" type="date" {...register('dateOfBirth')} className={inputClass} />
            {errors.dateOfBirth && <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-address" className={labelClass}>Address</label>
            <input id="pf-address" {...register('personalInfo.address')} className={inputClass} />
          </div>
        </div>
      </Card>

      <Card title="Employment">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-job" className={labelClass}>Job title</label>
            <input id="pf-job" {...register('jobTitle')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-type" className={labelClass}>Employment type</label>
            <select id="pf-type" {...register('employmentType')} className={inputClass}>
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>
          <div>
            <label htmlFor="pf-hire" className={labelClass}>Hire date</label>
            <input id="pf-hire" type="date" {...register('hireDate')} className={inputClass} />
            {errors.hireDate && <p className="mt-1 text-xs text-red-600">{errors.hireDate.message}</p>}
          </div>
        </div>
      </Card>

      <Card title="Emergency contact">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="pf-ec-name" className={labelClass}>Name</label>
            <input id="pf-ec-name" {...register('emergencyContact.name')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-ec-phone" className={labelClass}>Phone</label>
            <input id="pf-ec-phone" {...register('emergencyContact.phone')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-ec-rel" className={labelClass}>Relationship</label>
            <input id="pf-ec-rel" {...register('emergencyContact.relationship')} className={inputClass} />
          </div>
        </div>
      </Card>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}

export default ProfileForm;
