import { useRef, useState } from 'react'
import { ImageIcon, FileTextIcon, FileSpreadsheetIcon, UploadCloudIcon, XCircleIcon } from 'lucide-react'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const DOC_TYPES = {
  'application/pdf': { icon: FileTextIcon, label: 'PDF' },
  'application/msword': { icon: FileTextIcon, label: 'Word' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileTextIcon, label: 'Word' },
  'application/vnd.ms-excel': { icon: FileSpreadsheetIcon, label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheetIcon, label: 'Excel' },
  'text/plain': { icon: FileTextIcon, label: 'Text' },
}

/**
 * FileInput — reusable file picker matching the existing Input design system.
 *
 * Props:
 *   label        string    — field label
 *   error        string    — validation error message
 *   hint         string    — helper text below the field
 *   horizontal   bool      — horizontal layout (label left, input right) like Input.jsx
 *   accept       string    — MIME types or extensions, e.g. "image/*" or ".pdf,.doc,.docx"
 *   maxKb        number    — max file size in KB (default 5120 = 5 MB)
 *   currentUrl   string    — URL of the existing file (shows preview before user picks new one)
 *   onChange     function  — called with (File | null) when user picks or clears a file
 *   onClear      function  — called when user clicks the X to remove a file
 *
 * Usage examples:
 *   // Image upload
 *   <FileInput label="Avatar" accept="image/*" maxKb={2048} currentUrl={user.avatar_url}
 *     onChange={(file) => setValue('avatar', file)} error={errors.avatar?.message} horizontal />
 *
 *   // Document upload
 *   <FileInput label="Dokumen" accept=".pdf,.doc,.docx" maxKb={10240}
 *     onChange={(file) => setValue('document', file)} error={errors.document?.message} />
 *
 *   // Mixed (image OR document)
 *   <FileInput label="Lampiran" accept="image/*,.pdf" onChange={...} />
 */
export function FileInput({
  label,
  error,
  hint,
  horizontal = false,
  accept = 'image/*',
  maxKb = 5120,
  currentUrl = null,
  onChange,
  onClear,
  className = '',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)   // display name of picked file
  const [fileMime, setFileMime] = useState(null)   // actual MIME type of picked file
  const [clientError, setClientError] = useState(null)

  const displayError = error || clientError
  const hasFile = preview || currentUrl || fileName

  const isImage = fileMime ? IMAGE_TYPES.includes(fileMime)  : (currentUrl ? accept.includes('image') : false)
  const docMeta = fileMime ? DOC_TYPES[fileMime] ?? null : null
  const DocIcon = docMeta?.icon ?? UploadCloudIcon

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxKb * 1024) {
      const label = maxKb >= 1024 ? `${maxKb / 1024} MB` : `${maxKb} KB`
      setClientError(`Ukuran file tidak boleh lebih dari ${label}.`)
      e.target.value = ''
      return
    }

    setClientError(null)
    setFileName(file.name)
    setFileMime(file.type)

    if (IMAGE_TYPES.includes(file.type)) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onChange?.(file)
  }

  function handleClear(e) {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    setFileMime(null)
    setClientError(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange?.(null)
    onClear?.()
  }

  const displayUrl = preview || currentUrl

  const inner = (
    <div className="flex-1 min-w-0">
      {/* Drop zone / trigger */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-md border cursor-pointer
          transition-colors select-none
          ${displayError ? 'border-red-400 bg-red-50' : 'border-[#dde2ee] hover:border-navy-3 bg-white'}
          ${className}`}
      >
        {/* Preview / icon */}
        {isImage && displayUrl ? (
          <img src={displayUrl} alt="preview" className="w-8 h-8 rounded object-cover shrink-0 border border-[#dde2ee]" />
        ) : docMeta ? (
          <div className="w-8 h-8 rounded bg-[#f0f2fa] flex items-center justify-center shrink-0">
            <DocIcon size={14} className="text-[#5a6380]" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded bg-[#f0f2fa] flex items-center justify-center shrink-0">
            {accept.includes('image') ? (
              <ImageIcon size={14} className="text-[#9aa0b8]" />
            ) : (
              <UploadCloudIcon size={14} className="text-[#9aa0b8]" />
            )}
          </div>
        )}

        {/* Label text */}
        <span className={`text-[12px] flex-1 truncate ${hasFile ? 'text-[#1a1f2e]' : 'text-[#9aa0b8]'}`}>
          {fileName || (currentUrl ? 'File tersimpan — klik untuk mengganti' : 'Klik untuk memilih file')}
        </span>

        {/* Clear button */}
        {hasFile && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[#9aa0b8] hover:text-red-400 transition-colors shrink-0"
            title="Hapus file"
          >
            <XCircleIcon size={14} />
          </button>
        )}

        {/* Hidden input */}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="sr-only" />
      </div>

      {displayError && <span className="text-[10px] text-red-500 mt-0.5 block">{displayError}</span>}
      {hint && !displayError && <span className="text-[10px] text-[#9aa0b8] mt-0.5 block">{hint}</span>}
    </div>
  )

  if (horizontal) {
    return (
      <div className="flex items-start gap-3">
        {label && (
          <label className="w-28 shrink-0 text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide text-right pt-2 leading-tight">
            {label}
          </label>
        )}
        {inner}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] font-semibold text-[#5a6380] uppercase tracking-wide">
          {label}
        </label>
      )}
      {inner}
    </div>
  )
}
