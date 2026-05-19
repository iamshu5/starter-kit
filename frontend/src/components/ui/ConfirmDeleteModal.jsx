import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function ConfirmDeleteModal({ open, title = 'Delete', onClose, onConfirm, isLoading, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={isLoading} onClick={onConfirm}>Delete</Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
