<#
.SYNOPSIS
    Copy Tutelar release files from Server02 to the local Tutelar folder.
.DESCRIPTION
    This script automates the copying of Tutelar release files from a network
    share to a local directory using Robocopy. It provides detailed feedback
    to the user about the progress, new files copied, and any discrepancies
    like extra files in the destination or files that could not be copied.

    The script ensures robust error handling and clear communication for
    a controlled and efficient file synchronization process.
.PARAMETER SourceRoot
    The root path on the network server where Tutelar release files are located.
    Defaults to '\\Server02\data\tutelar\release'.
.PARAMETER DestRoot
    The root path on the local machine where Tutelar files should be copied.
    Defaults to 'C:\Tutelar'.
#>
[CmdletBinding(SupportsShouldProcess=$true, ConfirmImpact='High')]
param(
    [string]$SourceRoot = '\\Server02\data\tutelar\release',
    [string]$DestRoot   = 'C:\Tutelar'
)

# --- Global Variables for Accumulating Results ---
# This variable accumulates all Robocopy exit code flags across all copy jobs.
# Robocopy uses specific exit codes as bit flags (e.g., 1 for files copied, 2 for extra files, 8 for errors).
$script:RobocopyExitCodeFlags = 0
# Stores a list of paths for new or newer files that were copied to the destination.
$script:NewFiles              = @()
# Stores a list of paths for files that exist in the destination but not in the source.
$script:ExtraFiles            = @()

# --- Configuration ---
# Path to the Robocopy executable.
$robocopyExe  = Join-Path $env:WINDIR 'SysWOW64\Robocopy.exe'
# Common parameters applied to all Robocopy calls.
$commonParams = @(
    '/s',          # Copy Subdirectories, but not empty ones.
    '/r:0',        # Number of Retries on failed copies: 0 (no retries).
    '/fft',        # Assume Fat File Times (2-second granularity) for faster comparisons.
    '/j',          # Copy ACLs (Access Control Lists) for security.
    '/xo',         # Exclude Older files (if destination is newer). This ensures newer files in destination are not overwritten by older source files.
    '/xj',         # Exclude Junction points.
    '/w:5',        # Wait Time between Retries: 5 seconds (not applicable with /r:0 but good practice for other scenarios).
    '/njh',        # No Job Header (suppress the header in Robocopy's output).
    '/ndl',        # No Directory List (don't list directories in Robocopy's output, only files).
    '/njs',        # No Job Summary (suppress the final summary in Robocopy's output).
    '/copy:dt'     # What to COPY for files (Data, Timestamps).
)
# File extensions to include in the copy operation.
$extensions   = '*.php','*.html','*.css','*.js','*.json','*.ini'

# --- Functions ---

