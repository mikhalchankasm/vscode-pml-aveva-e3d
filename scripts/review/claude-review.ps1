param(
    [string]$PromptPath,
    [string]$Prompt,
    [string]$Model,
    [ValidateSet('standard', 'super')]
    [string]$Mode = 'standard'
)

$ErrorActionPreference = 'Stop'
$superReviewModel = if ($env:PML_CLAUDE_SUPER_REVIEW_MODEL) { $env:PML_CLAUDE_SUPER_REVIEW_MODEL } else { 'claude-fable-5' }

if ($PromptPath -and $Prompt) {
    throw 'Use either -PromptPath or -Prompt, not both.'
}

if ($PromptPath) {
    $reviewPrompt = Get-Content -LiteralPath $PromptPath -Raw
} elseif ($Prompt) {
    $reviewPrompt = $Prompt
} else {
    $reviewPrompt = $input | Out-String
    if ([string]::IsNullOrWhiteSpace($reviewPrompt)) {
        if (-not [Console]::IsInputRedirected) {
            throw 'Claude review prompt is empty. Pipe prompt text via stdin or pass -Prompt/-PromptPath.'
        }

        $reviewPrompt = [Console]::In.ReadToEnd()
    }
}

if ([string]::IsNullOrWhiteSpace($reviewPrompt)) {
    throw 'Claude review prompt is empty.'
}

$claudeCommand = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeCommand) {
    throw 'Claude Code CLI was not found. Install or sign in to Claude Code before requesting external review.'
}

$oldAnthropicApiKey = $env:ANTHROPIC_API_KEY
try {
    Remove-Item Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue

    $effectiveModel = $Model
    if (-not $effectiveModel -and $Mode -eq 'super') {
        $effectiveModel = $superReviewModel
    }

    $disabledTools = 'Bash,Read,Edit,Write,Glob,Grep,LS,MultiEdit,NotebookEdit,WebFetch,WebSearch,TodoWrite,Task'
    $arguments = @(
        '--print',
        '--input-format', 'text',
        '--output-format', 'text',
        '--tools', '',
        '--disallowedTools', $disabledTools,
        '--permission-mode', 'dontAsk',
        '--no-session-persistence',
        '--disable-slash-commands'
    )
    if ($effectiveModel) {
        $arguments += @('--model', $effectiveModel)
    }

    $reviewPrompt | & $claudeCommand.Source @arguments
    if ($null -ne $LASTEXITCODE) {
        exit $LASTEXITCODE
    }
    if ($?) {
        exit 0
    }
    exit 1
} finally {
    if ($null -ne $oldAnthropicApiKey) {
        $env:ANTHROPIC_API_KEY = $oldAnthropicApiKey
    }
}
