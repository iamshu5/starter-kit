<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FileService
{
    public function store(
        UploadedFile $file,
        string $folder,
        string $disk = 'public',
        int $maxKb = 5120,
        array $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    ): string {
        $this->validateFile($file, $maxKb, $allowed);

        return $file->store($folder, $disk);
    }

    public function delete(?string $path, string $disk = 'public'): void
    {
        if ($path && Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    public function replace(
        UploadedFile $newFile,
        ?string $oldPath,
        string $folder,
        string $disk = 'public',
        int $maxKb = 5120,
        array $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    ): string {
        $newPath = $this->store($newFile, $folder, $disk, $maxKb, $allowed);
        $this->delete($oldPath, $disk);

        return $newPath;
    }

    public function url(?string $path, string $disk = 'public'): ?string
    {
        if (! $path) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $storage */
        $storage = Storage::disk($disk);
        return $storage->url($path);
    }

    private function validateFile(UploadedFile $file, int $maxKb, array $allowed): void
    {
        if ($file->getSize() > $maxKb * 1024) {
            throw ValidationException::withMessages([
                'file' => ["Ukuran file tidak boleh lebih dari {$maxKb} KB."],
            ]);
        }

        if (! empty($allowed) && ! in_array($file->getMimeType(), $allowed, strict: true)) {
            $types = implode(', ', array_map(fn($m) => explode('/', $m)[1], $allowed));
            throw ValidationException::withMessages([
                'file' => ["Format file tidak didukung. Gunakan: {$types}."],
            ]);
        }
    }
}
