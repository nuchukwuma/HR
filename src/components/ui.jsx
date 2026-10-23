// Small building blocks used on every page, so all pages look like one app.
// Each one is just a normal React component that adds some Tailwind classes.

// The big title at the top of a page. Anything you put inside it (like a button) goes on the right.
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-blue-900/60">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// A white box with a thin border: the "card" every section sits in.
export function Card({ title, children, className = '' }) {
  return (
    <section className={`mb-6 rounded-xl border border-blue-100 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-base font-semibold text-blue-950">{title}</h2>}
      {children}
    </section>
  );
}

const buttonStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
  secondary: 'bg-white text-blue-900 hover:bg-blue-50 border border-blue-200',
  danger: 'bg-white text-red-600 hover:bg-red-50 border border-red-200',
};

// variant: primary | secondary | danger.   size: md | sm
export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      type={type}
      className={`rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

// A coloured message box: type is "error", "success" or "info"
export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-green-200 bg-green-50 text-green-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  };
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-lg border p-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}

// A small coloured label, like "Approved" or "Company". tone: gray | blue | green | red | amber
export function Badge({ tone = 'gray', children }) {
  const tones = {
    gray: 'bg-blue-50 text-blue-900 ring-1 ring-inset ring-blue-100',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
}

// "Nothing here yet" text
export function EmptyState({ children }) {
  return <p className="py-6 text-center text-sm text-blue-900/60">{children}</p>;
}

// A round profile photo. If there's no photo yet, it shows the person's initials instead.
// size: 'sm' | 'md' | 'lg'
export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };
  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  if (src) {
    return <img src={src} alt={name || 'Profile photo'} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <span
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white`}
      aria-hidden={name ? undefined : true}
    >
      {initials || '?'}
    </span>
  );
}
