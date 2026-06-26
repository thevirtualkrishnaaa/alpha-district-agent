# Derives IG_ACCESS_TOKEN (long-lived) and IG_USER_ID from an Instagram-login
# token (starts with IGAA / IGQ) generated in the app's "API setup with
# Instagram login" page. Reads the token from scripts\token.txt.
# Everything runs locally - nothing is sent anywhere except Instagram's API.

$ErrorActionPreference = "Stop"

$tokenFile = Join-Path $PSScriptRoot "token.txt"
if (-not (Test-Path $tokenFile)) {
  throw "Create scripts\token.txt, paste your Instagram token into it, save, then re-run."
}
$tok = (Get-Content $tokenFile -Raw).Trim()
# Strip any hidden prefix (e.g. a UTF-8 BOM) by starting at the token marker.
$idx = $tok.IndexOf('IGAA'); if ($idx -lt 0) { $idx = $tok.IndexOf('IGQ') }
if ($idx -lt 0) { throw "No Instagram token (IGAA.../IGQ...) found in token.txt. Re-copy it." }
if ($idx -gt 0) { $tok = $tok.Substring($idx) }
$tok = $tok.Trim()
Write-Host ("Token length: {0}, starts with: {1}" -f $tok.Length, $tok.Substring(0,4)) -ForegroundColor DarkGray

$igSecret = (Read-Host "Enter your INSTAGRAM app secret (on the API setup page - NOT the main app secret)").Trim()

# Upgrade to a 60-day long-lived token (works if the current token is short-lived).
$long = $tok
try {
  $r = Invoke-RestMethod -Method Get -Uri "https://graph.instagram.com/access_token" -Body @{
    grant_type    = "ig_exchange_token"
    client_secret = $igSecret
    access_token  = $tok
  }
  if ($r.access_token) {
    $long = $r.access_token
    Write-Host ("Got 60-day long-lived token (expires in {0} days)." -f [math]::Round($r.expires_in / 86400)) -ForegroundColor Green
  }
} catch {
  Write-Host "Exchange skipped (token may already be long-lived). Using the token as-is." -ForegroundColor Yellow
}

Write-Host "Fetching your Instagram account id..." -ForegroundColor Cyan
$me = Invoke-RestMethod -Method Get -Uri "https://graph.instagram.com/me" -Body @{
  fields       = "user_id,username"
  access_token = $long
}
$igId  = $me.user_id
$uname = $me.username
if (-not $igId) { throw "Could not fetch user_id - the token may be invalid or missing permissions. Regenerate it." }

Write-Host "`n==================== RESULTS ====================" -ForegroundColor Green
Write-Host "IG_USER_ID      = $igId   (username: $uname)"
Write-Host "IG_ACCESS_TOKEN = (the token below - keep private)"
Write-Host $long -ForegroundColor Yellow
Write-Host "================================================`n"
Write-Host "Share ONLY the IG_USER_ID with Claude. Keep the token private."
Write-Host "You can delete scripts\token.txt now."