function Invoke-CopyJob {
<#
.SYNOPSIS
    Invokes Robocopy for a specific source-destination pair and parses its output.
.DESCRIPTION
    This function executes Robocopy with the specified source, destination,
    and additional parameters. It captures the Robocopy output and exit code,
    then parses the output to identify new files copied and extra files
    found in the destination. It updates global script-scope variables
    for aggregated reporting.

    Error handling is included to manage non-zero Robocopy exit codes and
    PowerShell-level exceptions.
.PARAMETER Source
    The source directory for Robocopy.
.PARAMETER Destination
    The destination directory for Robocopy.
.PARAMETER ExtraParams
    An array of additional parameters to pass directly to Robocopy for this job.
    This is useful for job-specific exclusions (e.g., `/XD` for excluding directories).
#>
    [CmdletBinding()]
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExtraParams = @()
    )

    # Check if the source path exists before proceeding with Robocopy.
    if (-not (Test-Path $Source)) {
        Write-Warning "Source path '$Source' does not exist. Skipping this job."
        # Update exit code flag to indicate a problem if source is missing
        $script:RobocopyExitCodeFlags = $script:RobocopyExitCodeFlags -bor 16 # Treat as a serious error
        return # Exit the function for this job.
    }
    # Check if the destination path exists; create it if it doesn't.
    if (-not (Test-Path $Destination)) {
        Write-Host "Destination path '$Destination' does not exist. Creating it..." -ForegroundColor Yellow
        try {
            New-Item -ItemType Directory -Path $Destination -Force | Out-Null
        } catch {
            Write-Error "Failed to create destination directory '$Destination': $($_.Exception.Message)"
            $script:RobocopyExitCodeFlags = $script:RobocopyExitCodeFlags -bor 16 # Treat as a serious error
            return # Exit the function if destination cannot be created.
        }
    }

    Write-Host "Starting copy job: '$Source' -> '$Destination'..." -ForegroundColor Cyan

    # Construct the full list of arguments for Robocopy.
    # This includes source, destination, file extensions, common parameters, and job-specific extra parameters.
    $robocopyArgs = @($Source, $Destination) + $extensions + $commonParams + $ExtraParams
    Write-Verbose "Robocopy command: '$robocopyExe $($robocopyArgs -join ' ')'"

    try {
        # Execute Robocopy. '2>&1' redirects standard error (stderr) to standard output (stdout)
        # so that all Robocopy messages (including errors) are captured in the $output variable.
        $output = & $robocopyExe @robocopyArgs 2>&1 | Out-String

        # Capture Robocopy's exit code from the $LASTEXITCODE automatic variable.
        # Robocopy uses specific exit codes as bit flags:
        # 0: No files copied. No failure.
        # 1: One or more files copied successfully.
        # 2: Some extra files or directories encountered.
        # 4: Some mismatched files or directories encountered.
        # 8: Some files or directories could not be copied (access denied, network issues, etc.).
        # 16: Serious error. Robocopy did not copy any files.
        $exitCode = $LASTEXITCODE

        # Accumulate all exit code flags for a comprehensive final summary.
        # The bitwise OR operator (-bor) ensures all relevant flags are retained.
        $script:RobocopyExitCodeFlags = $script:RobocopyExitCodeFlags -bor $exitCode

        Write-Verbose "Robocopy exit code for '$Source': $exitCode"

        # Parse Robocopy's output line by line to identify new and extra files.
        $outputLines = $output -split "`r?`n" # Split output into individual lines.
        foreach ($line in $outputLines) {
            # Regex to find lines indicating new files or newer versions of files.
            if ($line -match '\s+(?:New File|Newer)\s+(?<file>.+)$') {
                $filePath = Join-Path $Destination $Matches.file.Trim()
                # Only add if not already present to avoid duplicates from multiple jobs.
                if ($script:NewFiles -notcontains $filePath) {
                    $script:NewFiles += $filePath
                    Write-Verbose "Found new/newer file: $filePath"
                }
            }
            # Regex to find lines indicating extra files (files present in destination but not source).
            elseif ($line -match '\s+\*EXTRA File\s+(?<file>.+)$') {
                $filePath = Join-Path $Destination $Matches.file.Trim()
                # Only add if not already present to avoid duplicates.
                if ($script:ExtraFiles -notcontains $filePath) {
                    $script:ExtraFiles += $filePath
                    Write-Verbose "Found extra file: $filePath"
                }
            }
        }

        # Provide immediate user feedback for critical Robocopy errors.
        if (($exitCode -band 8) -or ($exitCode -band 16)) {
            Write-Warning "Robocopy reported critical errors while copying '$Source'. Exit Code: $exitCode"
            Write-Host "Robocopy Output for critical error: `n$output" -ForegroundColor Red
        } elseif ($exitCode -band 4) {
             Write-Warning "Robocopy reported mismatched files while copying '$Source'. Exit Code: $exitCode"
             Write-Verbose "Robocopy Output: `n$output" # Only show verbose for mismatches to keep output clean.
        }

    } catch {
        # Catch any PowerShell exceptions during Robocopy execution (e.g., command not found).
        Write-Error "An unexpected error occurred during Robocopy execution for '$Source': $($_.Exception.Message)"
        # Set a critical flag if an exception occurs to ensure script exits with an error.
        $script:RobocopyExitCodeFlags = $script:RobocopyExitCodeFlags -bor 16 # Treat as serious error
    }
    Write-Host "Finished copy job: '$Source' -> '$Destination'." -ForegroundColor DarkCyan
}

# --- Main Script Logic ---

Write-Host "Beginning Tutelar release file synchronization..." -ForegroundColor Green
Write-Host "Source Root: $SourceRoot"
Write-Host "Destination Root: $DestRoot`n"

