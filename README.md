# 🏠 ViệcNhà - Ứng Dụng Chia Việc Nhà Công Bằng & Nhắc Việc Qua Zalo

Ứng dụng **PWA (Progressive Web App)** di động giải quyết triệt để vấn đề "Lý thuyết trò chơi" (Game Theory) và "Đùn đẩy việc chung" giữa những người ở cùng phòng/nhà.

---

## 🌟 Tính Năng Nổi Bật

1. **Phân chia công bằng & Trọng số điểm (Karma Points):**
   - Không phải việc nào cũng nặng như nhau: Đổ rác (1đ), Rửa bát (2đ), Cọ nhà vệ sinh (4đ).
   - Tự động thống kê **Chỉ số công bằng** giữa các thành viên. Người có điểm thấp hơn sẽ tự giác hoặc được hệ thống gợi ý nhận việc nặng tiếp theo.
2. **Thuật toán xoay việc linh hoạt:**
   - Hỗ trợ **Xoay vòng tuần tự (Round-Robin)**: A ➔ B ➔ C.
   - Hỗ trợ **Ưu tiên người ít điểm nhất**: Giúp cân bằng khối lượng công việc.
3. **Tick hoàn thành & Phản hồi tức thì:**
   - Âm thanh chúc mừng (Web Audio API) + Bắn pháo hoa Confetti khi làm xong.
   - Theo dõi chuỗi ngày chăm chỉ (Streak).
4. **Tích hợp Zalo mượt mà:**
   - Nút **"Gửi Bảng Nhắc Việc Vào Nhóm Zalo"**: Tự động tổng hợp danh sách việc trong ngày, thời hạn, người phụ trách và link app chỉ với 1 chạm.
   - Hỗ trợ nút **"Nhắc Zalo riêng"** từng người chưa làm việc.
5. **Quỹ phạt vui vẻ (Fun Penalty Fund):**
   - Đặt quy ước phòng: Quá 23:00 chưa làm phạt 10.000đ vào quỹ ăn vặt / trà sữa cuối tháng.
6. **Không tốn phí App Store / Google Play:**
   - Cài đặt trực tiếp dạng **PWA (Progressive Web App)** trên cả iOS (Safari) và Android (Chrome).
   - Mở lên toàn màn hình như ứng dụng gốc, không có thanh địa chỉ web.

---

## 🚀 Hướng Dẫn Chạy & Thử Nghiệm

### 1. Chạy trên máy tính (và thử trên điện thoại cùng mạng Wi-Fi):

```bash
# 1. Cài đặt thư viện (nếu chưa cài)
npm install

# 2. Khởi động app
npm run dev
```

Terminal sẽ hiển thị 2 địa chỉ:
- **Local:** `http://localhost:5173/` (xem trên máy tính)
- **Network:** `http://192.168.x.x:5173/` (mở bằng Safari trên iPhone hoặc Chrome trên Android đang kết nối chung Wi-Fi).

---

## 📲 Hướng Dẫn Cài Đặt Ra Màn Hình Điện Thoại

### 🍎 Dành cho iPhone (iOS):
1. Dùng trình duyệt **Safari** mở đường link ứng dụng.
2. Bấm vào nút **Chia sẻ (Share icon)** ở thanh dưới cùng của Safari.
3. Cuộn xuống và chọn **"Thêm vào MH chính" (Add to Home Screen)**.
4. Bấm **"Thêm" (Add)**. Biểu tượng app sẽ nằm trên màn hình như app tải từ App Store!

### 🤖 Dành cho Android:
1. Dùng trình duyệt **Google Chrome** mở đường link.
2. Bấm vào biểu tượng **3 chấm (⋮)** ở góc trên bên phải.
3. Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.

---

## ☁️ Hướng Dẫn Triển Khai Miễn Phí (Vercel / Cloudflare Pages)

Để bạn cùng phòng có thể truy cập mọi lúc mọi nơi bằng 4G/5G mà không cần máy tính của bạn bật:

### Cách 1: Đẩy lên Vercel (Khuyên dùng - 2 phút)
1. Đẩy code lên GitHub repository của bạn:
   ```bash
   git init
   git add .
   git commit -m "feat: initial chore app"
   git branch -M main
   # Thêm remote github của bạn
   # git remote add origin <url-repo>
   # git push -u origin main
   ```
2. Đăng nhập vào [vercel.com](https://vercel.com) (miễn phí).
3. Chọn **"Add New Project"** ➔ Chọn repo GitHub này ➔ Bấm **"Deploy"**.
4. Bạn sẽ có ngay một tên miền miễn phí dạng `https://ten-phong-minh.vercel.app` với đầy đủ chứng chỉ SSL/HTTPS!
