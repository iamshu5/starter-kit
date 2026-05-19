import { toast } from 'sonner'
import { toastMsg } from '@/utils/toastMsg'

export async function tryCatch(fn, onError) {
  try {
    return await fn()
  } catch (err) {
    if (onError) {
      onError(err)
    } else {
      toast.error(toastMsg(err))
    }
    return null
  }
}
