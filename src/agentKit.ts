import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { canRunAgentKit, createNpmExecutionOptions, getAgentKitDiscoveryCandidates } from './agentKitCore';

const HELP_BY_CODE: Record<string, string> = {
    PML_FORM_CALLBACK_TARGET_MISSING: 'docs/pml-help/callbacks.md',
    PML_STYLE_MIXED: 'docs/pml-help/pml-style-separation.md',
    PML_UNSAFE_SAVEWORK_IN_LOOP: 'docs/pml-help/savework.md',
    PML_PERF_ALL_MODEL_TRAVERSAL: 'docs/pml-help/performance.md'
};

type AgentKitSeverity = 'blocker' | 'major' | 'minor' | 'info' | 'error' | 'warning' | 'information' | 'hint';

interface AgentKitFinding {
    code?: string;
    message?: string;
    severity?: AgentKitSeverity | string;
    file?: string;
    path?: string;
    range?: {
        start?: { line?: number; character?: number; column?: number };
        end?: { line?: number; character?: number; column?: number };
    };
    line?: number;
    column?: number;
}

interface AgentKitReview {
    status?: string;
    summary?: string;
    findings?: AgentKitFinding[];
    result?: {
        status?: string;
        summary?: string;
        findings?: AgentKitFinding[];
    };
    validation?: unknown;
}

interface AgentKitLiveStatus {
    status?: string;
    liveE3d?: string;
    available?: boolean;
    e3dContacted?: boolean;
    liveValidationRun?: boolean;
    code?: string;
    message?: string;
    notes?: string[];
    avox?: unknown;
}

let outputChannel: vscode.OutputChannel | undefined;
let diagnosticCollection: vscode.DiagnosticCollection | undefined;

export function registerAgentKitCommands(context: vscode.ExtensionContext): void {
    outputChannel = vscode.window.createOutputChannel('PML Agent Kit');
    diagnosticCollection = vscode.languages.createDiagnosticCollection('pml-agent-kit');

    context.subscriptions.push(
        outputChannel,
        diagnosticCollection,
        vscode.commands.registerCommand('pml.agentKit.reviewCurrentFile', reviewCurrentFile),
        vscode.commands.registerCommand('pml.agentKit.explainCurrentFinding', explainCurrentFinding),
        vscode.commands.registerCommand('pml.agentKit.openHelpForFinding', () => openHelpForCurrentFinding(context)),
        vscode.commands.registerCommand('pml.agentKit.checkHealth', checkHealth),
        vscode.commands.registerCommand('pml.agentKit.checkLiveE3dAvoxStatus', checkLiveE3dAvoxStatus)
    );
}

async function reviewCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'pml') {
        vscode.window.showErrorMessage('Open a PML file before running Agent Kit review.');
        return;
    }

    const config = vscode.workspace.getConfiguration('pml.agentKit');
    if (!config.get<boolean>('enabled', true)) {
        vscode.window.showWarningMessage('PML Agent Kit integration is disabled.');
        return;
    }
    if (!ensureTrustedAgentKitWorkspace('review')) {
        return;
    }

    await editor.document.save();

    const agentKitPath = getAgentKitPath(config);
    if (!agentKitPath) {
        showAgentKitSetupError('review');
        return;
    }
    const filePath = editor.document.uri.fsPath;
    const args = ['run', 'pml:review', '--', filePath, '--json'];

    appendLine(`Reviewing current file: ${filePath}`);
    appendLine(`Agent Kit: ${agentKitPath}`);

    try {
        const result = await runNpm(args, agentKitPath);
        const review = JSON.parse(result.stdout) as AgentKitReview;
        const findings = getFindings(review);
        publishDiagnostics(editor.document.uri, findings);
        writeReviewSummary(review, findings);
        if (config.get<boolean>('showRawReport', false)) {
            appendLine('');
            appendLine(result.stdout.trim());
        }
        outputChannel?.show(true);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendLine(`Review failed: ${message}`);
        outputChannel?.show(true);
        vscode.window.showErrorMessage(`PML Agent Kit review failed: ${message}`);
    }
}

async function checkHealth(): Promise<void> {
    if (!ensureTrustedAgentKitWorkspace('health check')) {
        return;
    }

    const config = vscode.workspace.getConfiguration('pml.agentKit');
    const agentKitPath = getAgentKitPath(config);
    if (!agentKitPath) {
        showAgentKitSetupError('health check');
        return;
    }

    appendLine(`Checking Agent Kit health: ${agentKitPath}`);
    try {
        const result = await runNpm(['run', 'pml:doctor', '--', '--json'], agentKitPath);
        appendLine(result.stdout.trim());
        outputChannel?.show(true);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendLine(`Health check failed: ${message}`);
        outputChannel?.show(true);
        vscode.window.showErrorMessage(`PML Agent Kit health check failed: ${message}`);
    }
}

