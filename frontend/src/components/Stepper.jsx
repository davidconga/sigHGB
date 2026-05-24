export default function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="flex-1 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${done ? 'bg-emerald-500 text-white'
                : active ? 'bg-hgb-600 text-white'
                : 'bg-slate-200 text-slate-500'}`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${active ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}
