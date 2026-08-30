Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.Color]::Transparent)

$dark  = [System.Drawing.Color]::FromArgb(255,15,23,42)
$green = [System.Drawing.Color]::FromArgb(255,34,197,94)
$white = [System.Drawing.Color]::White

$g.FillEllipse((New-Object System.Drawing.SolidBrush($dark)), 4, 4, 248, 248)
$ringPen = New-Object System.Drawing.Pen($green, 10)
$g.DrawEllipse($ringPen, 14, 14, 228, 228)

# Kalkan gövdesi
$shieldPts  = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(78, 72),
  [System.Drawing.PointF]::new(178, 72),
  [System.Drawing.PointF]::new(178, 138),
  [System.Drawing.PointF]::new(128, 204),
  [System.Drawing.PointF]::new(78, 138)
)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddPolygon($shieldPts)
$g.FillPath((New-Object System.Drawing.SolidBrush($green)), $path)

# Onay işareti
$checkPen = New-Object System.Drawing.Pen($white, 12)
$checkPen.StartCap = 'Round'
$checkPen.EndCap   = 'Round'
$checkPts = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new(102, 134),
  [System.Drawing.PointF]::new(121, 156),
  [System.Drawing.PointF]::new(158, 106)
)
$g.DrawLines($checkPen, $checkPts)

# PNG üret
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray()

# ICO konteyneri (PNG payload'lı)
$icoMs = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($icoMs)
$w.Write([uint16]0)          # reserved
$w.Write([uint16]1)          # type: icon
$w.Write([uint16]1)          # count
$w.Write([byte]0); $w.Write([byte]0)      # width/height 0 = 256
$w.Write([byte]0); $w.Write([byte]0)      # colors, reserved
$w.Write([uint16]1)          # planes
$w.Write([uint16]32)         # bpp
$w.Write([uint32]$png.Length)  # resource byte size = PNG data
$w.Write([uint32]22)         # offset
$w.Write($png)
[System.IO.File]::WriteAllBytes("$PWD\icons\icon.ico", $icoMs.ToArray())
Write-Output "icon.ico: $((Get-Item icons\icon.ico).Length) bayt"
