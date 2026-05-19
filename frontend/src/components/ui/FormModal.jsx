import { Modal } from '@/components/ui/Modal'

export function FormModal({ modal, entityLabel, onClose, size = 'lg', children }) {
  if (!modal) return null

  return (
    <Modal
      open
      onClose={onClose}
      title={modal.mode === 'edit' ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
      size={size}
    >
      {children}
    </Modal>
  )
}
