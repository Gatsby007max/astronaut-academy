import { tr } from '../../i18n/tr'
import type { Source } from '../../content/types'
import { Label } from '../../ui/kit'

const KIND: Record<Source['kind'], string> = {
  web: 'WEB',
  pdf: 'PDF',
  ntrs: 'NTRS',
  podcast: 'PODCAST',
  blog: 'BLOG',
  dataset: 'DATA',
}

export function SourceList({ sources, className = '' }: { sources: Source[]; className?: string }) {
  if (!sources.length) return null
  return (
    <div className={className}>
      <Label className="mb-1.5">{tr("出典 SOURCES")}</Label>
      <ul className="space-y-1">
        {sources.map((s) => (
          <li key={s.id} className="flex gap-2 text-xs leading-5">
            <span className="mt-0.5 shrink-0 rounded bg-white/10 px-1 font-mono text-[9px] text-white/60">{KIND[s.kind]}</span>
            <a href={s.url} target="_blank" rel="noreferrer" className="pointer-events-auto text-hud/90 underline-offset-2 hover:underline">
              {s.title}
              <span className="text-white/40">
                {' '}
                — {s.publisher}
                {s.year ? `, ${s.year}` : ''}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
