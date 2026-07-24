# Sổ lớp học — React + Firebase

Thay thế bảng Google Sheets: điểm danh theo buổi, tự tính học phí, quản lý lịch dạy tuần.

## Tính năng

| Trong ảnh Sheets | Trong app |
|---|---|
| Các tab DS 12 / DS 11 / DS 10 | Tab lớp, thêm/sửa/xoá lớp, mỗi lớp có học phí riêng |
| Danh sách học sinh | Thêm học sinh, sửa tên tại chỗ, xoá học sinh |
| Ô tick Tháng 7 / Tháng 8 | Cột "Đã thu" theo từng tháng |
| Số buổi học / nghỉ / thành tiền | Tự tính từ lưới điểm danh |
| Sheet "Lịch dạy" | Lưới Sáng/Chiều/Tối × 7 ngày, gán lớp cho từng ô |
| — | Ghi lý do nghỉ cho từng buổi |
| — | Xuất Excel (2 sheet) và in phiếu báo học phí / lưu PDF |
| — | Mã QR VietQR trên phiếu, đúng số tiền và nội dung từng em |
| — | Tin nhắn gửi phụ huynh soạn sẵn theo mẫu tự đặt |

Số buổi trong tháng **sinh tự động từ lịch dạy**. Bấm ngày trên đầu cột để bỏ một buổi (nghỉ lễ), hoặc "Thêm buổi dạy bù" để chèn buổi ngoài lịch.

## Ghi lý do nghỉ

Bấm ô → đánh dấu nghỉ (ô đỏ ✕). Bấm lần nữa vào ô đỏ → hộp thoại chọn lý do có sẵn
(Ốm, Việc gia đình, Nghỉ lễ, Trùng lịch học, Không báo trước) hoặc tự nhập.
Ô đã có lý do được gạch chân; rê chuột lên ô sẽ thấy lý do.

## Xuất file gửi phụ huynh

- **Xuất Excel** — file `.xlsx` gồm sheet *Điểm danh* (lưới x/N, số buổi, tiền học, cột lý do nghỉ)
  và sheet *Lý do nghỉ* (nhật ký từng buổi vắng).
- **In phiếu báo / PDF** — mở cửa sổ in khổ A4: trang tổng kết cả lớp, rồi mỗi học sinh một phiếu
  báo học phí riêng (số buổi, danh sách buổi nghỉ kèm lý do, thành tiền, tình trạng thanh toán).
  Trong hộp thoại in chọn **Lưu thành PDF** để gửi cho phụ huynh.
  Nút ⎙ ở cuối mỗi dòng in phiếu của riêng học sinh đó.

> Nếu không thấy cửa sổ in hiện ra, hãy cho phép pop-up cho trang này.

## Chuyển khoản bằng mã QR

Vào tab **Cài đặt**, chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản. Từ đó mỗi phiếu báo
in ra sẽ có mã QR VietQR điền sẵn số tiền của riêng em đó và nội dung dạng `Van Khanh HP T7/26`.
Học sinh đã tick "Đã thu" thì phiếu không in QR nữa.

Danh sách ngân hàng lấy trực tiếp từ `api.vietqr.io/v2/banks` để mã BIN luôn đúng; nếu không có
mạng, app dùng danh sách 10 ngân hàng lớn có sẵn trong `src/vietqr.js`.

## Tin nhắn gửi phụ huynh

Nút ✉ ở cuối mỗi dòng mở hộp soạn tin đã điền sẵn số liệu của em đó, sửa được trước khi gửi:

> Chào anh/chị, tháng 7/2026 em Phong (Lớp 12) đi học 4/5 buổi, nghỉ 1 buổi (12/7 - ốm).
> Học phí tháng này: 600.000 ₫. Chuyển khoản: … Cảm ơn anh/chị ạ.

Bấm **Sao chép tin nhắn** rồi dán vào Zalo, hoặc **Chia sẻ qua Zalo…** trên điện thoại để chọn thẳng
ứng dụng. Nút **Copy tin nhắn cả lớp** gom tin của tất cả học sinh chưa thanh toán vào clipboard.

Mẫu tin sửa được trong tab Cài đặt, dùng các thẻ `{ten}` `{lop}` `{thang}` `{sobuoi}` `{dihoc}`
`{nghi}` `{chitietnghi}` `{hocphi}` `{chuyenkhoan}`.

## Chạy

```bash
npm install
cp .env.example .env   # điền config Firebase
npm run dev
```

## Cấu hình Firebase

1. Tạo project tại https://console.firebase.google.com
2. **Authentication → Sign-in method → Google**: bật.
3. **Firestore Database**: tạo database (production mode).
4. **Project settings → Your apps → Web app**: copy config vào `.env`.
5. Dán nội dung `firestore.rules` vào tab Rules của Firestore rồi Publish.

## Cấu trúc dữ liệu

```
users/{uid}/classes/{classId}                  { name, fee, order }
users/{uid}/classes/{classId}/students/{sid}   { name, order }
users/{uid}/sheets/{classId}__{YYYY-MM}        { absences: {sid: [sessionId]},
                                                 reasons:  {sid: {sessionId: "Ốm"}},
                                                 paid: {sid: bool},
                                                 extraSessions: [], removedSessions: [] }
users/{uid}/settings/schedule                  { slots: { "toi_0": classId, ... } }
users/{uid}/settings/payment                   { bankBin, bankName, accountNo,
                                                 accountName, msgTemplate }
```

Khoá lịch dạy có dạng `{buổi}_{thứ}` với buổi ∈ `sang|chieu|toi` và thứ 0 = Thứ Hai … 6 = Chủ Nhật.

## Deploy

```bash
npm run build
npx firebase-tools deploy --only hosting
```
(`firebase init hosting` với thư mục public là `dist`, chế độ SPA.)
