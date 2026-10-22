# File: scripts/pack-build.ps1
# Skrip pengemasan paket standalone build untuk hosting cPanel

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$standaloneDir = Join-Path $projectRoot ".next\standalone"
$staticSource = Join-Path $projectRoot ".next\static"
$publicSource = Join-Path $projectRoot "public"
$zipOutput = Join-Path $projectRoot "rohkris-build.zip"

if (-not (Test-Path $standaloneDir)) {
    Write-Error "Direktori .next/standalone tidak ditemukan. Jalankan 'npm run build' terlebih dahulu."
    exit 1
}

Write-Host "Menyiapkan berkas static dan public di dalam .next/standalone..."

# 1. Pastikan folder .next/standalone/.next/static lengkap
$standaloneNextStatic = Join-Path $standaloneDir ".next\static"
if (-not (Test-Path $standaloneNextStatic)) {
    New-Item -ItemType Directory -Path $standaloneNextStatic -Force | Out-Null
}
if (Test-Path $staticSource) {
    Copy-Item -Recurse -Force (Join-Path $staticSource "*") $standaloneNextStatic
}

# 2. Pastikan folder .next/standalone/public lengkap
$standalonePublic = Join-Path $standaloneDir "public"
if (-not (Test-Path $standalonePublic)) {
    New-Item -ItemType Directory -Path $standalonePublic -Force | Out-Null
}
if (Test-Path $publicSource) {
    Copy-Item -Recurse -Force (Join-Path $publicSource "*") $standalonePublic
}

# 3. Bersihkan berkas sensitif atau tidak perlu dari .next/standalone bila ada
$excludePatterns = @(
    ".env*",
    "kredensial_hosting.txt",
    "storage",
    "tests",
    "Rohkris_Pelita_Nusantara_Docs",
    "app\api"
)

foreach ($pattern in $excludePatterns) {
    $target = Join-Path $standaloneDir $pattern
    if (Test-Path $target) {
        Remove-Item -Recurse -Force $target -ErrorAction SilentlyContinue
    }
}

# 4. Hapus arsip zip lama bila sudah ada
if (Test-Path $zipOutput) {
    Remove-Item -Force $zipOutput
}

# 5. Buat file zip menggunakan tar.exe bawaan Windows (menghasilkan path ber-slash maju '/')
Write-Host "Mengompresi .next/standalone dan public menggunakan tar.exe..."
Push-Location $projectRoot
try {
    tar.exe -a -c -f "rohkris-build.zip" .next/standalone public
}
finally {
    Pop-Location
}

if (-not (Test-Path $zipOutput)) {
    Write-Error "Gagal membuat berkas $zipOutput"
    exit 1
}

$file = Get-Item $zipOutput
$sizeMb = [math]::Round($file.Length / 1MB, 2)
Write-Host "Paket build berhasil dibuat: $($file.Name) ($sizeMb MB)"
