# Generates CreatorForge public + extension PNG icons
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$publicDir = Join-Path $root "public"
$iconsDir = Join-Path $root "extension\icons"
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-CfIcon {
  param([int]$Width, [int]$Height, [string]$Path, [string]$Text = "CF")
  $bmp = New-Object System.Drawing.Bitmap $Width, $Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($Width, $Height),
    [System.Drawing.Color]::FromArgb(255, 139, 92, 246),
    [System.Drawing.Color]::FromArgb(255, 217, 70, 239)
  )
  $g.FillRectangle($brush, 0, 0, $Width, $Height)
  $fontSize = [math]::Max(8, [int]([math]::Min($Width, $Height) * 0.34))
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($Text, $font, [System.Drawing.Brushes]::White, [System.Drawing.RectangleF]::new(0, 0, $Width, $Height), $sf)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-CfIcon 180 180 (Join-Path $publicDir "apple-touch-icon.png")
New-CfIcon 1200 630 (Join-Path $publicDir "og-image.png") "CreatorForge"
New-CfIcon 16 16 (Join-Path $iconsDir "icon16.png")
New-CfIcon 48 48 (Join-Path $iconsDir "icon48.png")
New-CfIcon 128 128 (Join-Path $iconsDir "icon128.png")
Write-Host "Icons written to public/ and extension/icons/"
