# lib_app

Library management webapp

Cách chạy project backend:

- cd backend
- npm install
- Tạo file .env :
  PORT=5000
  DB_HOST=
  DB_USER=
  DB_PASSWORD=
  DB_NAME=
- chạy npm run dev

Cách chạy project frontend:

- cd frontend
- npm install
- tạo .evn:REACT_APP_API_URL=http://localhost:5000/api
- chạy:npm start

## Git

### Push

- Kiểm tra trạng thái file thay đổi
  git status

- Thêm file thay đổi vào stage
  git add .

- Commit với message
  git commit -m "Mô tả thay đổi"

- Push code lên nhánh hiện tại
  git push
- lần đầu push nhánh mới
  git push -u origin ten_nhanh

### Tạo nhánh

- Tạo nhánh mới và chuyển sang luôn
  git checkout -b feature/ten-chuc-nang

- Push nhánh mới lên GitHub
  git push -u origin feature/ten-chuc-nang

### Pull

- Ở nhánh nào thì pull nhánh đó
  git checkout main
  git pull origin main

- Nếu đang ở nhánh feature
  git checkout feature/ten-chuc-nang
  git pull origin feature/ten-chuc-nang

### Merge

- Về nhánh main
  git checkout main

- Kéo code mới nhất của main về trước
  git pull origin main

- Merge code từ nhánh feature
  git merge feature/ten-chuc-nang

- Push main sau khi merge
  git push origin main

### Khác

git branch # Xem danh sách nhánh local
git branch -a # Xem tất cả nhánh local + remote
git checkout ten_nhanh # Chuyển nhánh
git fetch origin # Cập nhật danh sách nhánh từ remote
