import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface BrowserTab {
  title: string;
  type: 'doc' | 'ppt' | 'xls' | 'pdf' | 'other';
}

const BROWSER_TABS_SCRIPT = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$results = @()
$root = [System.Windows.Automation.AutomationElement]::RootElement

# Find all Chrome_WidgetWin_1 windows (Edge + Chrome use this class)
$classCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ClassNameProperty,
    'Chrome_WidgetWin_1')
$windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $classCondition)

# Get Edge/Chrome process IDs to filter out VS Code etc.
$browserPids = @()
$browserPids += (Get-Process -Name msedge -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
$browserPids += (Get-Process -Name chrome -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)

foreach ($win in $windows) {
    $pid = $win.Current.ProcessId
    if ($browserPids -notcontains $pid) { continue }

    $tabCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::TabItem)
    $tabs = $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $tabCondition)

    foreach ($tab in $tabs) {
        $name = $tab.Current.Name
        if (-not $name -or $name -eq '') { continue }
        # Remove "- Sleeping" and memory usage suffixes
        $clean = $name -replace '\\s*-\\s*Sleeping.*$', '' -replace '\\s*-\\s*Memory usage.*$', ''
        $clean = $clean.Trim()
        if ($clean -eq '') { continue }

        # Check if it looks like a document
        $isDoc = $false
        $type = 'other'
        if ($clean -match '\\.(docx?)' -or $clean -match 'Word') {
            $isDoc = $true; $type = 'doc'
            $clean = $clean -replace '\\.docx?$', ''
        }
        elseif ($clean -match '\\.(pptx?)' -or $clean -match 'PowerPoint') {
            $isDoc = $true; $type = 'ppt'
            $clean = $clean -replace '\\.pptx?$', ''
        }
        elseif ($clean -match '\\.(xlsx?)' -or $clean -match 'Excel') {
            $isDoc = $true; $type = 'xls'
            $clean = $clean -replace '\\.xlsx?$', ''
        }
        elseif ($clean -match '\\.pdf') {
            $isDoc = $true; $type = 'pdf'
            $clean = $clean -replace '\\.pdf$', ''
        }
        elseif ($clean -match 'SharePoint|OneDrive|Power BI') {
            $isDoc = $true
        }

        if ($isDoc) {
            $results += [PSCustomObject]@{ Title = $clean; Type = $type }
        }
    }
}

if ($results.Count -eq 0) { Write-Output '[]' }
elseif ($results.Count -eq 1) { Write-Output (ConvertTo-Json @($results) -Compress) }
else { Write-Output ($results | ConvertTo-Json -Compress) }
`;

export async function scanBrowserTabs(): Promise<BrowserTab[]> {
  const tmpFile = path.join(os.tmpdir(), `dox-browser-${Date.now()}.ps1`);
  try {
    fs.writeFileSync(tmpFile, BROWSER_TABS_SCRIPT, 'utf-8');
    const { stdout } = await execAsync(
      `powershell -STA -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { maxBuffer: 4 * 1024 * 1024, timeout: 20000 }
    );
    const trimmed = stdout.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr
        .filter((item: any) => item.Title)
        .map((item: any) => ({
          title: item.Title,
          type: (item.Type || 'other') as BrowserTab['type'],
        }));
    } catch {
      return [];
    }
  } catch {
    return [];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}
