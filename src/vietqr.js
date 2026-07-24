/** Bỏ dấu tiếng Việt — nội dung chuyển khoản chỉ nhận ký tự không dấu. */
export const noAccent = (s = '') =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/** Danh sách rút gọn, dùng khi không gọi được API VietQR. */
export const FALLBACK_BANKS = [
  { bin: '970436', shortName: 'Vietcombank', name: 'NH TMCP Ngoại Thương Việt Nam' },
  { bin: '970415', shortName: 'VietinBank', name: 'NH TMCP Công Thương Việt Nam' },
  { bin: '970418', shortName: 'BIDV', name: 'NH Đầu tư và Phát triển Việt Nam' },
  { bin: '970405', shortName: 'Agribank', name: 'NH NN&PTNT Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', name: 'NH TMCP Kỹ Thương Việt Nam' },
  { bin: '970422', shortName: 'MB Bank', name: 'NH TMCP Quân Đội' },
  { bin: '970416', shortName: 'ACB', name: 'NH TMCP Á Châu' },
  { bin: '970432', shortName: 'VPBank', name: 'NH TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', shortName: 'TPBank', name: 'NH TMCP Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', name: 'NH TMCP Sài Gòn Thương Tín' }
]

/**
 * Lấy danh sách ngân hàng từ VietQR (có BIN chuẩn), tự lùi về danh sách rút gọn nếu lỗi.
 * Kết quả được nhớ trong phiên làm việc.
 */
let cache = null
export async function loadBanks() {
  if (cache) return cache
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks')
    const json = await res.json()
    const list = (json.data || [])
      .filter((b) => b.bin)
      .map((b) => ({ bin: b.bin, shortName: b.shortName, name: b.name }))
    cache = list.length ? list : FALLBACK_BANKS
  } catch {
    cache = FALLBACK_BANKS
  }
  return cache
}

/** Nội dung chuyển khoản, ví dụ: "Khanh HP T7". */
export const transferNote = (studentName, month) => {
  const [y, m] = month.split('-')
  const first = noAccent(studentName).trim().split(/\s+/).slice(-2).join(' ')
  return `${first} HP T${Number(m)}/${y.slice(2)}`.slice(0, 50)
}

/**
 * Ảnh QR chuyển khoản đã điền sẵn số tiền và nội dung.
 * template: 'qr_only' | 'compact' | 'compact2' | 'print'
 */
export function vietQrUrl({ bankBin, accountNo, accountName }, amount, note, template = 'qr_only') {
  if (!bankBin || !accountNo) return null
  const q = new URLSearchParams()
  if (amount > 0) q.set('amount', String(Math.round(amount)))
  if (note) q.set('addInfo', noAccent(note))
  if (accountName) q.set('accountName', noAccent(accountName))
  return `https://img.vietqr.io/image/${bankBin}-${encodeURIComponent(accountNo)}-${template}.png?${q}`
}
