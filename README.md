# MỤC TIÊU DỰ ÁN: MULTI-SSO COMPARISON STACK

## Mục Tiêu Khởi Chạy

Mục tiêu cuối cùng là khởi động toàn bộ hệ thống phát triển cục bộ một cách đơn giản nhất:

```bash
docker-compose up -d
```

Lệnh này sẽ triển khai thành công:

- **3 Ứng Dụng Độc Lập** (Backend & Frontend riêng biệt).
- **3 Nhà Cung Cấp SSO Độc Lập** (để so sánh và phân tích).
- Toàn bộ dự án sử dụng chung **PostgreSQL DB** và **Redis Cache** để quản lý dữ liệu và phiên.

---

## 🎯 Mục Đích Chính

Thiết lập này nhằm mục đích **giảm sát, phân tích và so sánh** hiệu suất, luồng xác thực của 3 nhà cung cấp SSO khác nhau trong một môi trường thống nhất.

---

## 🤝 Quy Tắc Cộng Tác (Chỉnh Sửa Code)

Để đảm bảo tính ổn định và tránh xung đột, vui lòng tuân thủ nghiêm ngặt các quy tắc sau:

### 1. **File** `docker-compose.yml`:
   - **Đường dẫn**: Chỉ chính sửa các khối service có **NOTE TÊN CỦA BẠN** bên cạnh.
   - **Cấm**: **TUYỆT ĐỐI KHÔNG** thay đổi các service chung: `postgres-db`, `redis-cache`, và cấu hình mạng (network).

### 2. **Thư mục** `apps/`:
   - Chỉ chỉnh sửa trong thư mục ứng dụng mà bạn được giao (ví dụ: `apps/app-oc/`).

### 3. **Thư mục** `sso-providers/`:
   - Chỉ chỉnh sửa trong thư mục nhà cung cấp SSO mà bạn phụ trách.

**NGUYÊN TẮC**: Không dùng tới phần code hoặc cấu hình của người khác.
**OIDC Diagram**
```mermaid
sequenceDiagram
    participant Browser
    participant Frontend
    participant Backend
    participant Redis
    participant OIDC Provider

    Note over Browser,OIDC Provider: 1. LOGIN FLOW (Authorization Code Flow)
    
    Browser->>Frontend: Click "Login with OIDC"
    Frontend->>Backend: GET /login
    Backend->>Backend: Generate auth URL
    Backend-->>Browser: Redirect to OIDC Provider
    Browser->>OIDC Provider: GET /protocol/openid-connect/auth<br/>(client_id, redirect_uri, scope)
    OIDC Provider-->>Browser: Show login form
    Browser->>OIDC Provider: POST /protocol/openid-connect/auth<br/>(username, password)
    OIDC Provider->>Redis: Store auth code
    OIDC Provider-->>Browser: Redirect to callback<br/>(code, state)
    
    Browser->>Backend: GET /callback?code=xxx
    Backend->>OIDC Provider: POST /protocol/openid-connect/token<br/>(code, client_secret)
    OIDC Provider->>Redis: Validate & delete code
    OIDC Provider->>Redis: Store access token
    OIDC Provider-->>Backend: Return tokens<br/>(access_token, id_token)
    Backend->>OIDC Provider: GET /protocol/openid-connect/userinfo<br/>(Bearer token)
    OIDC Provider->>Redis: Validate token
    OIDC Provider-->>Backend: Return user info
    Backend->>Redis: Save session (tokenSet, user)
    Backend-->>Browser: Redirect to Frontend?logged_in=true
    
    Browser->>Backend: GET /user (with session cookie)
    Backend->>Redis: Get session
    Backend-->>Browser: Return user info
    Frontend->>Frontend: Display user data

    Note over Browser,OIDC Provider: 2. CHECK USER SESSION FLOW
    
    Browser->>Frontend: Refresh page
    Frontend->>Backend: GET /user (with session cookie)
    Backend->>Redis: Get session
    alt Session valid
        Backend-->>Frontend: Return user info
        Frontend->>Frontend: Display logged in state
    else Session invalid/expired
        Backend-->>Frontend: 401 Not logged in
        Frontend->>Frontend: Display login button
    end

    Note over Browser,OIDC Provider: 3. LOGOUT FLOW
    
    Browser->>Frontend: Click "Logout"
    Frontend->>Backend: POST /logout (with session cookie)
    Backend->>Redis: Destroy session
    Backend-->>Frontend: Redirect to login page
    Frontend->>Frontend: Clear user state
    Frontend->>Frontend: Show login button
```