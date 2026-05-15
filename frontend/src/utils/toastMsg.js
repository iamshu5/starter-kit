export function toastMsg(e) {
  if (e?.code === 'ECONNABORTED' || e?.code === 'ERR_CANCELED') {
    return 'Permintaan terlalu lama. Periksa koneksi Anda dan coba lagi.'
  }

  if (!e?.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
  }

  const status = e.response.status

  if (status === 422) {
    const errors = e.response?.data?.errors
    if (errors) return Object.values(errors).flat().join(' \u2022 ')
  }

  if (status >= 500 && import.meta.env.PROD) return 'Terjadi kesalahan pada server. Silakan coba lagi.'

  return e.response?.data?.message || e.message || 'Terjadi kesalahan.'
}
