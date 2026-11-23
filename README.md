# La so Tu Vi Nam phai - Next.js / React / TypeScript

## Ban cap nhat: tat ca sao xep doc tren dien thoai

Hai file da cap nhat:

- `src/app/page.tsx`: Chinh sua mo ta che do xem tren dien thoai, giu nguyen form va logic an sao.
- `src/app/globals.css`: Tren man hinh <= 900px, chinh tinh, phu tinh, vong sao (neu bat) va sao luu duoc hien thi **moi sao mot dong**, khong an bot sao o che do Toan canh.

**Toan canh** (mac dinh): 12 dia chi giu vi tri co dinh trong luoi 4x4, 4 cot vua chieu ngang dien thoai. Chieu cao tung hang tu gian theo so luong sao, nen can cuon doc thay vi cat chu.

**Xem chi tiet**: Cung rong hon, sao van xep mot cot doc, co the vuot ngang de doc.

Tat ca tinh nang cu van duoc giu: mau dia chi, khung vuong khong bo, 3 duong noi tam hop/xung chieu mac dinh tu cung Menh, bang chu thich duoi la so, bo loc, nhap ngay/nam co the xoa het va nhap lai.

Neu dang dung phien ban `tuvi-nam-phai-nextjs-mobile-fit`, chi can thay hai file `page.tsx` va `globals.css` tai `src/app/`. Thu muc `src/lib/` khong co thay doi.

## Su dung

Yeu cau: Node.js >= 20.9

```bash
npm install
npm run dev
npm run test:core
```

Mo `http://localhost:3000`.

## Mau dia chi co dinh

- Ty (Tỵ) / Ngo: Do `#da3c3d`
- Thin / Mui / Tuat / Suu: Vang `#f3d34c`
- Dan / Mao: Xanh la `#6ed36d`
- Than / Dau: Xam `#bfbfbf`
- Ty (Tý) / Hoi: Xanh duong `#65c9ee`

## Gioi han

Phan mem an 14 chinh tinh va mot so phu tinh theo bo quy tac hien co; chua phai bo an sao toan phan cua moi nhanh Nam phai. Noi dung tu vi chi de tham khao van hoa, khong phai phuong phap du doan khoa hoc.

Da kiem tra cu phap TSX, phan tich CSS va test bo tinh an sao. Chua xac nhan build production Next.js trong moi truong nay va chua kiem tra tren dien thoai that.
