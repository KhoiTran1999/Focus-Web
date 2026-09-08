# Focus & Wellness Desk Station 🧘‍♂️⏱️

> Trạm hỗ trợ làm việc & chăm sóc sức khỏe cá nhân (24/7 Desk Station), hoạt động hoàn toàn trên nền tảng web thuần (Vanilla HTML5/CSS3/JS), offline-first PWA, không phụ thuộc thư viện ngoài (zero-dependency).

---

## 🌟 Tính năng chính

### 1. ⏱️ Quản lý thời gian & Chu kỳ Pomodoro
- **Hộp thoại Cấu hình & Tiến độ (Settings & Progress Modal)**: Nhấp trực tiếp vào badge chu kỳ trên đồng hồ để xem tiến độ trực quan, tùy chỉnh số phút (Focus, Short Break, Long Break), số chu kỳ, chọn nhanh các preset hoặc reset chu kỳ / reset đồng hồ.
- **Ẩn chữ số đếm ngược (Hide Timer Digits / Minimalist Mode)**: Tùy chọn ẩn số đếm ngược để tập trung tối đa, chỉ giữ lại vòng tròn tiến độ; chạm nhẹ hoặc rê chuột để xem thời gian còn lại.
- **Điều chỉnh trực tiếp**: Nhấp vào biểu tượng chỉnh sửa (bút chì) để cập nhật thời gian còn lại mà không cần reset phiên.
- **Biểu tượng tăng trưởng (Sprout)**: Cây mầm phát triển dần theo % thời gian hoàn thành phiên tập trung.
- **Chống tắt màn hình (Screen Wake Lock API)**: Giữ màn hình điện thoại/tablet phụ trên bàn làm việc luôn sáng ngầm liên tục.
- **Chế độ AMOLED Fullscreen**: Nền đen tuyệt đối tiết kiệm pin màn hình OLED, tự động triệt tiêu thanh cuộn trên desktop/mobile.

### 2. 🧘 Chuông chánh niệm ngẫu nhiên (Mindfulness Bell)
- Tự động điểm chuông ngẫu nhiên độc lập phiên làm việc, nhắc nhở thả lỏng cơ thể và hít thở sâu.
- **Thuật toán Wake Catch-up**: Tự động bù trừ thời gian khi thiết bị ngủ (sleep) hoặc tab bị trình duyệt tạm dừng chạy nền, bảo đảm nhịp chuông luôn ổn định.
- **Hộp thoại tương tác nổi bật**: Hiển thị popup nhắc nhở chánh niệm, hỗ trợ đóng nhanh bằng phím cứng hoặc thao tác chạm.

### 3. 🫁 Bài tập thở hộp (Box Breathing - 2 phút)
- Chu kỳ thở vuông chuẩn 4s (Hít vào 4s - Giữ 4s - Thở ra 4s - Giữ rỗng 4s).
- Vòng tròn co giãn trực quan kết hợp âm thanh procedural tạo bởi Web Audio API nhẹ nhàng, không cần tải file ngoài.

### 4. 🤸 Giãn cơ (Desk Stretches) & HIIT Calisthenics
- **5 động tác giãn cơ tại bàn**: Nghiêng cổ, xoay vai, căng cổ tay, mở ngực, vặn cột sống (ảnh SVG động mượt mà, siêu nhẹ).
- **Bộ bài tập HIIT / Bodyweight phong phú**: Hít đất, Squat, Jumping Jacks, Hít xà (Pull-ups), Plank, Burpees,... kèm ảnh động WebP hướng dẫn tư thế chuẩn.
- **Bộ đếm Reps / Sets thông minh**: Tự động xoay tua bài tập không trùng lặp, lưu tiến độ bài tập.

### 5. 📊 Thống kê & Lưu trữ dữ liệu
- Biểu đồ cột SVG trực quan thống kê số phút tập trung, số lần nghỉ và bài tập hoàn thành trong ngày/tuần.
- Lưu trữ hoàn toàn tại local (`localStorage`), tự động tính toán thời gian trôi qua khi chuyển tab hoặc tắt mở lại.

