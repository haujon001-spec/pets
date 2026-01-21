#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts Next.js dev server with health check monitoring
.DESCRIPTION
    Runs npm run dev and monitors output for errors, automatically logging issues to TODO.md
#>

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🏥 Starting Dev Server with Health Check" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# Kill existing Node processes
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

# Set up log file
$logFile = Join-Path $PSScriptRoot ".." ".health-check.log"
if (Test-Path $logFile) { Remove-Item $logFile }

# Issue tracking
$global:detectedIssues = @{}

function Process-ServerLine {
    param([string]$line)
    
    # Skip empty lines
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    
    # Log to file
    Add-Content -Path $logFile -Value $line
    
    # Check for image 404s
    if ($line -match 'GET (\/breeds\/[a-z]+\.jpg) 404') {
        $resource = $matches[1]
        $issueKey = "image-404-$resource"
        
        if (-not $global:detectedIssues.ContainsKey($issueKey)) {
            $global:detectedIssues[$issueKey] = @{
                Type = "Missing Placeholder Image"
                Resource = $resource
                Severity = "Low"
                Status = "Non-critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
            }
            Write-Host "⚠ DETECTED: Missing image $resource" -ForegroundColor Yellow
        } else {
            $global:detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for invalid images
    if ($line -match "The requested resource isn't a valid image for (\/breeds\/[a-z]+\.jpg)") {
        $resource = $matches[1]
        $issueKey = "invalid-image-$resource"
        
        if (-not $global:detectedIssues.ContainsKey($issueKey)) {
            $global:detectedIssues[$issueKey] = @{
                Type = "Invalid Image Resource"
                Resource = $resource
                Severity = "Low"
                Status = "Non-critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
            }
        } else {
            $global:detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for API errors
    if ($line -match 'GET (\/api\/\S+) ([45]\d\d)') {
        $endpoint = $matches[1]
        $statusCode = $matches[2]
        $issueKey = "api-error-$endpoint-$statusCode"
        
        if (-not $global:detectedIssues.ContainsKey($issueKey)) {
            $global:detectedIssues[$issueKey] = @{
                Type = "API Error"
                Endpoint = $endpoint
                StatusCode = $statusCode
                Severity = "Medium"
                Status = "API Issue"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
            }
            Write-Host "✗ DETECTED: API error $endpoint returned $statusCode" -ForegroundColor Red
        } else {
            $global:detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for hydration errors
    if ($line -match 'hydration') {
        $issueKey = "hydration-mismatch"
        
        if (-not $global:detectedIssues.ContainsKey($issueKey)) {
            $global:detectedIssues[$issueKey] = @{
                Type = "React Hydration Mismatch"
                Severity = "High"
                Status = "Critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Line = $line.Trim()
            }
            Write-Host "✗ DETECTED: Hydration error" -ForegroundColor Red
        } else {
            $global:detectedIssues[$issueKey].Count++
        }
    }
    
    # Log successful operations
    if ($line -match '✓ Ready in') {
        Write-Host "✓ Server ready" -ForegroundColor Green
    }
    if ($line -match 'GET \/ 200') {
        Write-Host "✓ Page loaded successfully" -ForegroundColor Green
    }
    if ($line -match 'LLM Router initialized') {
        Write-Host "✓ LLM Router ready" -ForegroundColor Green
    }
}

function Generate-HealthReport {
    if ($global:detectedIssues.Count -eq 0) {
        Write-Host "`n✓ No new issues detected" -ForegroundColor Green
        return
    }
    
    Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  HEALTH CHECK REPORT" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Yellow
    
    # Group by category
    $categories = @{}
    foreach ($key in $global:detectedIssues.Keys) {
        $issue = $global:detectedIssues[$key]
        $category = $issue.Type
        
        if (-not $categories.ContainsKey($category)) {
            $categories[$category] = @()
        }
        $categories[$category] += $issue
    }
    
    foreach ($category in $categories.Keys) {
        $issues = $categories[$category]
        $severityColor = switch ($issues[0].Severity) {
            "High" { "Red" }
            "Medium" { "Yellow" }
            default { "Cyan" }
        }
        
        Write-Host "$($category):" -ForegroundColor $severityColor
        
        foreach ($issue in $issues) {
            $resource = if ($issue.Resource) { $issue.Resource } elseif ($issue.Endpoint) { $issue.Endpoint } elseif ($issue.Line) { $issue.Line } else { "N/A" }
            Write-Host "  • $resource"
            Write-Host "    Count: $($issue.Count), Severity: $($issue.Severity)"
        }
        Write-Host ""
    }
    
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
}

function Update-TodoFile {
    if ($global:detectedIssues.Count -eq 0) { return }
    
    try {
        $todoFile = Join-Path $PSScriptRoot ".." "TODO.md"
        $todoContent = Get-Content $todoFile -Raw
        $today = Get-Date -Format "MMMM dd, yyyy"
        
        # Check if "Auto-Detected Issues" section exists
        if ($todoContent -notmatch '## Auto-Detected Issues') {
            # Add new section
            $insertPoint = $todoContent.IndexOf('## Known Issues - To Be Addressed Later')
            if ($insertPoint -ge 0) {
                $beforeSection = $todoContent.Substring(0, $insertPoint)
                $afterSection = $todoContent.Substring($insertPoint)
                
                $todoContent = $beforeSection +
                    "## Auto-Detected Issues (from Health Check)`n" +
                    "_Last scan: $today_`n`n" +
                    "---`n`n" +
                    $afterSection
            }
        }
        
        # Add new issues
        $issueEntries = @()
        
        foreach ($key in $global:detectedIssues.Keys) {
            $issue = $global:detectedIssues[$key]
            $resource = if ($issue.Resource) { $issue.Resource } elseif ($issue.Endpoint) { $issue.Endpoint } else { $key }
            
            # Only add if not already in TODO
            if ($todoContent -notmatch [regex]::Escape($resource)) {
                $issueText = "### $($issue.Type)`n" +
                    "- **Status**: $($issue.Status)`n" +
                    "- **Severity**: $($issue.Severity)`n" +
                    "- **Resource**: $resource`n" +
                    "- **First Detected**: $($issue.FirstSeen)`n" +
                    "- **Occurrences**: $($issue.Count)`n"
                
                if ($issue.Line) {
                    $issueText += "- **Details**: ``$($issue.Line)```n"
                }
                
                $issueText += "- **Auto-detected**: Yes`n`n"
                $issueEntries += $issueText
            }
        }
        
        if ($issueEntries.Count -gt 0) {
            # Insert new issues after "Auto-Detected Issues" header
            $autoDetectIndex = $todoContent.IndexOf('## Auto-Detected Issues')
            if ($autoDetectIndex -ge 0) {
                $nextSectionMatch = [regex]::Match($todoContent.Substring($autoDetectIndex + 1), '\n## ')
                $insertAt = if ($nextSectionMatch.Success) {
                    $autoDetectIndex + 1 + $nextSectionMatch.Index
                } else {
                    $todoContent.Length
                }
                
                $todoContent = $todoContent.Substring(0, $insertAt) +
                    "`n" + ($issueEntries -join '') +
                    $(if ($nextSectionMatch.Success) { $todoContent.Substring($insertAt) } else { '' })
                
                Set-Content -Path $todoFile -Value $todoContent -NoNewline
                Write-Host "✓ Updated TODO.md with $($issueEntries.Count) new issues" -ForegroundColor Green
            }
        }
    }
    catch {
        Write-Host "✗ Failed to update TODO.md: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Start dev server and capture output
try {
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\npm-stdout.txt" -RedirectStandardError "$env:TEMP\npm-stderr.txt"
    
    # Monitor output files
    Start-Sleep -Seconds 3
    
    $stdoutFile = "$env:TEMP\npm-stdout.txt"
    $stderrFile = "$env:TEMP\npm-stderr.txt"
    
    # Tail the output
    Get-Content $stdoutFile, $stderrFile -Wait -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host $_ -NoNewline
        Process-ServerLine $_
    }
}
finally {
    Generate-HealthReport
    Update-TodoFile
    
    Write-Host "`n🏥 Health Check Monitor Stopped`n" -ForegroundColor Cyan
}
