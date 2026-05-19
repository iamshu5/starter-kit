# Panduan Menambah Fitur Baru

Panduan ini menggunakan fitur **"Products"** sebagai contoh nyata.
Sesuaikan nama `Product`, `products`, `product` dengan nama fitur Anda.

---

## Daftar Isi
- [Bagian 1 — Fitur CRUD Standar (tanpa upload)](#bagian-1)
- [Bagian 2 — Tambahan jika ada File Upload](#bagian-2)
- [Bagian 3 — Checklist Cepat](#bagian-3)

---

<a name="bagian-1"></a>
## Bagian 1 — Fitur CRUD Standar

### Step 1 — Migration

Buat file migration di `backend/database/migrations/`:

```php
// 2024_01_03_000001_create_products_table.php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name')->index();            // index untuk sort & search
    $table->string('slug')->unique();           // unique = otomatis index
    $table->text('description')->nullable();
    $table->decimal('price', 10, 2)->default(0)->index(); // index jika sering di-sort/filter
    $table->boolean('is_active')->default(true)->index();
    $table->timestamps();
    $table->index('created_at');                // index untuk sort default

    // FULLTEXT untuk search — pasang di kolom yang di-search
    $table->fullText(['name', 'slug', 'description'], 'products_fulltext_search');
});
```

> **Aturan index:**
> - Kolom yang dipakai di `WHERE`, `ORDER BY`, `LIKE` → pasang `->index()`
> - Kolom yang di-search teks (name, description) → masukkan ke `fullText()`
> - Kolom `unique` sudah otomatis punya index, tidak perlu dobel

---

### Step 2 — Model

Buat `backend/app/Models/Product.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'is_active',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Tambahkan relasi di sini jika ada
    // public function category(): BelongsTo { ... }
}
```

---

### Step 3 — Service

Buat `backend/app/Services/ProductService.php`.
Selalu gunakan `FullTextSearch` trait untuk search (menggunakan `LIKE` query agar kompatibel di semua DB):

```php
<?php

namespace App\Services;

use App\Models\Product;
use App\Traits\FullTextSearch;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    use FullTextSearch;

    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        string $sortBy = 'created_at',
        string $sortDir = 'desc'
    ): LengthAwarePaginator {
        $allowed = ['name', 'price', 'created_at'];
        $sortBy  = in_array($sortBy, $allowed) ? $sortBy : 'created_at';
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        return Product::query()
            // Tambahkan ->with('relation') jika ada relasi yang dibutuhkan
            ->when($search, fn($q) => $this->applySearch($q, $search, ['name', 'slug', 'description']))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->update($data);
        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
```

> **Aturan `applySearch`:**
> Kolom yang dimasukkan di sini harus sama dengan kolom di `fullText()` pada migration.
> Search menggunakan `LIKE %keyword%` — index `fullText` disiapkan untuk migrasi ke `MATCH AGAINST` di masa depan jika perlu.

---

### Step 4 — Form Requests

Buat dua file request di `backend/app/Http/Requests/`:

**`StoreProductRequest.php`**
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['required', 'string', 'max:255', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'price'       => ['required', 'numeric', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
```

**`UpdateProductRequest.php`**
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'string', 'max:255', "unique:products,slug,{$productId}"],
            'description' => ['nullable', 'string'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
```

> **Perbedaan Store vs Update:**
> - Store: gunakan `'required'`
> - Update: gunakan `'sometimes'` agar field yang tidak dikirim tidak error
> - Unique: Update harus ignore ID record yang sedang diedit (`unique:table,col,{$id}`)

---

### Step 5 — Controller

Buat `backend/app/Http/Controllers/Api/ProductController.php`.

> **Pola wajib:** Setiap method dibungkus `ApiResponse::tryCatch()` agar semua exception
> (dari service maupun DB) selalu menghasilkan response JSON yang terformat.
> - `InvalidArgumentException` dari service → 422
> - Exception lain (DB error, dsb) → 500

```php
<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request, ProductService $productService): JsonResponse
    {
        return ApiResponse::tryCatch(fn() =>
            ApiResponse::paginated($productService->paginate(
                perPage: (int) $request->get('per_page', 15),
                search:  $request->get('search'),
                sortBy:  $request->get('sort_by', 'created_at'),
                sortDir: $request->get('sort_dir', 'desc'),
            ))
        );
    }

    public function store(StoreProductRequest $request, ProductService $productService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($productService->create($request->validated()), 'Product created successfully', 201)
        );
    }

    public function show(Product $product): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($product)
        );
    }

    public function update(UpdateProductRequest $request, Product $product, ProductService $productService): JsonResponse
    {
        return ApiResponse::tryCatch(
            fn() => ApiResponse::success($productService->update($product, $request->validated()), 'Product updated successfully')
        );
    }

    public function destroy(Product $product, ProductService $productService): JsonResponse
    {
        return ApiResponse::tryCatch(function () use ($product, $productService) {
            $productService->delete($product);
            return ApiResponse::success(null, 'Product deleted successfully');
        });
    }
}
```

---

### Step 6 — Routes & Permission Middleware

Edit `backend/routes/api.php`, tambahkan di dalam `Route::middleware('auth:sanctum')`:

```php
use App\Http\Controllers\Api\ProductController;

// Products
Route::prefix('/products')->group(function () {
    Route::get('/',            [ProductController::class, 'index'])  ->middleware('permission:products.view');
    Route::get('/{product}',   [ProductController::class, 'show'])   ->middleware('permission:products.view');
    Route::post('/',           [ProductController::class, 'store'])  ->middleware('permission:products.create');
    Route::put('/{product}',   [ProductController::class, 'update']) ->middleware('permission:products.update');
    Route::patch('/{product}', [ProductController::class, 'update']) ->middleware('permission:products.update');
    Route::delete('/{product}',[ProductController::class, 'destroy'])->middleware('permission:products.delete');
});
```

> **Pola permission slug:** `{resource}.{action}` — konsisten dengan fitur lain.

---

### Step 7 — Seeder (Permission + Menu)

Edit `backend/database/seeders/DatabaseSeeder.php`, tambahkan di dalam method `run()`:

```php
// === Permissions: Products ===
$productPerms = collect([
    ['name' => 'View Products',   'slug' => 'products.view'],
    ['name' => 'Create Products', 'slug' => 'products.create'],
    ['name' => 'Update Products', 'slug' => 'products.update'],
    ['name' => 'Delete Products', 'slug' => 'products.delete'],
])->map(fn($p) => Permission::create($p));

// Assign ke role Admin (biasanya admin dapat semua)
$admin->permissions()->attach($productPerms->pluck('id'));

// === Menu ===
$productsMenu = Menu::create([
    'name'      => 'Products',
    'slug'      => 'products',
    'icon'      => 'Package',       // nama icon dari lucide-react
    'route'     => '/products',
    'order'     => 5,               // urutan di sidebar
    'is_active' => true,
]);

// Assign menu ke role Admin
$admin->menus()->attach($productsMenu->id);
```

Jalankan seeder ulang:
```bash
php artisan migrate:fresh --seed
```

---

### Step 8 — Frontend: API Service

Buat `frontend/src/services/api/products.js`:

```js
import api from '@/services/api/axios'

export const productsApi = {
  list:   (params) => api.get('/products', { params }),
  get:    (id)     => api.get(`/products/${id}`),
  create: (data)   => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id)     => api.delete(`/products/${id}`),
}
```

---

### Step 9 — Frontend: Form Component

Buat `frontend/src/features/products/components/ProductForm.jsx`:

```jsx
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Input, Toggle } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ProductForm({ product, onSubmit, onClose, loading }) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm()

  useEffect(() => {
    reset(product
      ? { name: product.name, slug: product.slug, description: product.description, price: product.price, is_active: Boolean(product.is_active) }
      : { name: '', slug: '', description: '', price: '', is_active: true }
    )
  }, [product, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <Input
        label="Name"
        placeholder="Product name"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required.' })}
      />
      <Input
        label="Slug"
        placeholder="product-slug"
        error={errors.slug?.message}
        {...register('slug', { required: 'Slug is required.' })}
      />
      <Input
        label="Price"
        type="number"
        placeholder="0"
        error={errors.price?.message}
        {...register('price', { required: 'Price is required.', min: { value: 0, message: 'Min 0.' } })}
      />

      {/* Toggle harus pakai Controller — bukan {...register()} — karena Toggle butuh checked (boolean) bukan event handler */}
      <Controller
        name="is_active"
        control={control}
        defaultValue={true}
        render={({ field }) => (
          <Toggle
            label="Status"
            checked={Boolean(field.value)}
            onChange={field.onChange}
          />
        )}
      />

      <div className="md:col-span-2">
        <Input
          label="Description"
          placeholder="Optional description"
          {...register('description')}
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        <Button type="submit" loading={loading}>{product ? 'Update' : 'Create'} Product</Button>
      </div>
    </form>
  )
}
```

> **Kenapa `Toggle` harus pakai `Controller`, bukan `{...register()}`?**
> `register()` mengembalikan `onChange(event)` — Toggle butuh `onChange(boolean)` dan prop `checked`.
> Jika pakai `{...register()}` langsung, toggle tidak akan berfungsi (nilai tidak terupdate).
> Lihat `Toggle` di `Input.jsx` — ada contoh pemakaian yang benar di JSDoc-nya.

---

### Step 10 — Frontend: Page

Buat `frontend/src/features/products/pages/ProductsPage.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '@/services/api/products'
import { DataTable, Pagination } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FormModal } from '@/components/ui/FormModal'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { ProductForm } from '@/features/products/components/ProductForm'
import { useDebounce } from '@/hooks/useDebounce'
import { toastMsg } from '@/utils/toastMsg'

const col = createColumnHelper()

export function ProductsPage() {
  const qc = useQueryClient()
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [modal, setModal]   = useState(null)
  const [deleting, setDeleting] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', { page, search: debouncedSearch, sortBy, sortDir }],
    queryFn:  () => productsApi.list({ page, search: debouncedSearch, per_page: 15, sort_by: sortBy, sort_dir: sortDir }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  function handleSort(column) {
    if (sortBy === column) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(column); setSortDir('asc') }
    setPage(1)
  }

  const createMutation = useMutation({
    mutationFn: (values) => productsApi.create(values),
    onSuccess: () => { toast.success('Product created.'); qc.invalidateQueries({ queryKey: ['products'] }); setModal(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => productsApi.update(id, values),
    onSuccess: () => { toast.success('Product updated.'); qc.invalidateQueries({ queryKey: ['products'] }); setModal(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.remove(id),
    onSuccess: () => { toast.success('Product deleted.'); qc.invalidateQueries({ queryKey: ['products'] }); setDeleting(null) },
    onError:   (e) => toast.error(toastMsg(e)),
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const columns = useMemo(() => [
    col.accessor('name',  { header: 'Name',  meta: { sortable: true } }),
    col.accessor('price', { header: 'Price', meta: { sortable: true }, cell: i => `Rp ${Number(i.getValue()).toLocaleString('id-ID')}` }),
    col.accessor('is_active', {
      header: 'Status',
      cell: i => <Badge color={i.getValue() ? 'green' : 'red'}>{i.getValue() ? 'Active' : 'Inactive'}</Badge>,
    }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setModal({ mode: 'edit', product: row.original })}>
            <Pencil size={11} /> Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(row.original)}>
            <Trash2 size={11} /> Delete
          </Button>
        </div>
      ),
    }),
  ], [])

  return (
    <div>
      {isMutating && <div className="fixed inset-0 z-60 cursor-wait" />}

      <PageHeader
        title="Products"
        subtitle="Kelola data produk"
        actions={<Button onClick={() => setModal({ mode: 'create' })} disabled={isMutating}><Plus size={12} /> Add Product</Button>}
      />

      <div className="bg-white border border-[#dde2ee] rounded-xl mb-4 shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-[#dde2ee]">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa0b8]" />
            <input
              className="pl-7 pr-3 py-1.5 text-[12px] border border-[#dde2ee] rounded-md outline-none focus:border-navy-3 w-52"
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {isError
          ? <div className="py-10 text-center text-[12px] text-[#e05252]">Gagal memuat data.</div>
          : <>
              <DataTable columns={columns} data={data?.data || []} loading={isLoading}
                sortBy={sortBy} sortDir={sortDir} onSort={handleSort}
                rowOffset={(page - 1) * 15} mutating={isMutating} />
              <Pagination meta={data?.meta} onPageChange={setPage} disabled={isMutating} />
            </>
        }
      </div>

      {modal && (
        <FormModal modal={modal} entityLabel="Product" onClose={() => setModal(null)}>
          <ProductForm
            product={modal?.product}
            loading={createMutation.isPending || updateMutation.isPending}
            onClose={() => setModal(null)}
            onSubmit={values => {
              if (modal.mode === 'edit') updateMutation.mutate({ id: modal.product.id, values })
              else createMutation.mutate(values)
            }}
          />
        </FormModal>
      )}

      <ConfirmDeleteModal
        open={!!deleting}
        title="Delete Product"
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteMutation.mutate(deleting.id)}
        isLoading={deleteMutation.isPending}
      >
        <p className="text-[13px] text-[#5a6380]">Hapus <strong>{deleting?.name}</strong>?</p>
      </ConfirmDeleteModal>
    </div>
  )
}
```

---

### Step 11 — Daftarkan Route di Frontend

Edit `frontend/src/App.jsx`, tambahkan import dan Route:

```jsx
import { ProductsPage } from '@/features/products/pages/ProductsPage'

// Di dalam <Routes> → <Route element={<ProtectedRoute />}> → <Route element={<AppLayout />}>:
<Route element={<PermittedRoute />}>
  <Route path="/products" element={<ProductsPage />} />
</Route>
```

---

<a name="bagian-2"></a>
## Bagian 2 — Tambahan Jika Ada File Upload

Lakukan **semua step di Bagian 1** terlebih dahulu, kemudian tambahkan hal berikut:

---

### Upload Step A — Tambahkan Kolom File ke Migration

```php
// Tambahkan di dalam Schema::create():
$table->string('image_path')->nullable();  // simpan path relatif, bukan URL
```

---

### Upload Step B — Tambahkan ke Model `$fillable`

```php
protected $fillable = [
    'name',
    'slug',
    'price',
    'image_path',   // ← tambahkan
    'is_active',
];
```

Tambahkan juga accessor untuk mendapatkan URL langsung (opsional tapi direkomendasikan):

```php
use App\Services\FileService;

// Accessor: $product->image_url
// Pakai FileService::url() agar konsisten dengan disk logic yang sudah ada
public function getImageUrlAttribute(): ?string
{
    return app(FileService::class)->url($this->image_path);
}

// Untuk dokumen (jika ada):
public function getDocumentUrlAttribute(): ?string
{
    return app(FileService::class)->url($this->document_path);
}

// Pastikan di-append ke JSON response:
protected $appends = ['image_url'];  // tambah 'document_url' jika ada
```

> **Kenapa `FileService::url()` bukan `Storage::disk()->url()` langsung?**
> Karena `FileService::url()` sudah handle `null` dengan aman dan konsisten dengan disk yang dipakai di `store()`.

---

### Upload Step C — Update Form Requests

Ada **dua skenario** — pilih sesuai kebutuhan:

#### Skenario A: Upload Gambar (foto produk, avatar, dsb.)

**`StoreProductRequest.php`**:
```php
public function rules(): array
{
    return [
        // ... field lain ...
        'image' => ['nullable', 'image', 'max:5120', 'mimes:jpeg,png,webp'], // max 5 MB
    ];
}
```

**`UpdateProductRequest.php`** — sama persis.

#### Skenario B: Upload Dokumen (PDF, Word, Excel)

```php
// Ganti 'image' dengan 'document'
'document' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx,xls,xlsx'], // max 5 MB
```

#### Skenario C: Upload Gambar ATAU Dokumen (lampiran bebas)

```php
'attachment' => ['nullable', 'file', 'max:5120', 'mimes:jpeg,png,webp,pdf,doc,docx'], // max 5 MB
```

> **Aturan validasi file:**
> | Rule | Keterangan |
> |------|------------|
> | `'image'` | Hanya file gambar (jpeg, png, gif, bmp, webp) — validasi Laravel built-in |
> | `'file'` | Semua jenis file — gunakan ini untuk dokumen atau lampiran umum |
> | `'mimes:...'` | Batasi ekstensi spesifik yang diizinkan |
> | `'max:5120'` | Maks **5 MB** (nilai dalam KB: 5120 = 5×1024) |
>
> **Penting:** Nilai `max:` di FormRequest **harus sama** dengan `$maxKb` yang dikirim ke FileService di Step D.

---

### Upload Step D — Update Service

Inject `FileService` dan tambahkan logika file.

> **Wajib:** parameter `$maxKb` di FileService **harus sama** dengan `max:` di FormRequest.
> Default FileService adalah 2 MB — jika tidak dikirim eksplisit, file 3–5 MB akan ditolak meski lolos validasi.

#### Skenario A: Upload Gambar

```php
use App\Services\FileService;

class ProductService
{
    use FullTextSearch;

    // MIME yang diizinkan untuk gambar
    private const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public function __construct(private FileService $fileService) {}

    public function create(array $data, ?\Illuminate\Http\UploadedFile $image = null): Product
    {
        if ($image) {
            $data['image_path'] = $this->fileService->store(
                $image,
                folder: 'products',
                maxKb:  5120,              // ← wajib sesuai FormRequest max:5120
                allowed: self::IMAGE_MIMES
            );
        }

        return Product::create($data);
    }

    public function update(Product $product, array $data, ?\Illuminate\Http\UploadedFile $image = null): Product
    {
        if ($image) {
            // Hapus file lama, simpan file baru (atomik — aman jika store gagal)
            $data['image_path'] = $this->fileService->replace(
                $image,
                $product->image_path,
                folder:  'products',
                maxKb:   5120,
                allowed: self::IMAGE_MIMES
            );
        }

        $product->update($data);
        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        // Hapus file dari storage saat record dihapus
        $this->fileService->delete($product->image_path);
        $product->delete();
    }
}
```

#### Skenario B: Upload Dokumen (PDF, Word, Excel)

Ganti nama field `$image` → `$document`, dan ubah `$allowed`:

```php
// MIME yang diizinkan untuk dokumen
private const DOC_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

public function create(array $data, ?\Illuminate\Http\UploadedFile $document = null): Product
{
    if ($document) {
        $data['document_path'] = $this->fileService->store(
            $document,
            folder:  'products/docs',
            maxKb:   5120,              // ← sesuai FormRequest max:5120
            allowed: self::DOC_MIMES
        );
    }

    return Product::create($data);
}
```

> Untuk **kedua jenis sekaligus** (gambar + dokumen), tambahkan dua parameter opsional:
> `create(array $data, ?UploadedFile $image = null, ?UploadedFile $document = null)`

---

### Upload Step E — Update Controller

#### Skenario A: Upload Gambar

```php
public function store(StoreProductRequest $request, ProductService $productService): JsonResponse
{
    return ApiResponse::tryCatch(function () use ($request, $productService) {
        $product = $productService->create(
            $request->validated(),
            $request->file('image')  // null jika user tidak pilih file
        );
        return ApiResponse::success($product, 'Product created successfully', 201);
    });
}

public function update(UpdateProductRequest $request, Product $product, ProductService $productService): JsonResponse
{
    return ApiResponse::tryCatch(function () use ($request, $product, $productService) {
        $product = $productService->update(
            $product,
            $request->validated(),
            $request->file('image')
        );
        return ApiResponse::success($product, 'Product updated successfully');
    });
}
```

#### Skenario B: Upload Dokumen

Sama persis, ganti `'image'` → `'document'`:

```php
$request->file('document')  // sesuai nama field di FormRequest
```

#### Skenario C: Upload Gambar + Dokumen sekaligus

```php
public function store(StoreProductRequest $request, ProductService $productService): JsonResponse
{
    return ApiResponse::tryCatch(function () use ($request, $productService) {
        $product = $productService->create(
            $request->validated(),
            $request->file('image'),    // null jika tidak ada
            $request->file('document')  // null jika tidak ada
        );
        return ApiResponse::success($product, 'Product created successfully', 201);
    });
}
```

> Controller **tidak perlu tahu** tentang path file — semua logika simpan/hapus ada di Service.

---

### Upload Step F — Update Frontend API Service

Jika ada file upload, gunakan **`FormData`** bukan JSON biasa:

```js
// frontend/src/services/api/products.js
import api from '@/services/api/axios'

function toFormData(data) {
  const form = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      // File object — append langsung
      form.append(key, value)
    } else if (typeof value === 'boolean') {
      // Boolean harus dikonversi ke '1'/'0' — FormData tidak kenal true/false,
      // dan Laravel tidak anggap string 'false' sebagai false
      form.append(key, value ? '1' : '0')
    } else if (value !== null && value !== undefined) {
      form.append(key, value)
    }
    // null/undefined = field tidak dikirim (file tidak diubah)
  })
  return form
}

export const productsApi = {
  list:   (params)     => api.get('/products', { params }),
  get:    (id)         => api.get(`/products/${id}`),
  create: (data)       => api.post('/products', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data)   => api.post(`/products/${id}?_method=PUT`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (id)         => api.delete(`/products/${id}`),
}
```

> **Kenapa `?_method=PUT`?**
> Browser tidak support `PUT`/`PATCH` dengan `FormData`.
> Laravel membaca `_method` untuk override method (method spoofing).
>
> **Kenapa boolean dikonversi ke `'1'`/`'0'`?**
> `FormData.append(key, false)` menghasilkan string `"false"` bukan boolean.
> PHP/Laravel membaca `"false"` sebagai truthy (string tidak kosong).
> Gunakan `'1'` untuk true dan `'0'` untuk false agar Laravel bisa validasi `boolean` rule dengan benar.

---

### Upload Step G — Update Form Component

Tambahkan `FileInput` ke form. Ada tiga skenario:

#### Skenario A: Upload Gambar saja

```jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input, Toggle } from '@/components/ui/Input'
import { FileInput } from '@/components/ui/FileInput'
import { Button } from '@/components/ui/Button'

export function ProductForm({ product, onSubmit, onClose, loading }) {
  const [imageFile, setImageFile] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    setImageFile(null)  // reset file saat modal dibuka/tutup
    reset(product
      ? { name: product.name, slug: product.slug, price: product.price, is_active: Boolean(product.is_active) }
      : { name: '', slug: '', price: '', is_active: true }
    )
  }, [product, reset])

  function handleSubmitWithFile(values) {
    onSubmit({ ...values, image: imageFile })  // imageFile = null jika tidak dipilih
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitWithFile)} className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
      <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Required.' })} />
      <Input label="Price" type="number" error={errors.price?.message} {...register('price', { required: 'Required.' })} />

      {/* Foto — hanya gambar, maks 5 MB */}
      <div className="md:col-span-2">
        <FileInput
          label="Product Image"
          accept="image/jpeg,image/png,image/webp"  // sesuai mimes di FormRequest
          maxKb={5120}                               // sesuai max:5120 di FormRequest
          currentUrl={product?.image_url}            // pratinjau gambar tersimpan saat Edit
          onChange={setImageFile}
          hint="JPG, PNG, WebP. Maks 5 MB. Kosongkan jika tidak ingin mengganti."
        />
      </div>

      <div className="md:col-span-2 flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        <Button type="submit" loading={loading}>{product ? 'Update' : 'Create'} Product</Button>
      </div>
    </form>
  )
}
```

#### Skenario B: Upload Dokumen saja (PDF, Word, Excel)

```jsx
export function ProductForm({ product, onSubmit, onClose, loading }) {
  const [docFile, setDocFile] = useState(null)

  // ... useForm, useEffect seperti biasa ...

  function handleSubmitWithFile(values) {
    onSubmit({ ...values, document: docFile })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitWithFile)} ...>
      {/* ... field lain ... */}

      {/* Dokumen — PDF/Word/Excel, maks 5 MB */}
      <div className="md:col-span-2">
        <FileInput
          label="Dokumen Lampiran"
          accept=".pdf,.doc,.docx,.xls,.xlsx"    // sesuai mimes di FormRequest
          maxKb={5120}                            // sesuai max:5120 di FormRequest
          currentUrl={product?.document_url}      // tampilkan nama file tersimpan saat Edit
          onChange={setDocFile}
          hint="PDF, Word, Excel. Maks 5 MB."
        />
      </div>

      {/* ... tombol submit ... */}
    </form>
  )
}
```

#### Skenario C: Upload Gambar + Dokumen sekaligus

```jsx
export function ProductForm({ product, onSubmit, onClose, loading }) {
  const [imageFile, setImageFile]   = useState(null)
  const [docFile,   setDocFile]     = useState(null)

  useEffect(() => {
    setImageFile(null)
    setDocFile(null)  // reset keduanya saat modal dibuka
    reset({ /* ... */ })
  }, [product, reset])

  function handleSubmitWithFile(values) {
    onSubmit({ ...values, image: imageFile, document: docFile })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitWithFile)} ...>
      {/* ... field lain ... */}

      {/* Foto produk */}
      <div className="md:col-span-2">
        <FileInput
          label="Foto Produk"
          accept="image/jpeg,image/png,image/webp"
          maxKb={5120}
          currentUrl={product?.image_url}
          onChange={setImageFile}
          hint="JPG, PNG, WebP. Maks 5 MB."
        />
      </div>

      {/* Dokumen lampiran */}
      <div className="md:col-span-2">
        <FileInput
          label="Dokumen Lampiran"
          accept=".pdf,.doc,.docx"
          maxKb={5120}
          currentUrl={product?.document_url}
          onChange={setDocFile}
          hint="PDF, Word. Maks 5 MB."
        />
      </div>

      {/* ... tombol submit ... */}
    </form>
  )
}
```

> **Tips `FileInput`:**
> - `accept` — sesuaikan dengan `mimes:` di FormRequest dan `allowed` di FileService (konsisten ketiganya)
> - `maxKb` — sesuaikan dengan `max:` di FormRequest dan `maxKb` di FileService
> - `currentUrl` — gambar/URL file tersimpan dari API, tampil saat mode Edit
> - `onChange` — dipanggil dengan `File` (saat pilih) atau `null` (saat hapus/X ditekan)
> - Jika user tidak memilih file, `onChange` tidak dipanggil → nilai state tetap `null` → `null` dikirim ke API → service tidak akan mengubah file yang ada

---

### Upload Step H — Pastikan Storage Link Sudah Dibuat

Jalankan sekali saat setup project (atau deploy pertama kali):

```bash
php artisan storage:link
```

Ini membuat symlink `public/storage` → `storage/app/public` agar file bisa diakses via URL.

---

<a name="bagian-3"></a>
## Bagian 3 — Checklist Cepat

### Fitur Tanpa Upload
- [ ] Migration (indexes + fullText)
- [ ] Model (fillable, casts, relations)
- [ ] Service (FullTextSearch trait, paginate/create/update/delete)
- [ ] StoreRequest + UpdateRequest
- [ ] Controller
- [ ] Routes di `api.php` (dengan permission middleware)
- [ ] Seeder (permissions + menu) → `migrate:fresh --seed`
- [ ] `products.js` di `services/api/`
- [ ] `ProductForm.jsx`
- [ ] `ProductsPage.jsx`
- [ ] Route di `App.jsx`

### Tambahan untuk Upload
- [ ] Kolom `_path` di migration (`nullable string`) — satu kolom per file
- [ ] Accessor `getXxxUrlAttribute()` di Model pakai `app(FileService::class)->url()` + `$appends`
- [ ] Rule di FormRequest: `'image'` / `'file'`, `'mimes:...'`, **`'max:5120'`** (5 MB)
- [ ] Inject `FileService` ke Service, pass **`maxKb: 5120`** secara eksplisit (wajib sesuai FormRequest)
- [ ] `toFormData()` + `multipart/form-data` di API service JS
- [ ] `FileInput` di Form: set `accept`, `maxKb={5120}`, `currentUrl`, `onChange`
- [ ] **`php artisan storage:link`** (sekali saja saat setup/deploy)

---

## Tips Penting

| Situasi | Yang Harus Diingat |
|---|---|
| Kolom baru untuk search | Masuk `fullText()` di migration + parameter `applySearch()` di service |
| **Upload: validasi tidak sinkron** | `max:` di FormRequest, `maxKb` di FileService, dan `maxKb` di `FileInput` **harus sama** (default FileService = 2048, bukan 5120) |
| **Upload: jenis file** | `mimes:` di FormRequest, `allowed` di FileService, `accept` di `FileInput` harus konsisten |
| File dihapus / record dihapus | Wajib panggil `fileService->delete()` di service, bukan controller |
| Model accessor file | Pakai `app(FileService::class)->url($this->xxx_path)` — aman untuk `null` |
| Relasi baru di response | Gunakan `->with('relation')` di query, bukan lazy load |
| Permission baru | Tambah di seeder, assign ke role yang sesuai |
| Cache sidebar perlu direset | Jika menu baru ditambah → jalankan `php artisan cache:clear` |
