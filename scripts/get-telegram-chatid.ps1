# Finds your TELEGRAM_CHAT_ID. Send any message to your bot FIRST, then run this.
$ErrorActionPreference = "Stop"
$bot = (Read-Host "Paste your Telegram BOT token (from BotFather)").Trim()
Write-Host "Reading updates... (make sure you've messaged your bot first)" -ForegroundColor Cyan
$u = Invoke-RestMethod "https://api.telegram.org/bot$bot/getUpdates"
if (-not $u.result -or $u.result.Count -eq 0) {
  throw "No messages found. Open Telegram, send any message to your bot, then re-run this."
}
$last = $u.result[-1].message
Write-Host "`nTELEGRAM_CHAT_ID = $($last.chat.id)   ($($last.chat.first_name) $($last.chat.username))" -ForegroundColor Green
Write-Host "Use this value for the TELEGRAM_CHAT_ID secret."
