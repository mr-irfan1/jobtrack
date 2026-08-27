import { CheckIcon } from '../icons/Icons'

interface AuthStepItemProps {
  /** 1-based position, shown in the number circle when the step isn't active. */
  index: number
  label: string
  /** The step representing the current page; gets the inverted white treatment. */
  active?: boolean
}

/**
 * A single row in the hero's "job search journey" list. Purely presentational.
 * Active steps invert to a solid white chip (black text, checkmark badge) to
 * mark where the visitor is in the flow; inactive steps are quiet translucent
 * chips over the video. Sits on top of the hero video with no overlay layer, so
 * each chip carries its own background for legibility.
 */
function AuthStepItem({ index, label, active = false }: AuthStepItemProps) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        active
          ? 'border-white bg-white text-black'
          : 'border-white/[0.12] bg-black/45 text-white/65'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
          active ? 'bg-black text-white' : 'bg-white/10 text-white/70'
        }`}
      >
        {active ? <CheckIcon className="h-4 w-4" /> : index}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </li>
  )
}

export default AuthStepItem
