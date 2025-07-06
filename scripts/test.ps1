param(
    [string]$Message = "Default Message",
    [int]$Repeat = 1
)

Write-Host "PowerShell script started."
Write-Host "Message: $Message"
Write-Host "Repeat: $Repeat"

for ($i = 0; $i -lt $Repeat; $i++) {
    Write-Host "Line $($i+1)"
}

# Write-Error "This is a test error stream message." # To test stderr
# Exit 0 # Success
# Exit 1 # Failure
Write-Host "PowerShell script finished."
