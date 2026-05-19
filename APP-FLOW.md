# APP-FLOW — Dokumentasi Lengkap Starter Kit

> **Tujuan file ini:** Ringkasan lengkap seluruh arsitektur, flow, dan konvensi aplikasi.
> Baca file ini dulu sebelum mengeksplorasi folder — cukup 1 file ini untuk memahami keseluruhan sistem.

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Struktur Direktori](#2-struktur-direktori)
3. [Backend — Arsitektur](#3-backend--arsitektur)
4. [Frontend — Arsitektur](#4-frontend--arsitektur)
5. [Auth Flow](#5-auth-flow)
6. [RBAC — Role, Permission, Menu](#6-rbac--role-permission-menu)
7. [Error Handling Pattern](#7-error-handling-pattern)
8. [File Upload Pattern](#8-file-upload-pattern)
9. [Cara Tambah Fitur Baru](#9-cara-tambah-fitur-baru)
10. [Default Credentials & Seeder](#10-default-credentials--seeder)
11. [Konvensi Penting](#11-konvensi-penting)

---

## 1. Tech Stack

### Backend
| Layer | Teknologi |
|---|---|
| Framework | Laravel 11 (PHP 8.2+) |
| Auth | Laravel Sanctum (token-based) |
| DB | MySQL (bisa PostgreSQL) |
| File Storage | Laravel Filesystem (`public` disk) |
| API prefix | `/api/` (semua via `routes/api.php`) |

### Frontend
| Layer | Teknologi |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| State Management | Zustand (auth + UI state) |
| Server State | TanStack Query v5 (React Query) |
| HTTP Client | Axios (instance custom di `services/api/axios.js`) |
| Form | React Hook Form |
| UI Components | Custom (di `components/ui/`) |
| Notifications | Sonner (toast) |
| Icons | Lucide React |
| Styling | Tailwind CSS |

---

## 2. Struktur Direktori

```
starter-kit/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Helpers/
│   │   │   └── ApiResponse.php         # ← Semua response JSON lewat sini
│   │   ├── Http/
│   │   │   ├── Controllers/Api/        # AuthController, UserController, RoleController, MenuController
│   │   │   ├── Middleware/
│   │   │   │   ├── CheckPermission.php # Middleware permission slug-based
│   │   │   │   └── ForceJsonResponse.php
│   │   │   └── Requests/               # Form validation (Store/Update per resource)
│   │   ├── Models/                     # User, Role, Permission, Menu
│   │   ├── Services/                   # AuthService, UserService, RoleService, MenuService, FileService
│   │   └── Traits/
│   │       └── FullTextSearch.php      # LIKE search helper
│   ├── bootstrap/app.php               # Middleware + global exception handler
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php
│   └── routes/api.php                  # Semua route API
│
└── frontend/                   # React SPA
    └── src/
        ├── App.jsx                     # Root: QueryClient, Router, Route tree
        ├── routes/
        │   └── ProtectedRoute.jsx      # ProtectedRoute, GuestRoute, PermittedRoute
        ├── layouts/
        │   ├── AppLayout.jsx           # Shell: Sidebar + Topbar + <Outlet>
        │   ├── AuthLayout.jsx          # Shell untuk halaman login/register
        │   └── Sidebar.jsx             # Sidebar dinamis dari API sidebar
        ├── stores/
        │   ├── authStore.js            # Zustand: user, token, _hasHydrated
        │   ├── sidebarStore.js         # Zustand: collapsed state
        │   └── themeStore.js           # Zustand: dark mode
        ├── services/api/
        │   ├── axios.js                # Axios instance + interceptors (auth + token refresh)
        │   ├── auth.js                 # authApi wrapper
        │   ├── users.js                # usersApi wrapper
        │   ├── roles.js                # rolesApi wrapper
        │   └── menus.js                # menusApi wrapper
        ├── utils/
        │   ├── toastMsg.js             # Ekstrak pesan error dari axios error
        │   └── tryCatch.js              # Wrapper async try-catch reusable
        ├── hooks/
        │   └── useDebounce.js          # Debounce search input
        ├── components/
        │   ├── ErrorBoundary.jsx
        │   └── ui/                     # Button, Modal, FormModal, ConfirmDeleteModal, DataTable, Badge, Input, FileInput, dll
        └── features/
            ├── auth/                   # LoginPage, RegisterPage, AccountModal
            ├── dashboard/              # DashboardPage
            ├── users/                  # UsersPage, UserForm
            ├── roles/                  # RolesPage, RoleForm, RoleAssignModal
            └── menus/                  # MenusPage, MenuForm, MenuTreeView
```

---

## 3. Backend — Arsitektur

### 3.1 Response Format (ApiResponse)

**File:** `app/Helpers/ApiResponse.php`

Semua response API menggunakan class ini. Ada 4 static method:

```php
// Sukses biasa
ApiResponse::success($data, $message = 'Success', $status = 200)
// -> { success: true, message, data }

// Error
ApiResponse::error($message = 'Error', $status = 400, $errors = null)
// -> { success: false, message, errors? }

// Paginated list
ApiResponse::paginated($paginator, $message = 'Success')
// -> { success: true, message, data: [...], meta: { total, per_page, current_page, last_page, links } }

// Wrapper try-catch reusable
ApiResponse::tryCatch(callable $fn)
// Catches InvalidArgumentException -> 422
// Catches Throwable -> 500
// -> Panggil $fn() di dalam, return hasilnya
```

### 3.2 Controller Pattern

Semua method controller dibungkus `ApiResponse::tryCatch()`:

```php
public function store(StoreXxxRequest $request, XxxService $service): JsonResponse
{
    return ApiResponse::tryCatch(
        fn() => ApiResponse::success($service->create($request->validated()), 'Created', 201)
    );
}

// Jika butuh closure multi-line (destroy, sidebar, dll):
public function destroy(Xxx $xxx, XxxService $service): JsonResponse
{
    return ApiResponse::tryCatch(function () use ($xxx, $service) {
        $service->delete($xxx);
        return ApiResponse::success(null, 'Deleted successfully');
    });
}
```

**Controller yang ada:**
- `AuthController` — register, login, logout, refresh, me, updateProfile
- `UserController` — index, store, show, update, destroy
- `RoleController` — index, store, show, update, destroy, syncPermissions, syncMenus, permissions
- `MenuController` — index, flat, store, show, update, destroy, sidebar

### 3.3 Service Pattern

Business logic ada di Service, bukan Controller. Service di-inject via method parameter (Laravel DI).

```php
// Semua service pakai FullTextSearch trait untuk search:
use App\Traits\FullTextSearch;

public function paginate(int $perPage, ?string $search, string $sortBy, string $sortDir): LengthAwarePaginator
{
    return Model::query()
        ->when($search, fn($q) => $this->applySearch($q, $search, ['col1', 'col2']))
        ->orderBy($sortBy, $sortDir)
        ->paginate($perPage);
}
```

- `AuthService` — register, login (throw InvalidArgumentException jika gagal), logout, refresh, me, updateProfile
- `UserService` — paginate, create, update, delete
- `RoleService` — paginate, create, update, delete, syncPermissions, syncMenus, allPermissions, find
- `MenuService` — paginate, flat, create, update, delete, find, getSidebarForRole (dengan cache)
- `FileService` — store, replace, delete, url (validasi ukuran + MIME)

### 3.4 Middleware

**`ForceJsonResponse`** — prepended ke semua api middleware, memaksa semua response `Accept: application/json`

**`CheckPermission`** — alias `permission`, dipakai di route:
```php
->middleware('permission:users.view')
// Cek: $user->role->permissions()->where('slug', $slug)->exists()
// 401 jika unauthenticated, 403 jika tidak punya permission
```

### 3.5 Global Exception Handler (`bootstrap/app.php`)

Semua exception berikut sudah di-handle globally — tidak perlu catch di controller:

| Exception | Response |
|---|---|
| `AuthenticationException` | 401 `{ success: false, message: 'Unauthenticated.' }` |
| `ValidationException` | 422 `{ success: false, message: 'Validation failed.', errors: {...} }` |
| `ModelNotFoundException` | 404 `{ success: false, message: 'Resource not found.' }` |
| `QueryException` | 500 (message raw di debug, generic di production) |
| `ThrottleRequestsException` | 429 |
| `MethodNotAllowedHttpException` | 405 |

`ApiResponse::tryCatch()` menambahkan layer tambahan untuk:
- `InvalidArgumentException` -> 422 (error bisnis dari service)
- `Throwable` lainnya -> 500

### 3.6 Routes (`routes/api.php`)

```
GET  /ping                          — health check (no auth)
POST /auth/login                    — throttle:10,1
POST /auth/register                 — throttle:10,1

--- auth:sanctum ---
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
PATCH  /auth/profile

GET    /menus/flat                  — untuk semua role (no permission check)
GET    /menus/sidebar               — sidebar sesuai role user

GET    /permissions                 — permission:roles.view

GET/POST/PUT/PATCH/DELETE /users/{?} — permission:users.*
GET/POST/PUT/PATCH/DELETE /roles/{?} — permission:roles.*
POST   /roles/{role}/permissions    — permission:roles.update
POST   /roles/{role}/menus          — permission:roles.update
GET/POST/PUT/PATCH/DELETE /menus/{?} — permission:menus.*
```

---

## 4. Frontend — Arsitektur

### 4.1 Route Guards (`routes/ProtectedRoute.jsx`)

Ada 3 guard:

**`ProtectedRoute`** — Cek `token` di authStore. Jika tidak ada -> redirect `/login`. Jika store belum hydrate -> tampil loader.

**`GuestRoute`** — Kebalikan: jika sudah login -> redirect `/dashboard`.

**`PermittedRoute`** — Query `GET /menus/sidebar`, ambil semua `route` dari hasilnya (rekursif termasuk children). Jika `pathname` tidak ada di daftar -> toast error + redirect `/dashboard`.

### 4.2 Route Tree (`App.jsx`)

```
/login, /register       ← GuestRoute > AuthLayout
/dashboard              ← ProtectedRoute > AppLayout
/users, /roles, /menus  ← ProtectedRoute > AppLayout > PermittedRoute
/                       ← Navigate to /dashboard
*                       ← Navigate to /dashboard
```

Semua page di-`lazy()` untuk code splitting.

### 4.3 AppLayout

- Sidebar kiri (collapsible, mobile-responsive dengan overlay)
- Topbar: judul halaman (dari `titles` map), dark mode toggle, network indicator, avatar/account
- Konten: `<Outlet />` dibungkus `ErrorBoundary`
- Judul ditambah dengan menambah key ke object `titles` di `AppLayout.jsx`:
  ```js
  const titles = { '/dashboard': 'Dashboard', '/products': 'Products', ... }
  ```

### 4.4 Sidebar

Data sidebar diambil dari `GET /menus/sidebar` (React Query, `staleTime: 0`).
Merender hierarki menu (parent + children) berdasarkan data role user.
Icon: SVG raw string dari HeroIcons (di-render `dangerouslySetInnerHTML`).

### 4.5 State Management (Zustand)

**`authStore`** — persisted ke localStorage (`auth-storage`):
```js
{ user, token, _hasHydrated }
// Actions: setAuth(user, token), setUser, setToken, clearAuth, setHasHydrated
// useAuthStore((s) => s.token) — untuk komponen
// useAuthStore.getState().token — untuk axios interceptor (luar React)
```

**`sidebarStore`** — persisted: `{ collapsed }` + `toggle()`

**`themeStore`** — persisted: `{ dark }` + `toggle()`

### 4.6 Axios Instance (`services/api/axios.js`)

- `baseURL`: dari `VITE_API_URL`
- `timeout`: 15 detik
- **Request interceptor:** inject `Authorization: Bearer {token}` dari authStore
- **Response interceptor:**
  - `403` -> set custom error message -> reject
  - `401` -> cek apakah bisa refresh token:
    - Jika `isRefreshing`: masuk queue, tunggu token baru
    - Jika belum: POST `/auth/refresh`, set token baru, retry semua request pending
    - Jika refresh gagal: `clearAuth()` + redirect `/login`

### 4.7 API Service Wrappers

Thin wrappers di `services/api/`:
```js
// Contoh users.js
export const usersApi = {
  list:   (params) => api.get('/users', { params }),
  get:    (id)     => api.get(`/users/${id}`),
  create: (data)   => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id)     => api.delete(`/users/${id}`),
}
```

Untuk fitur dengan **file upload**, gunakan `FormData` + `?_method=PUT` (karena browser tidak support PUT multipart):
```js
update: (id, data) => api.post(`/products/${id}?_method=PUT`, toFormData(data), {
  headers: { 'Content-Type': 'multipart/form-data' },
})
```

### 4.8 Error Handling (Frontend)

**`utils/toastMsg.js`** — ekstrak pesan error dari axios error:
- `ECONNABORTED` / `ERR_CANCELED` -> "Permintaan terlalu lama..."
- Tidak ada response -> "Tidak dapat terhubung ke server..."
- Status 422 + ada `errors` -> gabung semua error field dengan `•`
- Status 500+ di production -> generic message
- Fallback -> `response.data.message` atau `e.message`

**`utils/tryCatch.js`** — wrapper async try-catch reusable untuk auth pages:
```js
export async function tryCatch(fn, onError) {
  try {
    return await fn()
  } catch (err) {
    if (onError) onError(err)      // custom error handler
    else toast.error(toastMsg(err)) // default: auto toast
    return null
  }
}
// Return: hasil fn() jika sukses, null jika error
```

**React Query mutations** — pola standar untuk CRUD pages:
```js
const mutation = useMutation({
  mutationFn: (data) => usersApi.create(data),
  onSuccess: () => { toast.success('Created.'); qc.invalidateQueries({ queryKey: ['users'] }) },
  onError:   (e) => toast.error(toastMsg(e)),
})
```

**QueryCache global** (`App.jsx`) — untuk query error (bukan mutation):
- Ignore 401/403 (sudah ditangani axios interceptor)
- Error lain -> toast otomatis

### 4.9 CRUD Page Pattern

Semua CRUD page (`UsersPage`, `RolesPage`) mengikuti pola ini:
```
State: page, search, sortBy, sortDir, modal (null | { mode, data }), deleting
useQuery: list data dengan keepPreviousData
useMutation: create, update, delete (masing-masing dengan onSuccess + onError)
DataTable: columns via @tanstack/react-table columnHelper
Pagination: komponen Pagination dari ui/DataTable
Modal: Add/Edit (form) + Delete confirm
useDebounce: delay search 400ms sebelum hit API
```

**`MenusPage` menggunakan pola berbeda** (tree view, bukan DataTable):
```
State: search, modal, deleting  (tidak ada page/sort karena semua di-load sekaligus)
useQuery: menusApi.flat() — semua menus sekaligus (bukan paginated)
Search: client-side filter dari flat list (jika child match, parent ikut ditampilkan)
Tree view: MenuTreeView — bangun parent/child tree dari flat list
Drag-to-reorder: Sortable.js per group (root + per-parent children)
  → onEnd: batch PUT /menus/{id} dengan order baru untuk semua item dalam group
  → Disabled saat search aktif atau sedang mutating
Collapsible: toggle per parent (state `collapsed = { [id]: bool }`)
```

**`MenuTreeView` component** (`features/menus/components/MenuTreeView.jsx`):
- `buildTree(flat)` — groupkan flat list ke parent+children, sort by `order`
- `SortableContainer` — wrapper Sortable.js instance per group, disabled toggled via `instance.option('disabled')`
- Setiap baris: drag handle | collapse toggle/└ | icon | name | route badge | status dot | edit+delete (hover)
- `data-id` attribute di setiap item → `sortable.toArray()` ambil urutan ID baru setelah drag

---

## 5. Auth Flow

### Login
```
[LoginPage] onSubmit
  -> tryCatch(() => authApi.login({ login, password }), customErrorHandler)
  -> POST /auth/login (throttle 10 req/menit)
  -> AuthService::login()
      -> cek username/email + password
      -> cek is_active
      -> jika gagal: throw InvalidArgumentException -> 422
      -> jika sukses: createToken() -> return { token, user }
  -> setAuth(user, token) ke authStore (persist localStorage)
  -> queryClient.clear()
  -> navigate('/dashboard')
```

### Token Refresh (Auto)
```
Request gagal 401
  -> axios interceptor cek: bukan auth page? bukan refresh call? belum retry?
  -> POST /auth/refresh
      -> AuthService::refresh(): hapus token lama, buat token baru
  -> Set token baru di store + header
  -> Retry semua request yang pending
  -> Jika refresh juga 401: clearAuth() + redirect /login
```

### Logout
```
[AccountModal] klik logout
  -> POST /auth/logout (hapus token di DB)
  -> clearAuth() (hapus dari store + localStorage)
  -> queryClient.clear()
  -> navigate('/login')
```

### Register
```
[RegisterPage] onSubmit
  -> tryCatch(() => authApi.register(values))
  -> POST /auth/register
  -> AuthService::register(): create user dengan is_active: false, role_id: null
  -> Tampil halaman sukses "Menunggu aktivasi admin"
```

---

## 6. RBAC — Role, Permission, Menu

### Model & Relasi
```
User -> belongsTo Role
Role -> belongsToMany Permission (pivot: role_permissions)
Role -> belongsToMany Menu (pivot: role_menus, ordered by menus.order)
Menu -> bisa punya parent_id (self-referential, untuk sub-menu)
```

### Permission Check
```php
// Di User model:
public function hasPermission(string $slug): bool
{
    return (bool) $this->role?->permissions()->where('slug', $slug)->exists();
}

// Di middleware CheckPermission:
->middleware('permission:users.view')
```

### Slug Convention
Format: `{resource}.{action}` — contoh: `users.view`, `users.create`, `users.update`, `users.delete`

### Sidebar / PermittedRoute
```
GET /menus/sidebar -> MenuService::getSidebarForRole(role_id)
  -> query menus via role_menus pivot
  -> di-cache per role (Laravel cache)
  -> return tree: [{ id, name, slug, route, icon, order, children: [...] }]

PermittedRoute:
  -> query sidebar
  -> extract semua route (rekursif)
  -> jika pathname tidak ada di list -> redirect /dashboard
```

### Assign Menu & Permission ke Role (`RoleAssignModal`)

**Layout** — satu tampilan tanpa tab, 2 kolom (responsive):
- **Kiri**: nama menu + ikon + checkbox aktif/nonaktif
- **Kanan**: permission chips milik menu tersebut (chip bisa di-check/uncheck)

**Pengelompokan permission ↔ menu** — berdasarkan prefix slug:
- Permission `users.view`, `users.create`, dst. → tampil di baris menu `users`
- Permission yang prefixnya tidak cocok dengan slug menu manapun → tampil di section "Other Permissions" di bawah

**Perilaku interaktif:**
- Menu di-uncheck → semua permission milik menu itu otomatis uncheck + disabled
- Menu di-check kembali → permission menjadi aktif lagi (user bisa check manual)
- Permission CRUD bisa di-check/uncheck bebas selama menu-nya aktif
- **Berlaku juga untuk permission non-CRUD** — apapun nama actionnya tetap muncul sebagai chip

**Save** — satu tombol "Save" → `Promise.all([syncPermissions, syncMenus])` dalam satu mutasi

```
POST /roles/{id}/permissions  { permission_ids: [...] }
POST /roles/{id}/menus        { menu_ids: [...] }
```

---

## 7. Error Handling Pattern

### Backend — Lapisan Error

```
Global (bootstrap/app.php):
  ValidationException    -> 422 + errors object
  ModelNotFoundException -> 404
  AuthenticationException -> 401
  QueryException         -> 500
  ThrottleRequests       -> 429
  MethodNotAllowed       -> 405

ApiResponse::tryCatch() (di setiap controller method):
  InvalidArgumentException -> 422 (error bisnis dari service)
  Throwable lainnya        -> 500

Service:
  throw InvalidArgumentException — untuk error bisnis yang jelas
  (AuthService: kredensial salah, akun non-aktif, password lama salah)
```

### Frontend — Lapisan Error

```
Axios interceptor:
  401 -> token refresh -> retry, atau redirect /login
  403 -> set error message, reject

tryCatch() — untuk auth pages (login, register):
  try { return await fn() }
  catch { onError(err) || toast.error(toastMsg(err)); return null }

React Query onError — untuk CRUD mutations:
  onError: (e) => toast.error(toastMsg(e))

QueryCache.onError — untuk query (GET) errors:
  ignore 401/403, toast untuk yang lain

ErrorBoundary — untuk React render errors
```

---

## 8. File Upload Pattern

### Backend

1. **Migration:** Kolom `string('xxx_path')->nullable()` — simpan path relatif
2. **Model:** Accessor `getXxxUrlAttribute()` pakai `app(FileService::class)->url($this->xxx_path)` + `$appends`
3. **FormRequest:** Rule `'image'` / `'file'`, `'mimes:...'`, `'max:5120'` (5 MB = 5120 KB)
4. **Service:** Inject `FileService`, panggil `store()` / `replace()` / `delete()` dengan **`maxKb: 5120`** eksplisit
5. **Controller:** `$request->file('image')` dikirim ke service

```php
// FileService methods:
store(UploadedFile $file, string $folder, string $disk = 'public', int $maxKb = 5120, array $allowed): string
replace(UploadedFile $newFile, ?string $oldPath, ...): string  // store baru + delete lama
delete(?string $path, ...): void
url(?string $path, ...): ?string   // aman untuk null
```

**PENTING:** `maxKb` di FormRequest, FileService, dan FileInput **harus sama**.
Default FileService = 5120 (tapi kirim eksplisit untuk kejelasan).

### Frontend

1. **API Service:** Gunakan `FormData` + `?_method=PUT` + header `multipart/form-data`
2. **FormData helper:** Boolean -> `'1'`/`'0'`, null/undefined -> skip, File -> append langsung
3. **Form Component:** State `imageFile` + `FileInput` component:
   ```jsx
   <FileInput
     accept="image/jpeg,image/png,image/webp"
     maxKb={5120}
     currentUrl={item?.image_url}   // pratinjau saat Edit
     onChange={setImageFile}
     hint="Maks 5 MB"
   />
   ```
4. Jalankan sekali: `php artisan storage:link`

---

## 9. Cara Tambah Fitur Baru

> Panduan lengkap dengan kode lengkap ada di **GUIDE-ADD-FEATURE.md**

### Checklist Backend
- [ ] **Migration** — indexes, fullText untuk kolom yang di-search
- [ ] **Model** — fillable, casts, relasi
- [ ] **Service** — FullTextSearch trait, paginate/create/update/delete
- [ ] **StoreRequest** + **UpdateRequest** — `required` vs `sometimes`, unique ignore ID saat update
- [ ] **Controller** — semua method pakai `ApiResponse::tryCatch()`
- [ ] **Routes** di `api.php` — dalam grup `auth:sanctum`, masing-masing method + `permission:xxx.*`
- [ ] **Seeder** — permissions (`resource.action` x4) + menu -> assign ke role

### Checklist Frontend
- [ ] **`services/api/xxx.js`** — list, get, create, update, remove (+ FormData jika upload)
- [ ] **`features/xxx/components/XxxForm.jsx`** — react-hook-form, Toggle pakai Controller
- [ ] **`features/xxx/pages/XxxPage.jsx`** — useQuery + 3 useMutation + DataTable + Modal
- [ ] **Route** di `App.jsx` — lazy import + `<Route>` dalam `PermittedRoute`
- [ ] **Judul** di `AppLayout.jsx` — tambah key ke `titles` object
- [ ] **Menu** via admin panel — atau tambah ke Seeder

### Tambahan jika Upload
- [ ] Kolom `_path` di migration
- [ ] Accessor di Model + `$appends`
- [ ] Rule file di FormRequest (max:5120)
- [ ] FileService di Service (maxKb: 5120)
- [ ] `toFormData()` + `?_method=PUT` di API service JS
- [ ] `FileInput` di Form component
- [ ] `php artisan storage:link` (sekali saja)

---

## 10. Default Credentials & Seeder

Jalankan: `php artisan migrate:fresh --seed`

| User | Username | Email | Password | Role |
|---|---|---|---|---|
| Administrator | `admin` | `admin@example.com` | `password` | Administrator (semua permission + semua menu) |
| Staff User | `staff` | `staff@example.com` | `password` | Staff (hanya menu Dashboard) |

**Default Roles:** Administrator, Staff
**Default Permissions:** users/roles/menus × view/create/update/delete (12 total)
**Default Menus:** Dashboard, Users, Roles, Menus

---

## 11. Konvensi Penting

### Backend

| Konvensi | Detail |
|---|---|
| Permission slug | `{resource}.{action}` — cth: `users.view`, `products.delete` |
| Service return | Selalu return model atau array, jangan return Response |
| Error bisnis | Throw `InvalidArgumentException` di service -> ditangkap `tryCatch()` -> 422 |
| File path | Simpan path relatif di DB, bukan URL. Gunakan `FileService::url()` untuk URL |
| Search | Pakai `FullTextSearch` trait + `applySearch()`, kolom sesuai `fullText()` di migration |
| Unique update | FormRequest Update: `"unique:table,col,{$id}"` untuk ignore record sendiri |
| Relasi di response | Pakai `->with('relation')` di query, bukan lazy load |

### Frontend

| Konvensi | Detail |
|---|---|
| Auth pages error | `tryCatch(fn, onError?)` — return null jika error |
| CRUD mutations error | `onError: (e) => toast.error(toastMsg(e))` |
| Toggle/checkbox | Harus pakai `Controller` dari react-hook-form, bukan `{...register()}` |
| Boolean di FormData | Konversi ke `'1'`/`'0'` sebelum append ke FormData |
| Upload PUT | Gunakan `POST /resource/{id}?_method=PUT` bukan `PUT` biasa |
| Query invalidation | Setelah mutation: `qc.invalidateQueries({ queryKey: ['resource'] })` |
| Search debounce | 400ms via `useDebounce` hook sebelum hit API |
| Page title | Daftarkan di object `titles` di `AppLayout.jsx` |
| Lazy import | Semua page di-`lazy()` di `App.jsx` |
| Sidebar cache | `staleTime: 0` agar selalu fresh setelah perubahan role/menu |

### Sinkronisasi Wajib (Upload)

Ketiga nilai ini **harus identik**:
- `max:5120` di FormRequest
- `maxKb: 5120` di FileService call
- `maxKb={5120}` di FileInput component

Dan ketiga ini juga harus konsisten:
- `mimes:jpeg,png,webp` di FormRequest
- `['image/jpeg', 'image/png', 'image/webp']` di FileService `allowed`
- `accept="image/jpeg,image/png,image/webp"` di FileInput

---
