# Script to add .ts extension to all relative imports in TypeScript files

$rootPath = Join-Path $PSScriptRoot "..\regolith\filters_data\modular_mc\educator_tools\logic"

# Get all TypeScript files recursively
$tsFiles = Get-ChildItem -Path $rootPath -Filter "*.ts" -Recurse

$totalFiles = $tsFiles.Count
$filesModified = 0
$totalReplacements = 0

Write-Host "Found $totalFiles TypeScript files to process..." -ForegroundColor Cyan

foreach ($file in $tsFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Pattern to match relative imports without .ts extension
    # Matches: import ... from "./something" or "../something"
    # Does NOT match: import ... from "@package/name" or "./something.ts"
    $pattern = '(import\s+(?:[\w{},\s*]+\s+from\s+)?[''"])(\.\.?/[^''"]+?)(?<!\.ts)([''"])'
    
    # Replace with .ts extension added
    $newContent = [regex]::Replace($content, $pattern, '$1$2.ts$3')
    
    # Check if any changes were made
    if ($newContent -ne $originalContent) {
        # Count the number of replacements
        $matches = [regex]::Matches($content, $pattern)
        $fileReplacements = $matches.Count
        
        # Write the modified content back to the file
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        
        $filesModified++
        $totalReplacements += $fileReplacements
        
        $relativePath = $file.FullName.Replace($rootPath, "").TrimStart('\')
        Write-Host "Modified: $relativePath ($fileReplacements imports)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Files processed: $totalFiles" -ForegroundColor White
Write-Host "  Files modified: $filesModified" -ForegroundColor Green
Write-Host "  Total imports updated: $totalReplacements" -ForegroundColor Green
Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
