
#--------------------------------------------------------------------------
# Manage custom routes from a file.
#--------------------------------------------------------------------------
param(
    [ValidateSet('add','remove','print')]
    [string]$Action = 'add',
    [string]$FilePath,
    [System.Net.IPAddress]$GatewayAddress = [System.Net.IPAddress]::Parse('172.25.26.1'),
    [System.Net.IPAddress]$InterfaceIPAddress = [System.Net.IPAddress]::Parse('172.25.26.89'),
    [ValidateRange(1,9999)]
    [int]$RouteMetric,
    [switch]$Persistent
)

function Get-DestinationPrefixes {
    param([string]$Path)
    if (-not (Test-Path -Path $Path -PathType Leaf)) {
        throw "IP address file not found at path: $Path"
    }
    return Get-Content -Path $Path | ForEach-Object {
        $line = $_.Trim()
        $entryPart = ($line -split '#')[0].Trim()
        if ($entryPart -and $entryPart -match '^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\/([0-9]{1,2})$') {
            $ip = $Matches[1]
            $prefix = [int]$Matches[2]
            if ($prefix -ge 0 -and $prefix -le 32) { "$ip/$prefix" }
        }
    } | Where-Object { $_ }
}

function Manage-CustomRoutes {
    [CmdletBinding(SupportsShouldProcess=$true)]
    param(
        [ValidateSet('add','remove','print')]
        [string]$Action = 'add',
        [string]$FilePath,
        [System.Net.IPAddress]$GatewayAddress,
        [System.Net.IPAddress]$InterfaceIPAddress,
        [int]$RouteMetric,
        [switch]$Persistent
    )
    begin {
        $policyStore = if ($Persistent.IsPresent) { 'PersistentStore' } else { 'ActiveStore' }
        $netAdapter = Get-NetIPAddress -IPAddress $InterfaceIPAddress.IPAddressToString -ErrorAction SilentlyContinue
        if (-not $netAdapter) {
            throw "Network interface with IP address '$($InterfaceIPAddress.IPAddressToString)' not found."
        }
        $interfaceIndex = $netAdapter[0].InterfaceIndex
        $destinations = Get-DestinationPrefixes -Path $FilePath
        if (-not $destinations -or $destinations.Count -eq 0) {
            Write-Warning "No valid network destinations found to process in $FilePath."
            return
        }
    }
    process {
        foreach ($destinationPrefix in $destinations) {
            $routeParams = @{ 
                DestinationPrefix = $destinationPrefix
                InterfaceIndex    = $interfaceIndex
                NextHop           = $GatewayAddress.IPAddressToString
                PolicyStore       = $policyStore
                ErrorAction       = 'SilentlyContinue'
            }
            if ($Action -eq 'add' -and $PSBoundParameters.ContainsKey('RouteMetric')) {
                $routeParams.RouteMetric = $RouteMetric
            }

            switch ($Action) {
                'remove' {
                    if ($PSCmdlet.ShouldProcess($destinationPrefix, 'Remove NetRoute')) {
                        if (Get-NetRoute @routeParams) {
                            Remove-NetRoute @routeParams -Confirm:$false
                            Write-Host "Removed route for $destinationPrefix"
                        } else {
                            Write-Warning "Route for $destinationPrefix not found."
                        }
                    }
                }
                'add' {
                    if ($PSCmdlet.ShouldProcess($destinationPrefix, 'Add NetRoute')) {
                        if (Get-NetRoute @routeParams) {
                            Write-Warning "Route for $destinationPrefix already exists. Skipping."
                        } else {
                            New-NetRoute @routeParams
                            Write-Host "Added route for $destinationPrefix"
                        }
                    }
                }
                'print' {
                    $existing = Get-NetRoute @routeParams
                    if ($existing) {
                        $existing | Format-Table -AutoSize
                    } else {
                        Write-Warning "Route for $destinationPrefix not found."
                    }
                }
            }
        }
    }
}

# Default file path if not provided
if (-not $FilePath) {
    $FilePath = Join-Path -Path $PSScriptRoot -ChildPath 'routes_with_masks.txt'
}

# Invoke the main function with provided parameters
Manage-CustomRoutes -Action $Action -FilePath $FilePath -GatewayAddress $GatewayAddress -InterfaceIPAddress $InterfaceIPAddress -RouteMetric $RouteMetric -Persistent:$Persistent