async function checkLiveE3dAvoxStatus(): Promise<void> {
    if (!ensureTrustedAgentKitWorkspace('live E3D/Avox status check')) {
        return;
    }

    const config = vscode.workspace.getConfiguration('pml.agentKit');
    const agentKitPath = getAgentKitPath(config);
    if (!agentKitPath) {
        showAgentKitSetupError('live E3D/Avox status check');
        return;
    }

    appendLine(`Checking live E3D/Avox status through Agent Kit: ${agentKitPath}`);
    try {
        const result = await runNpm(['run', 'pml:live-status', '--', '--json'], agentKitPath);
        const liveStatus = JSON.parse(result.stdout) as AgentKitLiveStatus;
        writeLiveStatusSummary(liveStatus);
        if (config.get<boolean>('showRawReport', false)) {
            appendLine('');
            appendLine(result.stdout.trim());
        }
        outputChannel?.show(true);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendLine(`Live E3D/Avox status check failed: ${message}`);
        appendLine('Status: MISCONFIGURED');
        appendLine('Agent Kit live status could not be queried. Check pml.agentKit.path and Agent Kit installation.');
        outputChannel?.show(true);
        vscode.window.showErrorMessage(`PML Agent Kit live status check failed: ${message}`);
    }
}

function getAgentKitPath(config: vscode.WorkspaceConfiguration): string | undefined {
    const configuredPath = config.get<string>('path', '').trim();
    if (configuredPath.length > 0) {
        return configuredPath;
    }

    return discoverAgentKitPath();
}

function discoverAgentKitPath(): string | undefined {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const folderPath = folder.uri.fsPath;
        const candidates = getAgentKitDiscoveryCandidates(folderPath);

        for (const candidate of candidates) {
            if (isAgentKitRoot(candidate)) {
                return candidate;
            }
        }
    }

    return undefined;
}

function ensureTrustedAgentKitWorkspace(action: string): boolean {
    if (canRunAgentKit(vscode.workspace.isTrusted)) {
        return true;
    }

    const message = 'PML Agent Kit runs npm scripts and requires a trusted workspace.';
    appendLine(`Agent Kit ${action} skipped: ${message}`);
    appendLine('Status: MISCONFIGURED');
    outputChannel?.show(true);
    vscode.window.showErrorMessage(message);
    return false;
}

function isAgentKitRoot(candidate: string): boolean {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8'));
        const scripts = packageJson.scripts ?? {};
        return Boolean(scripts['pml:review'] && scripts['pml:doctor'] && scripts['pml:live-status']);
    } catch {
        return false;
    }
}

function showAgentKitSetupError(action: string): void {
    const message = 'Set pml.agentKit.path to the e3d-pml-agent-kit repository, or open this workspace next to it.';
    appendLine(`Agent Kit ${action} skipped: ${message}`);
    appendLine('Status: MISCONFIGURED');
    outputChannel?.show(true);
    vscode.window.showErrorMessage(`PML Agent Kit is not configured. ${message}`);
}

