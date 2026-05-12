const UNSAFE_TAG_RE  = /<script[\s\S]*?<\/script>/gi
const UNSAFE_ATTR_RE = /\s(on\w+|href\s*=\s*['"]javascript:)[^'"]*['"]/gi

function sanitize(svg) {
  return svg.replace(UNSAFE_TAG_RE, '').replace(UNSAFE_ATTR_RE, '')
}

function isSvgString(str) {
  if (!str) return false
  const trimmed = str.trim()
  return trimmed.startsWith('<')
}

export function SvgIcon({ icon, size = 16, className = '' }) {
  if (!icon || !isSvgString(icon)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    )
  }

  const clean = sanitize(icon.trim())

  if (clean.startsWith('<svg')) {
    const patched = clean
      .replace(/^<svg/, `<svg width="${size}" height="${size}"`)
      .replace(/\s(width|height)="[^"]*"/g, '')
      .replace(/^<svg/, `<svg width="${size}" height="${size}"`)

    return (
      <span
        className={`inline-flex shrink-0 ${className}`}
        dangerouslySetInnerHTML={{ __html: patched }}
        aria-hidden="true"
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
