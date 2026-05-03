export function SectionTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 border-b border-emerald-900/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-display text-2xl text-emerald-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-emerald-900/70">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Surface({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-emerald-900/10 bg-white/85 p-5 shadow-[0_12px_30px_-18px_rgba(20,83,45,0.55)] backdrop-blur ${className}`}>
      {children}
    </section>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-emerald-700/25 bg-emerald-50/50 p-6 text-center">
      <h3 className="font-display text-lg text-emerald-900">{title}</h3>
      <p className="mt-2 text-sm text-emerald-900/70">{description}</p>
    </div>
  )
}

export function StatTile({ label, value, accent = 'emerald' }) {
  const accentClass = {
    emerald: 'from-emerald-500 to-lime-500',
    amber: 'from-amber-500 to-orange-500',
    sky: 'from-sky-500 to-cyan-500',
  }[accent]

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-emerald-900/60">{label}</p>
      <p className={`mt-3 bg-gradient-to-r ${accentClass} bg-clip-text font-display text-3xl text-transparent`}>{value}</p>
    </div>
  )
}

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  const style =
    variant === 'secondary'
      ? 'border border-emerald-900/20 bg-white text-emerald-900 hover:bg-emerald-50'
      : variant === 'danger'
        ? 'bg-rose-600 text-white hover:bg-rose-700'
        : 'bg-emerald-700 text-white hover:bg-emerald-800'

  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${style} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