# Define the individual copy jobs. Each job specifies a sub-source and sub-destination
# relative to the root paths, and any additional Robocopy parameters specific to that job.
$jobs = @(
    @{ Source='Spiderworks';            Dest='Spiderworks';            Extra=@('/XD','applications','pages') },
    @{ Source='Ujigami';                Dest='Ujigami';                Extra=@() },
    @{ Source='modules';                Dest='modules';                Extra=@() },
    @{ Source='apps';                   Dest='apps';                   Extra=@() },
    @{ Source='Spiderworks\applications'; Dest='Spiderworks\applications'; Extra=@('/XD','wms') }, # Exclude 'wms' subdirectory within applications.
    @{ Source='Spiderworks\pages\home'; Dest='Spiderworks\pages\home'; Extra=@() },
    @{ Source='Spiderworks\pages\admin'; Dest='Spiderworks\pages\admin'; Extra=@() },
    @{ Source='Spiderworks\pages\production'; Dest='Spiderworks\pages\production'; Extra=@() },
    @{ Source='Spiderworks\pages\quality'; Dest='Spiderworks\pages\quality'; Extra=@() },
    @{ Source='Spiderworks\pages\webservice'; Dest='Spiderworks\pages\webservice'; Extra=@() }
)

# Ensure the main destination root directory exists.
if (-not (Test-Path $DestRoot)) {
    Write-Host "Main destination root '$DestRoot' does not exist. Attempting to create it..." -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $DestRoot -Force | Out-Null
    } catch {
        Write-Error "Failed to create main destination directory '$DestRoot'. Aborting script."
        exit 1 # Exit immediately if the main destination cannot be created.
    }
}

# Iterate through each defined copy job and invoke the Invoke-CopyJob function.
$jobCount = 1 # Counter for current job progress.
foreach ($job in $jobs) {
    Write-Host "`n--- Processing Job $jobCount of $($jobs.Count) ---" -ForegroundColor Yellow
    # Construct the full source and destination paths for the current job.
    $srcPath = Join-Path $SourceRoot $job.Source
    $dstPath = Join-Path $DestRoot $job.Dest

    # Call the function to perform the copy for the current job.
    Invoke-CopyJob -Source $srcPath -Destination $dstPath -ExtraParams $job.Extra
    $jobCount++ # Increment job counter.
}

# --- Final Synchronization Summary ---
Write-Host "`n--- Synchronization Summary ---" -ForegroundColor Green

# Determine overall status based on accumulated Robocopy exit code flags.
$hadErrors       = ($script:RobocopyExitCodeFlags -band 8) -or ($script:RobocopyExitCodeFlags -band 16)
$hadMismatched   = ($script:RobocopyExitCodeFlags -band 4)
$hadNewFiles     = ($script:RobocopyExitCodeFlags -band 1)
$hadExtraFiles   = ($script:RobocopyExitCodeFlags -band 2)

# Report critical errors if any occurred.
if ($hadErrors) {
    Write-Warning "*** CRITICAL WARNING: Some files or directories could not be copied due to errors! Please review the logs above. ***"
}

# Report mismatched files if any occurred.
if ($hadMismatched) {
    Write-Warning "*** WARNING: Some files/directories were mismatched (different timestamps/sizes). Robocopy skipped copying these. ***"
}

# Report new/newer files copied.
if ($script:NewFiles.Count -gt 0) {
    Write-Host "Total New/Newer Files Copied: $($script:NewFiles.Count)" -ForegroundColor Green
    Write-Host 'List of new/newer files:'
    $script:NewFiles | ForEach-Object { Write-Host "  $_" } # List each new file.
} else {
    Write-Host "No new or newer files were copied during this synchronization." -ForegroundColor DarkYellow
}

# Report extra files found in the destination.
if ($script:ExtraFiles.Count -gt 0) {
    Write-Host "Total Extra Files in Destination: $($script:ExtraFiles.Count)" -ForegroundColor Yellow
    Write-Host 'List of extra files:'
    $script:ExtraFiles | ForEach-Object { Write-Host "  $_" } # List each extra file.
} else {
    Write-Host "No extra files found in the destination." -ForegroundColor DarkYellow
}

Write-Host "`nSynchronization complete." -ForegroundColor Green

# Set the final script exit code.
# An exit code of 0 indicates success, any other value indicates failure.
if ($hadErrors) {
    Write-Host "Script exiting with code 1 (indicating critical errors during synchronization)." -ForegroundColor Red
    exit 1 # Indicate failure.
} else {
    Write-Host "Script exiting with code 0 (synchronization successful or only minor issues)." -ForegroundColor Green
    exit 0 # Indicate success.
}
