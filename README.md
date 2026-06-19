# E-Commerce Application 🛒

Một ứng dụng thương mại điện tử Full-Stack (Website Bán Hàng) được xây dựng với ReactJS (Frontend) và Node.js/Express (Backend), sử dụng cơ sở dữ liệu MySQL.

## 🚀 Công nghệ sử dụng

### Frontend (`/client`)
- **ReactJS 19** (cùng Vite giúp build và phát triển cực nhanh)
- **Tailwind CSS 4** (Thiết kế giao diện hiện đại, responsive)
- **React Router DOM** (Quản lý điều hướng trang)
- **Framer Motion** (Tạo hiệu ứng animation đẹp mắt)
- **Lucide React** (Bộ icon UI)
- **Axios** (Gọi API)

### Backend (`/server`)
- **Node.js** & **Express** (Xây dựng RESTful API)
- **MySQL2** (Giao tiếp với cơ sở dữ liệu MySQL)
- **BcryptJS** & **JSON Web Token (JWT)** (Bảo mật, mã hoá mật khẩu và phân quyền người dùng)
- **Stripe** (Tích hợp cổng thanh toán trực tuyến)
- **Nodemailer** (Hệ thống gửi email tự động)

---

## 📁 Cấu trúc thư mục

```text
ProjectWEB/
├── client/         # Source code Frontend (ReactJS, Vite, Tailwind)
├── server/         # Source code Backend API (NodeJS, Express)
├── docker-compose.yml # File cấu hình Docker (nếu có)
└── README.md       # Tài liệu hướng dẫn dự án
```

---

## ⚙️ Hướng dẫn cài đặt & Chạy cục bộ (Local Development)

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- [MySQL](https://www.mysql.com/) (hoặc sử dụng XAMPP/Docker)

### 2. Thiết lập Biến môi trường (.env)
Tạo file `.env` ở thư mục gốc (nếu dùng Docker) và ở thư mục `server/` (nếu chạy thủ công), sau đó điền các thông tin cơ bản sau:

```env
# Database Configuration
DB_HOST=localhost       # Đổi thành 'db' nếu dùng Docker
DB_USER=root
DB_PASSWORD=your_secure_db_password
DB_NAME=ecommerce_db
DB_PORT=3306

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email Notifications (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_...

# Client URL
FRONTEND_URL=http://localhost:5173
```

### 3. Chạy thủ công (Không dùng Docker)

**Khởi chạy Backend (Server):**
```bash
cd server
npm install
npm run dev # Hoặc node index.js
```

**Khởi chạy Frontend (Client):**
```bash
cd client
npm install
npm run dev
```
*(Truy cập frontend tại `http://localhost:5173` và API tại `http://localhost:5000/api`)*

---

## 🐳 Khởi chạy nhanh bằng Docker Compose

Nếu bạn đã cài sẵn [Docker](https://docs.docker.com/get-docker/) và [Docker Compose](https://docs.docker.com/compose/install/), bạn có thể khởi tạo toàn bộ hệ thống chỉ với 1 câu lệnh (bao gồm cả MySQL, Backend, Frontend):

```bash
docker-compose up --build
```
*(Thêm cờ `-d` để chạy ngầm: `docker-compose up -d --build`)*

- **Frontend**: `http://localhost:80` (hoặc `http://localhost`)
- **Backend API**: `http://localhost:5000/api`
- *Lưu ý: Database sẽ tự động được khởi tạo thông qua script `/server/db/schema.sql` (nếu bạn có thiết lập sẵn).*

---

## 🌍 Hướng dẫn Triển khai (Deployment)

### Lựa chọn 1: Triển khai trên Máy chủ Ảo (VPS như Ubuntu / DigitalOcean / Render)

Triển khai trên VPS mang lại quyền kiểm soát toàn diện cho toàn bộ hệ thống của bạn. Dưới đây là các bước cơ bản trên một máy chủ Ubuntu mới:

1. **Cài đặt Docker và Docker Compose trên VPS**:
   ```bash
   sudo apt update
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
   sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
   sudo apt update
   sudo apt install -y docker-ce docker-compose
   ```
2. **Clone source code và cấu hình**:
   ```bash
   git clone https://github.com/yourusername/your-ecommerce-repo.git
   cd your-ecommerce-repo
   nano .env # Cấu hình biến môi trường thực tế (Production)
   ```
3. **Build và Deploy**:
   ```bash
   sudo docker-compose up -d --build
   ```
4. **Trỏ Domain**: Thiết lập bản ghi `A` (A Record) trên DNS (GoDaddy, Cloudflare, v.v.) trỏ `@` và `www` về địa chỉ IP của VPS. Đảm bảo `FRONTEND_URL` trong file `.env` khớp với domain thực tế.

---

### Lựa chọn 2: Triển khai linh hoạt (Frontend trên Vercel & Backend trên Railway)

Nếu bạn không muốn tự quản lý VPS, bạn có thể sử dụng các nền tảng tự động (PaaS):

#### A. Backend trên Railway (hoặc Render)
1. Đẩy code lên kho lưu trữ GitHub.
2. Truy cập [Railway.app](https://railway.app/) và tạo dự án mới.
3. Thêm Plugin **MySQL** vào dự án.
4. Deploy riêng thư mục `server` từ repo GitHub.
5. Trong mục **Variables** của Railway, thêm thông tin kết nối do MySQL plugin cung cấp và cấu hình tất cả biến môi trường khác (`JWT_SECRET`, `SMTP_*`, `STRIPE_SECRET_KEY`).
6. Railway sẽ tự tạo một đường dẫn API (ví dụ: `https://ecommerce-api.up.railway.app`). Hãy copy đường dẫn này.

#### B. Frontend trên Vercel
1. Truy cập [Vercel.com](https://vercel.com/) và kết nối (import) kho GitHub của bạn.
2. Thiết lập **Root Directory** là `client`. (Vercel sẽ tự nhận diện đây là dự án Vite/React).
3. Thêm biến môi trường (Environment Variable) sau vào cấu hình Vercel:
   - `VITE_API_URL`: Trỏ tới đường dẫn API từ bước trên + `/api` (Ví dụ: `https://ecommerce-api.up.railway.app/api`).
   *(Đảm bảo trong source code như `client/src/api/axios.js` đã hỗ trợ đọc biến `import.meta.env.VITE_API_URL`).*
4. Nhấn **Deploy**. Vercel sẽ tự động tiến hành build và đưa Frontend của bạn lên mạng!
