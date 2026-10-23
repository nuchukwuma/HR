export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export const fullName = (personalInfo) =>
  [personalInfo?.firstName, personalInfo?.lastName].filter(Boolean).join(' ');
