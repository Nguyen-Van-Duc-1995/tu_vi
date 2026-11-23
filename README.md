# Giao diện Tử Vi Nam phái — địa chi màu đặc, khung vuông

Bản này cập nhật đầy đủ `src/app/page.tsx` và `src/app/globals.css` trên nền phiên bản Typography; **không sửa thuật toán** trong `src/lib/tuvi.ts` và `src/lib/lunar.ts`.

# Lập lá số Tử Vi Đẩu Số Nam phái (Next.js + React + TypeScript)

## Bản cập nhật giao diện: phân cấp cỡ chữ theo ảnh tham khảo

Phiên bản này tiếp tục bản Modern UI. **Không thay đổi `src/lib/tuvi.ts` hoặc `src/lib/lunar.ts`**, không đổi địa bàn 12 chi hay thuật toán an sao.

- **Chính tinh**: in hoa, đậm, căn giữa phía đầu cung; phụ tinh: hai cột, nhỏ hơn để đọc và quét nhanh.
- **Sao lưu**: nền xanh nhạt, đặt thành nhóm riêng; **Đại hạn**: nhãn gọn sát đáy cung.
- **Thiên bàn**: tên lớn nhất, nhãn thông tin nhỏ hơn giá trị; Mệnh/Thân/Cục được làm nổi rõ.
- Thêm bộ điều khiển `Cỡ chữ → Nhỏ / Vừa / Lớn` nằm ở dải tùy chỉnh hiển thị.
- Kích thước mặc định **Vừa**: chính tinh 17px, phụ tinh 12px, sao lưu 11px, địa chi 15px, Đại hạn 10px, tên ở thiên bàn 30px. Nhỏ: 15/10.5/10px; Lớn: 19/13.5/12px.
- Địa bàn 4×4 giữ nguyên khi xem điện thoại, kéo ngang để đọc; chiều rộng cung tự tăng khi chọn chữ Lớn.
- Kiểm tra giao diện tĩnh tại 390 / 1024 / 1440px, đồng thời kiểm tra không có cung nào bị cắt nội dung ở cả ba mức chữ.

Thay nhanh trong ứng dụng Modern UI có sẵn: `src/app/page.tsx` và `src/app/globals.css`.

---


Một ứng dụng Next.js App Router, giao diện 12 địa chi **bất biến** đúng sơ đồ tham khảo. Bộ máy an sao thuần TypeScript, không gọi API và không sử dụng trạng thái React trong tính toán.

## Giao diện mới – phiên bản modern

Dự án đã được nâng cấp **toàn bộ giao diện React/CSS**, không sửa thuật toán âm lịch hoặc an sao ở `src/lib/`.

- Thiết kế **vuông góc hoàn toàn** (border-radius: 0), không bóng đổ hay gradient; màu ngũ hành **đặc** và đường phân cách **đen dày** theo hình mẫu người dùng.
- Màu cố định theo địa chi: **Tỵ/Ngọ đỏ #da3c3d; Thìn/Mùi/Tuất/Sửu vàng #f3d34c; Dần/Mão xanh lá #6ed36d; Thân/Dậu xám #bfbfbf; Tý/Hợi xanh dương #65c9ee**. Chú ý **Tỵ khác Tý**.
- Địa chi to và đậm; Thiên can nhỏ phía trên; chính tinh nổi bật; phụ tinh hai cột; sao lưu và đại hạn nhỏ hơn.
- Form nhập liệu chia lưới, tự xuống hàng trên tablet/điện thoại; có nút **Khôi phục mẫu**.
- Khu Thiên bàn trung tâm hiển thị nhanh **Mệnh / Thân / Cục**, ngày sinh âm–dương, tuổi mụ, đại hạn, năm xem.
- Chọn cung để tô **cung đang chọn / hai cung tam hợp / cung xung chiếu** bằng đường viền (giữ nguyên màu hành).
- Bật/tắt chính tinh, phụ tinh, vòng sao, sao lưu bằng các chip dễ thao tác.
- Chọn cung bằng dropdown trên màn hình nhỏ, cuộn ngang địa bàn nhưng vẫn giữ **4×4** và thứ tự địa chi cố định.
- Nút **In lá số** với CSS in khổ A3 ngang; không cần thư viện UI hoặc icon bổ sung.
- Trình đọc màn hình / bàn phím: label biểu mẫu, focus ring, Enter/Space chọn cung, `prefers-reduced-motion`.

Muốn ghép vào dự án cũ đang có sẵn bộ an sao tương tự, chỉ cần thay:

```text
src/app/page.tsx
src/app/globals.css
```

Các phần còn lại giữ như bản gốc.

**Kiểm chứng trong môi trường dựng:** Kiểm thử `npm run test:core` đạt, kiểm tra cú pháp TSX đạt; dựng giao diện từ JSX/CSS để soát bố cục ở 1440px, 1024px và 390px. Do không kết nối được npm registry nên chưa chạy `npm run build` Next.js đầy đủ; hãy thực hiện `npm install && npm run build` trên máy có kết nối mạng.

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
