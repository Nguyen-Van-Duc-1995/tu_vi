# Lập lá số Tử Vi Đẩu Số Nam phái (Next.js + React + TypeScript)

Một ứng dụng Next.js App Router, giao diện 12 địa chi **bất biến** đúng sơ đồ tham khảo. Bộ máy an sao thuần TypeScript, không gọi API và không sử dụng trạng thái React trong tính toán.

## Chạy thử

Yêu cầu: Node.js 20.9+ (ưu tiên Node 22), npm.

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Để chạy kiểm thử:

```bash
npm run test:core
```

Build production: `npm run build` sau khi cài các dependencies.

## Cấu trúc

```text
src/
  app/
    page.tsx          Form sinh, 12 ô, thiên bàn, tab điều khiển, tô tam phương
    globals.css       Giao diện + màu 5 hành theo địa chi
    layout.tsx        Khung trang
  lib/
    lunar.ts          Đổi âm-dương lịch VN, tháng nhuận, UTC+7 / UTC+8
    tuvi.ts           An sao Nam phái: pure TypeScript

tests/run.cjs         Tests lõi + đối chiếu 16 sao lưu năm 2026 trong ảnh
```

## Bản đồ địa bàn bất biến

```text
+----------+----------+----------+----------+
|    Tỵ    |   Ngọ    |   Mùi    |   Thân   |
+----------+----------+----------+----------+
|   Thìn   |                    |    Dậu   |
+----------+                    +----------+
|   Mão    |       Thiên bàn     |   Tuất   |
+----------+----------+----------+----------+
|   Dần    |   Sửu    |    Tý    |   Hợi    |
+----------+----------+----------+----------+
```

`BOARD_POSITIONS` không được sắp xếp lại theo cung Mệnh. Chỉ gán cung chức, sao, Tuần/Triệt và hạn cho `palaces[branchIndex]`. 12 chi lưu nội bộ theo thứ tự thuận Tý(0), Sửu(1), ..., Hợi(11); vị trí UI `BOARD_POSITIONS` cố định.

## Những phần đã triển khai

- Đổi ngày dương và âm lịch Việt Nam theo múi giờ chọn, kiểm tra tháng nhuận và tính hợp lệ của ngày.
- Quy ước giờ Tý muộn: 23:00–23:59 dùng ngày âm tiếp theo; 00:00–00:59 giữ nguyên ngày. Lưu ý: ngày quy đổi trong thiên bàn là **ngày dùng để an số** khi sinh lúc 23h.
- Quy ước tháng nhuận của bản này: ngày 1–15 dùng tháng chính, ngày 16–30 dùng tháng kế tiếp để an cung/phụ tinh theo tháng. Đây là một lựa chọn theo trường phái, có dị bản.
- An cung Mệnh, cung Thân, 12 cung chức và thiên can 12 cung theo Ngũ Hổ Độn.
- Tính ngũ hành Cục từ **nạp âm Can Chi cung Mệnh**, không phải từ ngũ hành năm sinh.
- An 14 chính tinh theo ngày âm, số Cục, quy tắc ngày mượn lẻ/lùi — chẵn/tiến và đối xứng Thiên Phủ.
- An các sao theo can, chi, tháng, ngày và giờ: Lộc Tồn, Kình Dương, Đà La, Thiên Khôi, Thiên Việt, Tả Phụ, Hữu Bật, Văn Xương, Văn Khúc, Địa Không, Địa Kiếp, Đào Hoa, Hồng Loan, Thiên Hỷ, Thiên Mã, Kiếp Sát, Long Trì, Phượng Các, Thiên Khốc, Thiên Hư, Thiên Đức, Nguyệt Đức, Hỏa Tinh, Linh Tinh, Tam Thai, Bát Tọa, Ân Quang, Thiên Quý.
- Vòng Thái Tuế, vòng Tràng Sinh; Tuần, Triệt; Đại hạn 10 năm và Tiểu hạn theo tuổi mụ.
- Bảng Tứ Hóa năm sinh và Lưu Tứ Hóa năm xem; sao lưu L. Lộc Tồn, L. Kình Dương, L. Đà La, L. Thái Tuế, L. Tang Môn, L. Bạch Hổ, L. Văn Xương, L. Văn Khúc, L. Thiên Khôi, L. Thiên Việt, L. Thiên Mã, L. Đào Hoa, L. Hồng Loan, L. Kiếp Sát, L. Thiên Khốc, L. Thiên Hư.
- Bấm vào từng ô để tô **2 cung tam hợp** và **1 cung xung chiếu**; lọc nhóm sao; nhận diện Đại hạn/Tiểu hạn năm xem.

