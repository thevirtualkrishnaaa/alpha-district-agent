# Reliable Firebase secret setter. Lets you paste the value at a VISIBLE prompt
# so you can confirm it landed, then writes it to a temp file (UTF-8, no BOM, no
# trailing newline) and sets the secret from that file. Temp file is deleted.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\set-secret.ps1 OPENAI_API_KEY

param([Parameter(Mandatory = $true)][string]$Name)
$ErrorActionPreference = "Stop"

$v = (Read-Host "Paste value for $Name").Trim()
if ([string]::IsNullOrWhiteSpace($v)) { throw "No value entered - nothing pasted." }
Write-Host ("Captured {0} characters." -f $v.Length) -ForegroundColor DarkGray

$tmp = Join-Path $env:TEMP ("sec_" + [guid]::NewGuid().ToString() + ".txt")
[System.IO.File]::WriteAllText($tmp, $v)  # UTF-8 without BOM, no trailing newline
try {
  firebase functions:secrets:set $Name --data-file $tmp
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}
