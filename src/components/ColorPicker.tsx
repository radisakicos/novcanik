import { PRESET_COLORS } from '../lib/category.constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-800/80 rounded-xl border border-slate-700">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          className={`w-7 h-7 rounded-full transition-transform ${
            value === c
              ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white scale-110'
              : 'hover:scale-105'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}
