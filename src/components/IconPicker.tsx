import { CATEGORY_ICONS } from '../lib/category.constants'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1 p-2 bg-slate-800/80 rounded-xl border border-slate-700">
      {CATEGORY_ICONS.map(icon => (
        <button
          key={icon.name}
          type="button"
          onClick={() => onChange(icon.name)}
          aria-label={icon.name}
          className={`p-2 rounded-lg transition-colors ${
            value === icon.name
              ? 'bg-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          <icon.component size={18} />
        </button>
      ))}
    </div>
  )
}