function runNpm(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const { command, args: executionArgs, options } = createNpmExecutionOptions(process.platform, cwd, args);
        cp.execFile(command, executionArgs, options, (error, stdout, stderr) => {
            if (error) {
                if (stdout.trim().length > 0) {
                    resolve({ stdout, stderr });
                    return;
                }
                reject(new Error(stderr.trim() || error.message));
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

function writeLiveStatusSummary(liveStatus: AgentKitLiveStatus): void {
    const status = normalizeLiveStatus(liveStatus.status);
    appendLine(`Status: ${status}`);
    appendLine(`Live E3D: ${liveStatus.liveE3d ?? 'UNKNOWN'}`);
    appendLine(`Avox/E3D contacted: ${liveStatus.e3dContacted === true ? 'yes' : 'no'}`);
    appendLine(`Live validation run: ${liveStatus.liveValidationRun === true ? 'yes' : 'no'}`);
    if (liveStatus.code) {
        appendLine(`Code: ${liveStatus.code}`);
    }
    if (liveStatus.message) {
        appendLine(`Message: ${liveStatus.message}`);
    }
    if (liveStatus.e3dContacted !== true || liveStatus.liveValidationRun !== true) {
        appendLine('Result: Live E3D validation was not run unless Agent Kit reports Avox/E3D was contacted.');
    }
    for (const note of liveStatus.notes ?? []) {
        appendLine(`Note: ${note}`);
    }
}

function normalizeLiveStatus(status: string | undefined): string {
    const allowed = new Set(['LIVE_READY', 'LIVE_UNAVAILABLE', 'STATIC_READY', 'STATIC_DEGRADED', 'MISCONFIGURED']);
    return status && allowed.has(status) ? status : 'MISCONFIGURED';
}

function getFindings(review: AgentKitReview): AgentKitFinding[] {
    return review.findings ?? review.result?.findings ?? [];
}

function publishDiagnostics(defaultUri: vscode.Uri, findings: AgentKitFinding[]): void {
    const grouped = new Map<string, vscode.Diagnostic[]>();

    for (const finding of findings) {
        const filePath = finding.file ?? finding.path;
        const uri = filePath ? vscode.Uri.file(resolveFindingPath(filePath)) : defaultUri;
        const key = uri.toString();
        const diagnostics = grouped.get(key) ?? [];
        const diagnostic = new vscode.Diagnostic(
            toRange(finding),
            finding.message ?? finding.code ?? 'PML Agent Kit finding',
            toDiagnosticSeverity(finding.severity)
        );
        diagnostic.source = 'pml-agent-kit';
        diagnostic.code = finding.code;
        diagnostics.push(diagnostic);
        grouped.set(key, diagnostics);
    }

    diagnosticCollection?.clear();
    for (const [uriString, diagnostics] of grouped) {
        diagnosticCollection?.set(vscode.Uri.parse(uriString), diagnostics);
    }
}

function resolveFindingPath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return path.resolve(workspaceFolder ?? '', filePath);
}

function toRange(finding: AgentKitFinding): vscode.Range {
    const startLine = zeroBasedLine(finding.range?.start?.line ?? finding.line) ?? 0;
    const startColumn = zeroBasedColumn(finding.range?.start?.column ?? finding.range?.start?.character ?? finding.column) ?? 0;
    const endLine = zeroBasedLine(finding.range?.end?.line) ?? startLine;
    const endColumn = zeroBasedColumn(finding.range?.end?.column ?? finding.range?.end?.character) ?? startColumn + 1;
    return new vscode.Range(startLine, startColumn, endLine, endColumn);
}

function zeroBasedLine(value: number | undefined): number | undefined {
    if (value === undefined || value < 0) {
        return undefined;
    }
    return value > 0 ? value - 1 : value;
}

function zeroBasedColumn(value: number | undefined): number | undefined {
    if (value === undefined || value < 0) {
        return undefined;
    }
    return value > 0 ? value - 1 : value;
}

function toDiagnosticSeverity(severity: AgentKitFinding['severity']): vscode.DiagnosticSeverity {
    switch (String(severity ?? '').toLowerCase()) {
        case 'blocker':
        case 'major':
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'minor':
        case 'warning':
            return vscode.DiagnosticSeverity.Warning;
        case 'hint':
            return vscode.DiagnosticSeverity.Hint;
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}

function writeReviewSummary(review: AgentKitReview, findings: AgentKitFinding[]): void {
    const counts = new Map<string, number>();
    for (const finding of findings) {
        const severity = String(finding.severity ?? 'info').toUpperCase();
        counts.set(severity, (counts.get(severity) ?? 0) + 1);
    }

    appendLine(`Status: ${review.status ?? review.result?.status ?? 'UNKNOWN'}`);
    if (review.summary ?? review.result?.summary) {
        appendLine(`Summary: ${review.summary ?? review.result?.summary}`);
    }
    appendLine(`Findings: ${findings.length}`);
    for (const [severity, count] of counts) {
        appendLine(`  ${severity}: ${count}`);
    }
}

function explainCurrentFinding(): void {
    const diagnostic = currentAgentKitDiagnostic();
    if (!diagnostic) {
        vscode.window.showInformationMessage('No PML Agent Kit finding at the current cursor.');
        return;
    }

    appendLine(`${diagnostic.code ?? 'PML finding'}: ${diagnostic.message}`);
    outputChannel?.show(true);
}

async function openHelpForCurrentFinding(context: vscode.ExtensionContext): Promise<void> {
    const diagnostic = currentAgentKitDiagnostic();
    const code = String(diagnostic?.code ?? '');
    const relativeHelpPath = HELP_BY_CODE[code];

    if (!relativeHelpPath) {
        vscode.window.showInformationMessage(code ? `No help page is mapped for ${code}.` : 'No PML Agent Kit finding at the current cursor.');
        return;
    }

    const helpUri = vscode.Uri.file(path.join(context.extensionPath, relativeHelpPath));
    await vscode.commands.executeCommand('vscode.open', helpUri);
}

function currentAgentKitDiagnostic(): vscode.Diagnostic | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !diagnosticCollection) {
        return undefined;
    }

    return diagnosticCollection
        .get(editor.document.uri)
        ?.find(diagnostic => diagnostic.range.contains(editor.selection.active));
}

function appendLine(message: string): void {
    outputChannel?.appendLine(message);
}
