# Focus & Wellness Desk Station 🧘‍♂️⏱️

> Trạm hỗ trợ làm việc & chăm sóc sức khỏe cá nhân (24/7 Desk Station), hoạt động hoàn toàn trên nền tảng web thuần (Vanilla HTML5/CSS3/JS), offline-first PWA, không phụ thuộc thư viện ngoài (zero-dependency).

---

## 🌟 Tính năng chính

### 1. ⏱️ Quản lý thời gian & Chu kỳ Pomodoro
- **Linh hoạt cấu hình**: Tùy chỉnh số phút Focus, Short Break, Long Break và số chu kỳ trước khi nghỉ dài.
- **Điều chỉnh trực tiếp**: Nhấp vào biểu tượng chỉnh sửa để cập nhật thời gian còn lại mà không cần reset.
- **Biểu tượng tăng trưởng (Sprout)**: Mầm cây lớn dần theo tiến độ buổi tập trung.
- **Chống tắt màn hình (Screen Wake Lock API)**: Giữ màn hình điện thoại/tablet phụ trên bàn làm việc luôn sáng.
- **Chế độ AMOLED Fullscreen**: Nền đen tuyệt đối tiết kiệm pin và tối ưu hiển thị như một chiếc đồng hồ để bàn.

### 2. 🧘 Chuông chánh niệm ngẫu nhiên (Mindfulness Bell)
- Tự động điểm chuông ngẫu nhiên từ khi mở ứng dụng (hoạt động độc lập, không phụ thuộc phiên Pomodoro).
- Nhắc nhở người dùng tạm dừng vài giây, hít thở sâu, thả lỏng cơ thể.
- Hỗ trợ thông báo tab nền và âm thanh chuông chân thực.

### 3. 🫁 Bài tập thở hộp (Box Breathing - 2 phút)
- Chu kỳ thở vuông chuẩn 4s (Hít vào 4s - Giữ 4s - Thở ra 4s - Giữ rỗng 4s).
- Hướng dẫn trực quan bằng vòng tròn co giãn và tín hiệu âm thanh procedural Web Audio.

### 4. 🤸 Giãn cơ (Desk Stretches) & HIIT Calisthenics
- **5 động tác giãn cơ tại bàn**: Nghiêng cổ, xoay vai, căng cổ tay, mở ngực, vặn cột sống (ảnh SVG động mượt mà).
- **Bộ bài tập HIIT / Bodyweight phong phú**: Hít đất, Squat, Jumping Jacks, Hít xà (Pull-ups), Plank, Burpees,... kèm ảnh động WebP hướng dẫn tư thế chuẩn.
- **Bộ đếm Reps / Sets thông minh**: Tự động xoay tua bài tập không trùng lặp, lưu tiến độ bài tập.

### 5. 📊 Thống kê & Lưu trữ dữ liệu
- Biểu đồ cột SVG trực quan thống kê số phút tập trung, số lần nghỉ và bài tập hoàn thành trong ngày/tuần.
- Lưu trữ hoàn toàn tại local (`localStorage`), tự động tính toán thời gian trôi qua khi chuyển tab hoặc tắt mở lại.

### 6. 📱 PWA & Âm thanh Web Audio
- Cài đặt như ứng dụng native trên máy tính, điện thoại, tablet thông qua Web App Manifest & Service Worker (`sw.js`).
- Hỗ trợ đầy đủ âm thanh procedural nhẹ nhàng (Web Audio API) và file chuông mẫu (`bell sound.mp3`).
- Đa ngôn ngữ: Hỗ trợ chuyển đổi nhanh giữa Tiếng Việt và Tiếng Anh.

---

## ⌨️ Phím tắt (Shortcuts)

| Phím | Chức năng |
| :---: | :--- |
| `Space` | Bắt đầu / Tạm dừng đồng hồ |
| `S` | Bỏ qua (Skip) phiên tập trung hoặc phiên nghỉ hiện tại |
| `M` | Bật / Tắt âm thanh (Mute/Unmute) |
| `F` | Bật / Tắt chế độ AMOLED Fullscreen |
| `Esc` | Đóng hộp thoại / Tắt thông báo chuông chánh niệm |

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
- Tính năng lập lịch & kích hoạt chuông chánh niệm (Mindfulness Bell).

---

## 📁 Cấu trúc dự án

```text
Focus-Web/
├── index.html          # Toàn bộ giao diện, styles (CSS), và logic điều khiển (Single-file)
├── sw.js               # Service Worker quản lý bộ nhớ đệm cache & offline mode
├── manifest.json       # Cấu hình PWA Web App Manifest
├── icon.svg            # Biểu tượng ứng dụng vector
├── bell sound.mp3      # Âm thanh chuông chánh niệm
├── test_sanity.js      # Kịch bản kiểm thử tự động với Node.js stdlib
└── listWorkoutGif/     # Thư mục chứa ảnh động WebP hướng dẫn bài tập HIIT
```

---

## 🛠️ Công nghệ sử dụng
- **HTML5, CSS3** (Flexbox, Grid, CSS Variables, Responsive Viewports cho Phone/Tablet/Desktop).
- **Modern JavaScript (ES6+)**.
- **Web APIs**: Screen Wake Lock API, Web Audio API, Service Worker API, LocalStorage, Fullscreen API.
