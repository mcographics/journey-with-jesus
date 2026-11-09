Add-Type -AssemblyName System.Drawing

$repositoryRoot = Split-Path $PSScriptRoot -Parent
$sourcePath = Join-Path $repositoryRoot 'source-assets\kerygma-path-favicon-source.png'
$appDirectory = Join-Path $repositoryRoot 'src\app'
$source = [System.Drawing.Image]::FromFile($sourcePath)

function New-PngBytes {
  param([Parameter(Mandatory)][int]$Size)

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $memory = New-Object System.IO.MemoryStream
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $Size, $Size))
    $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
    return ,$memory.ToArray()
  } finally {
    $memory.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

try {
  if ($source.Width -ne $source.Height) {
    throw "Favicon source must be square; found $($source.Width)x$($source.Height)."
  }

  $pngTargets = @(
    @{ Name = 'icon1.png'; Size = 16 },
    @{ Name = 'icon2.png'; Size = 32 },
    @{ Name = 'icon3.png'; Size = 48 },
    @{ Name = 'icon4.png'; Size = 192 },
    @{ Name = 'icon5.png'; Size = 512 },
    @{ Name = 'apple-icon.png'; Size = 180 }
  )

  foreach ($target in $pngTargets) {
    [System.IO.File]::WriteAllBytes((Join-Path $appDirectory $target.Name), (New-PngBytes -Size $target.Size))
  }

  $svgPng = [Convert]::ToBase64String((New-PngBytes -Size 128))
  $svg = "<svg xmlns=`"http://www.w3.org/2000/svg`" viewBox=`"0 0 128 128`"><image href=`"data:image/png;base64,$svgPng`" width=`"128`" height=`"128`" preserveAspectRatio=`"xMidYMid meet`"/></svg>"
  [System.IO.File]::WriteAllText((Join-Path $appDirectory 'icon.svg'), $svg, [System.Text.UTF8Encoding]::new($false))

  $icoSizes = @(16, 32, 48, 256)
  $icoFrames = foreach ($size in $icoSizes) {
    [pscustomobject]@{ Size = $size; Bytes = (New-PngBytes -Size $size) }
  }

  $iconStream = New-Object System.IO.MemoryStream
  $writer = New-Object System.IO.BinaryWriter($iconStream)
  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$icoFrames.Count)

    $imageOffset = 6 + (16 * $icoFrames.Count)
    foreach ($frame in $icoFrames) {
      $dimension = if ($frame.Size -eq 256) { [byte]0 } else { [byte]$frame.Size }
      $writer.Write($dimension)
      $writer.Write($dimension)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$frame.Bytes.Length)
      $writer.Write([UInt32]$imageOffset)
      $imageOffset += $frame.Bytes.Length
    }

    foreach ($frame in $icoFrames) {
      $writer.Write([byte[]]$frame.Bytes)
    }
    $writer.Flush()
    [System.IO.File]::WriteAllBytes((Join-Path $appDirectory 'favicon.ico'), $iconStream.ToArray())
  } finally {
    $writer.Dispose()
    $iconStream.Dispose()
  }
} finally {
  $source.Dispose()
}

Write-Output 'Generated favicon assets from source-assets/kerygma-path-favicon-source.png.'