## Quy ước / giới hạn cần biết

1. “Nam phái” trong sản phẩm này là lối Tam Hợp thông dụng, ưu tiên chính tinh/phụ tinh và tam phương tứ chính. **Không phải** bộ an số và luận giải hoàn chỉnh của mọi nhánh Nam phái.
2. Bảng Tứ Hóa trong `TU_HOA` sử dụng bảng phổ thông Toàn Thư: Canh Thái Âm Khoa / Thiên Đồng Kỵ, Nhâm Tả Phụ Khoa. Các dị bản như Nhâm Thiên Phủ Khoa có thể thay bằng cấu hình.
3. Chưa an toàn bộ hệ hàng trăm sao; chưa cung cấp bảng Miếu/Vượng/Đắc/Hãm theo từng sách; chưa luận đoán định tính; không có suy luận dự đoán bằng AI.
4. Phép tính âm lịch lấy thuật toán thiên văn thông dụng; kiểm tra chéo dữ liệu ngày sinh và lịch lịch sử đặc biệt trước khi sử dụng nghiêm túc, nhất là trước 1968. Người sinh ngoài Việt Nam cần xem xét giờ địa phương và múi giờ lịch sử chính xác, không chỉ chọn UTC+7/8.
5. Tuổi mụ được tính đơn giản `năm xem - năm âm sinh + 1`. Năm xem là **năm âm lịch dự kiến cần xét** (chọn số năm), không tự chuyển theo ngày hiện tại.
6. Đây là ứng dụng thực hành một thuật số truyền thống, không có chứng cứ khoa học đáng tin cậy về khả năng dự báo vận mệnh.

## Kiểm thử mẫu từ ảnh

Đầu vào: **Nguyễn Hồng Phúc**, **nữ**, **12/06/1984** dương lịch, **07:01** (giờ Thìn), xem **2026**.

- Âm lịch: 14/05/1984, Giáp Tý, Hỏa lục cục; Mệnh Dần, Thân Tuất.
- Các sao lưu Bính Ngọ 2026 trong ảnh đối chiếu đúng cả 16 vị trí: L. Lộc Tồn Tỵ, L. Kình Dương Ngọ, L. Đà La Thìn, L. Văn Khúc Ngọ, L. Thái Tuế Ngọ, L. Văn Xương Thân, L. Thiên Mã Thân, L. Tang Môn Thân, L. Hồng Loan Dậu, L. Thiên Việt Dậu, L. Thiên Khôi Hợi, L. Kiếp Sát Hợi, L. Thiên Khốc/L. Thiên Hư Tý, L. Bạch Hổ Dần, L. Đào Hoa Mão.

## Tài liệu tham chiếu quy tắc

- Phương pháp an sao Tử Vi Nam phái/Tân Biên: https://www.tuvianmenh.vn/phuong-phap-an-sao
- An cung Mệnh/Thân: https://tuvidausotoanthu.vn/toan-thu/hoc/an-12-cung
- An Tử Vi từ Cục và ngày: https://tuvidausotoanthu.vn/toan-thu/hoc/xac-dinh-tu-vi
- Bảng Tứ Hóa: https://tuvidausotoanthu.vn/toan-thu/hoc/bang-tu-hoa
- Cách an phụ tinh: https://tuvi.xemtuong.net/tuvidauso/index.php?id=2
- Thuật toán âm lịch Ho Ngoc Duc: https://lyso.vn/co-ban/thuat-toan-tinh-am-lich-ho-ngoc-duc-t2093/
- Lưu Văn Xương: https://phantichtuvi.com/tu-vi/sao-luu/van-xuong
- Lưu Văn Khúc: https://phantichtuvi.com/tu-vi/sao-luu/van-khuc
- Cách an Tuần/Triệt: https://amlichvietnam.vn/kien-thuc/tu-vi/cach-an-tuan-triet

**Tham khảo văn hóa/giáo dục, không sử dụng làm cơ sở khoa học hay quyết định quan trọng.**
