# Escribe el contenido del portapapeles en una variable de .env.local sin mostrarlo.
# Uso: powershell -File scripts/set-env-from-clipboard.ps1 NOMBRE_VARIABLE
param([Parameter(Mandatory)][string]$Name)

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$value = (Get-Clipboard -Raw).Trim()

if (-not $value) { Write-Error "El portapapeles está vacío."; exit 1 }
if ($value -match '\s') { Write-Error "El portapapeles tiene espacios o saltos de línea; copia solo la clave."; exit 1 }

$lines = Get-Content $envFile -Encoding utf8
if (-not ($lines -match "^$Name=")) { Write-Error "No existe $Name en .env.local"; exit 1 }
$lines = $lines | ForEach-Object { if ($_ -match "^$Name=") { "$Name=$value" } else { $_ } }
[IO.File]::WriteAllLines((Resolve-Path $envFile), [string[]]$lines, (New-Object Text.UTF8Encoding $false))

# Solo se informa el tipo de clave, nunca su valor.
$role = "desconocido"
if ($value -match '^sb_(publishable|secret)_') { $role = $Matches[1] }
elseif ($value -match '^eyJ') {
  try {
    $p = $value.Split('.')[1].Replace('-', '+').Replace('_', '/')
    while ($p.Length % 4) { $p += '=' }
    $role = ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p)) | ConvertFrom-Json).role
  } catch {}
}
Set-Clipboard -Value " "
"$Name guardada (longitud $($value.Length), tipo: $role). Portapapeles limpiado."
