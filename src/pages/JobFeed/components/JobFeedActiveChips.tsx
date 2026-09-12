import type { ActiveFilterChip } from '../JobFeedModel'
import { CloseIcon } from '../../../components/icons/Icons'

interface JobFeedActiveChipsProps {
  chips: ActiveFilterChip[]
  onRemove: (type: string) => void
  onClearAll: () => void
}

export function JobFeedActiveChips({
  chips,
  onRemove,
  onClearAll,
}: JobFeedActiveChipsProps) {
  if (chips.length === 0) return null

  return (
    <div
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-2 pt-2"
    >
      <span className="text-xs font-semibold text-muted-foreground mr-1">
        Active filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-2xs transition-colors hover:bg-primary/15"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.type)}
            aria-label={`Remove filter: ${chip.label}`}
            className="rounded-full p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-muted-foreground hover:text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
      >
        Clear all
      </button>
    </div>
  )
}
