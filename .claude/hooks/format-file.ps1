$ErrorActionPreference = "SilentlyContinue"

$raw = [Console]::In.ReadToEnd()
if (-not $raw) { exit 0 }

try {
    $event = $raw | ConvertFrom-Json
} catch {
    exit 0
}

$filePath = $event.tool_input.file_path
if (-not $filePath) { exit 0 }
if (-not (Test-Path -LiteralPath $filePath)) { exit 0 }

$fullPath = (Resolve-Path -LiteralPath $filePath).Path
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..")).Path

# Solo procesar archivos dentro del proyecto, fuera de carpetas ignoradas.
if (-not $fullPath.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) { exit 0 }
if ($fullPath -match '\\(node_modules|\.next|references|out|build)\\') { exit 0 }

$extension = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()

$prettierExtensions = @(".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md", ".json", ".css")
$eslintExtensions = @(".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")

Push-Location $projectRoot
try {
    if ($prettierExtensions -contains $extension) {
        npx prettier --write $fullPath | Out-Null
    }
    if ($eslintExtensions -contains $extension) {
        npx eslint --fix $fullPath | Out-Null
    }
} finally {
    Pop-Location
}

exit 0
