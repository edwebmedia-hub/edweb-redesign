param([string]$dir, [int]$maxW = 1600, [long]$quality = 74)
Add-Type -AssemblyName System.Drawing
Get-ChildItem $dir -Filter *.jpg | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  if ($img.Width -gt $maxW) {
    $ratio = $maxW / $img.Width
    $newW = $maxW; $newH = [int]($img.Height * $ratio)
  } else { $newW = $img.Width; $newH = $img.Height }
  $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $newW, $newH)
  $img.Dispose()
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
  $tmp = $_.FullName + ".tmp"
  $bmp.Save($tmp, $codec, $params)
  $g.Dispose(); $bmp.Dispose()
  Move-Item $tmp $_.FullName -Force
}
Get-ChildItem $dir -Filter *.jpg | Select-Object Name, @{N='KB';E={[math]::Round($_.Length/1KB)}}
