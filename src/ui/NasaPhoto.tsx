export function NasaPhoto({ query, className = '' }: { query?: string; className?: string }) {
  if (!query) return null
  // Search results may include third-party material. Link to the archive
  // instead of embedding an image before its rights are reviewed.
  const url = `https://images.nasa.gov/search?q=${encodeURIComponent(query)}`
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`pointer-events-auto inline-block text-xs text-hud hover:underline ${className}`}>
      NASA Image and Video Library ↗
    </a>
  )
}
