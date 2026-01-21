# Health Check - Analyze Server Logs
# Reads .health-check.log and updates TODO.md with detected issues

param(
    [string]$LogFile = ".health-check.log"
)

$rootDir = Split-Path $PSScriptRoot -Parent
$logPath = Join-Path $rootDir $LogFile
$todoPath = Join-Path $rootDir "TODO.md"

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🏥 Health Check Analysis" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

if (-not (Test-Path $logPath)) {
    Write-Host "⚠ No log file found at: $logPath" -ForegroundColor Yellow
    Write-Host "Run the dev server first to generate logs`n" -ForegroundColor Yellow
    exit 0
}

# Issue tracking
$detectedIssues = @{}

# Read and analyze log
$logContent = Get-Content $logPath
$lineCount = 0

foreach ($line in $logContent) {
    $lineCount++
    
    # Check for image 404s
    if ($line -match 'GET (\/breeds\/[a-z]+\.jpg) 404') {
        $resource = $matches[1]
        $issueKey = "image-404-$resource"
        
        if (-not $detectedIssues.ContainsKey($issueKey)) {
            $detectedIssues[$issueKey] = @{
                Type = "Missing Placeholder Image"
                Resource = $resource
                Severity = "Low"
                Status = "Non-critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Impact = "Console noise only, doesn't affect functionality"
                Action = "Remove decorative images, create placeholders, or fetch dynamically"
            }
        } else {
            $detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for invalid images
    if ($line -match "The requested resource isn't a valid image for (\/breeds\/[a-z]+\.jpg)") {
        $resource = $matches[1]
        $issueKey = "invalid-image-$resource"
        
        if (-not $detectedIssues.ContainsKey($issueKey)) {
            $detectedIssues[$issueKey] = @{
                Type = "Invalid Image Resource"
                Resource = $resource
                Severity = "Low"
                Status = "Non-critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Impact = "Background decoration image issue"
                Action = "Verify image file or remove reference"
            }
        } else {
            $detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for API errors
    if ($line -match 'GET (\/api\/\S+) ([45]\d\d)') {
        $endpoint = $matches[1]
        $statusCode = $matches[2]
        $issueKey = "api-error-$endpoint-$statusCode"
        
        if (-not $detectedIssues.ContainsKey($issueKey)) {
            $detectedIssues[$issueKey] = @{
                Type = "API Error"
                Resource = "$endpoint (Status: $statusCode)"
                Severity = "Medium"
                Status = "API Issue"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Impact = "API endpoint returning error status"
                Action = "Investigate endpoint logic and error handling"
            }
        } else {
            $detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for hydration errors
    if ($line -match 'hydration') {
        $issueKey = "hydration-mismatch"
        
        if (-not $detectedIssues.ContainsKey($issueKey)) {
            $detectedIssues[$issueKey] = @{
                Type = "React Hydration Mismatch"
                Resource = "React SSR/CSR mismatch"
                Severity = "High"
                Status = "Critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Impact = "UI may render incorrectly, console warnings"
                Action = "Check for dynamic classes, conditional rendering, or client-only content"
                Details = $line.Trim()
            }
        } else {
            $detectedIssues[$issueKey].Count++
        }
    }
    
    # Check for compilation errors
    if ($line -match '⨯ (.*(error|Error).*)') {
        $errorMsg = $matches[1]
        $issueKey = "compilation-error-$($errorMsg.GetHashCode())"
        
        if (-not $detectedIssues.ContainsKey($issueKey)) {
            $detectedIssues[$issueKey] = @{
                Type = "Compilation Error"
                Resource = $errorMsg
                Severity = "High"
                Status = "Critical"
                FirstSeen = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Count = 1
                Impact = "Build may fail"
                Action = "Fix TypeScript/JavaScript errors"
                Details = $line.Trim()
            }
        } else {
            $detectedIssues[$issueKey].Count++
        }
    }
}

# Generate report
Write-Host "Analyzed $lineCount log lines`n" -ForegroundColor Cyan

if ($detectedIssues.Count -eq 0) {
    Write-Host "✓ No issues detected" -ForegroundColor Green
    Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan
    exit 0
}

Write-Host "Found $($detectedIssues.Count) unique issues:`n" -ForegroundColor Yellow

# Group by severity
$bySeverity = @{
    "High" = @()
    "Medium" = @()
    "Low" = @()
}

foreach ($key in $detectedIssues.Keys) {
    $issue = $detectedIssues[$key]
    $bySeverity[$issue.Severity] += $issue
}

foreach ($severity in @("High", "Medium", "Low")) {
    $issues = $bySeverity[$severity]
    if ($issues.Count -eq 0) { continue }
    
    $color = switch ($severity) {
        "High" { "Red" }
        "Medium" { "Yellow" }
        "Low" { "Cyan" }
    }
    
    Write-Host "$severity Severity Issues ($($issues.Count)):" -ForegroundColor $color
    
    foreach ($issue in $issues) {
        Write-Host "  • $($issue.Type): $($issue.Resource)" -ForegroundColor White
        Write-Host "    Occurrences: $($issue.Count)" -ForegroundColor Gray
    }
    Write-Host ""
}

# Update TODO.md
Write-Host "Updating TODO.md..." -ForegroundColor Yellow

try {
    $todoContent = Get-Content $todoPath -Raw
    $today = Get-Date -Format "MMMM dd, yyyy"
    
    # Check if "Auto-Detected Issues" section exists
    if ($todoContent -notmatch '## Auto-Detected Issues') {
        # Add new section before "Known Issues"
        $insertPoint = $todoContent.IndexOf('## Known Issues - To Be Addressed Later')
        if ($insertPoint -ge 0) {
            $beforeSection = $todoContent.Substring(0, $insertPoint)
            $afterSection = $todoContent.Substring($insertPoint)
            
            $todoContent = $beforeSection +
                "## Auto-Detected Issues (from Health Check)`n" +
                "_Last scan: $today_`n`n" +
                "---`n`n" +
                $afterSection
        } else {
            # Append at end if no Known Issues section
            $todoContent += "`n`n## Auto-Detected Issues (from Health Check)`n" +
                "_Last scan: $today_`n`n"
        }
    } else {
        # Update last scan date
        $todoContent = $todoContent -replace '(_Last scan:) .*', "`$1 $today"
    }
    
    # Add new issues
    $newIssuesAdded = 0
    
    foreach ($key in $detectedIssues.Keys) {
        $issue = $detectedIssues[$key]
        $resource = $issue.Resource
        
        # Only add if not already in TODO
        if ($todoContent -notmatch [regex]::Escape($resource)) {
            $issueText = "`n### $($issue.Type)`n" +
                "- **Status**: $($issue.Status)`n" +
                "- **Severity**: $($issue.Severity)`n" +
                "- **Resource**: $resource`n" +
                "- **Impact**: $($issue.Impact)`n" +
                "- **Action Needed**: $($issue.Action)`n" +
                "- **First Detected**: $($issue.FirstSeen)`n" +
                "- **Occurrences**: $($issue.Count)`n"
            
            if ($issue.Details) {
                $issueText += "- **Details**: ``$($issue.Details)```n"
            }
            
            $issueText += "- **Auto-detected**: Yes`n"
            
            # Insert after "Auto-Detected Issues" header
            $autoDetectIndex = $todoContent.IndexOf('## Auto-Detected Issues')
            if ($autoDetectIndex -ge 0) {
                # Find next section or end of file
                $afterHeader = $todoContent.Substring($autoDetectIndex)
                $nextSectionMatch = [regex]::Match($afterHeader, '\n## (?!Auto-Detected)')
                
                if ($nextSectionMatch.Success) {
                    $insertAt = $autoDetectIndex + $nextSectionMatch.Index
                    $todoContent = $todoContent.Substring(0, $insertAt) + $issueText + $todoContent.Substring($insertAt)
                } else {
                    $todoContent += $issueText
                }
                
                $newIssuesAdded++
            }
        }
    }
    
    Set-Content -Path $todoPath -Value $todoContent -NoNewline
    
    if ($newIssuesAdded -gt 0) {
        Write-Host "✓ Added $newIssuesAdded new issues to TODO.md" -ForegroundColor Green
    } else {
        Write-Host "✓ All issues already tracked in TODO.md" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ Failed to update TODO.md: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n════════════════════════════════════════`n" -ForegroundColor Cyan
