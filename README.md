# Quiz Master - Multiplayer Quiz Game

Ứng dụng quiz game đa người chơi với tính năng quét QR code và quản lý điểm số real-time.

## Yêu cầu hệ thống

- Node.js 18+ hoặc cao hơn
- pnpm (hoặc npm/yarn)

## Cài đặt và chạy local

### Bước 1: Cài đặt dependencies

Nếu bạn chưa có pnpm, cài đặt nó trước:
```bash
npm install -g pnpm
```

Sau đó cài đặt các dependencies của dự án:
```bash
pnpm install
```

Hoặc nếu dùng npm:
```bash
npm install
```

### Bước 2: Chạy development server

```bash
pnpm dev
```

Hoặc với npm:
```bash
npm run dev
```

### Bước 3: Mở trình duyệt

Mở trình duyệt và truy cập:
```
http://localhost:3000
```

## Các lệnh khác

### Build cho production
```bash
pnpm build
```

### Chạy production server (sau khi build)
```bash
pnpm start
```

### Kiểm tra lỗi code
```bash
pnpm lint
```

## Lưu ý

- Dữ liệu sẽ được lưu trong thư mục `data/` (tự động tạo khi chạy lần đầu)
  - `data/quiz-data.json` - File JSON duy nhất chứa tất cả dữ liệu:
    - `rooms`: Danh sách phòng quiz
    - `session`: Thông tin đăng nhập
    - `lastUpdated`: Thời gian cập nhật cuối cùng
- Để sử dụng tính năng quét QR code, bạn cần cho phép truy cập camera trong trình duyệt
- Nếu CSS không hiển thị đúng, thử:
  1. Xóa thư mục `.next`: `rm -rf .next` (Linux/Mac) hoặc `rmdir /s .next` (Windows)
  2. Chạy lại: `pnpm dev`

## Tính năng

- ✅ Tạo và quản lý phòng quiz
- ✅ Quét QR code để tham gia phòng
- ✅ Quản lý câu hỏi và điểm số
- ✅ Lưu trữ dữ liệu trong JSON files (thay vì localStorage)
- ✅ Giao diện responsive và hiện đại

