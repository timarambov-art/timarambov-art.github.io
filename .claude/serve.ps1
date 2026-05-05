$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $root

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:5500/')
$listener.Start()
Write-Host "Serving $root on http://localhost:5500"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $rel = [System.Web.HttpUtility]::UrlDecode($req.Url.AbsolutePath.TrimStart('/'))
    if (-not $rel) { $rel = 'index.html' }
    $full = Join-Path $root $rel
    if (Test-Path $full -PathType Container) { $full = Join-Path $full 'index.html' }
    if (Test-Path $full -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = $mime[$ext]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.Close()
  } catch {
    Write-Host "ERR: $($_.Exception.Message)"
  }
}