### 6. 📱 PWA & Âm thanh Web Audio
- **PWA Service Worker v2**: Chiến lược cache thông minh (Network-first cho navigation để cập nhật mã nguồn mới nhất khi online, Cache-first cho static assets/hình ảnh/âm thanh bảo đảm offline 100%).
- Cài đặt như ứng dụng native trên máy tính, điện thoại, tablet thông qua Web App Manifest (`manifest.json`).
- Đa ngôn ngữ: Hỗ trợ chuyển đổi mượt mà giữa Tiếng Việt và Tiếng Anh.

---

## ⚡ Tối ưu hóa hiệu năng (Performance Highlights)

- **Zero-dependency**: Hoàn toàn không phụ thuộc thư viện bên ngoài (React, Vue, Tailwind, v.v.), dung lượng siêu nhẹ, nạp tức thì ngay cả trên các thiết bị đời cũ.
- **Delta-time Background Tracking**: Dùng mốc thời gian thực (`Date.now()`) để tính toán độ trôi, khắc phục triệt để hiện tượng trễ timer do trình duyệt throttle `setInterval` ở tab nền.
- **DOM Update Throttling**: Chỉ can thiệp cập nhật DOM và document title khi giá trị chuỗi thời gian thực sự thay đổi, giảm thiểu tối đa tải CPU/GPU.
- **Tối ưu năng lượng cho Desk Station**: Chế độ AMOLED hạn chế tối đa điểm ảnh phát sáng; SVG/CSS animations thuần không ngốn tài nguyên.

---

## ⌨️ Phím tắt (Shortcuts)

Để tối ưu cho màn hình cảm ứng để bàn và tránh kích hoạt nhầm khi thao tác tay, các phím bấm toàn cục đã được tinh giản:

| Phím | Chức năng |
| :---: | :--- |
| `Esc` | Đóng bất kỳ hộp thoại đang mở (Pomodoro modal, chỉnh giờ, bài tập, chuông chánh niệm) |
| `Space` / `Enter` | Tắt nhanh thông báo chuông chánh niệm khi hộp thoại hiển thị |

---

## 🚀 Khởi chạy & Cài đặt

### Cách 1: Mở trực tiếp (Không cần cài đặt)
Mở trực tiếp file `index.html` bằng bất kỳ trình duyệt hiện đại nào (Chrome, Edge, Safari, Firefox).

### Cách 2: Chạy qua Static Server (Khuyên dùng cho PWA & Service Worker)
Service Worker yêu cầu chạy qua giao thức `http://` hoặc `https://`:

```bash
# Sử dụng Python 3
python -m http.server 8000

# Hoặc sử dụng Node.js (npx serve / http-server)
npx serve .
```
Truy cập `http://localhost:8000` và nhấn biểu tượng **Install** trên thanh địa chỉ để cài đặt PWA.

---

## 🧪 Kiểm thử (Sanity Check)

Dự án đi kèm bộ test tích hợp sẵn sử dụng Node.js standard library (không cần cài thêm npm package):

```bash
node test_sanity.js
```

Bộ test kiểm tra:
- Khả năng compile & chạy logic JavaScript trong môi trường giả lập DOM (`vm`).
- Thuật toán xoay tua bài tập HIIT (không trùng bài kế tiếp).
- Khả năng lưu/phục hồi trạng thái Timer vào `localStorage`.
- Chuyển đổi chu kỳ Pomodoro & Long Break.
- Tín hiệu âm thanh bài tập thở hộp (Box Breathing).
- Tính năng lập lịch, wake catch-up & kích hoạt chuông chánh niệm (Mindfulness Bell).
- Hộp thoại Cấu hình Pomodoro & kiểm soát tiến độ chu kỳ (Settings & Progress Modal).
- Tính năng ẩn chữ số đếm ngược (Hide Timer Digits).
- Chiến lược caching của Service Worker v2.

---

## 📁 Cấu trúc dự án

```text
Focus-Web/
├── index.html          # Toàn bộ giao diện, styles (CSS), và logic điều khiển (Single-file)
├── sw.js               # Service Worker quản lý bộ nhớ đệm cache v2 & offline mode
├── manifest.json       # Cấu hình PWA Web App Manifest
├── icon.svg            # Biểu tượng ứng dụng vector
├── bell sound.mp3      # Âm thanh chuông chánh niệm
├── test_sanity.js      # Kịch bản kiểm thử tự động với Node.js stdlib
└── listWorkoutGif/     # Thư mục chứa ảnh động WebP hướng dẫn bài tập HIIT
```
