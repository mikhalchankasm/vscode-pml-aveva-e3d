import * as vscode from 'vscode';

interface QuickAction extends vscode.QuickPickItem {
    command?: string;
    snippet?: vscode.SnippetString;
    requiresSelection?: boolean;
}

const DOCUMENT_ACTIONS: QuickAction[] = [
    {
        label: '$(zap) Format PML Document',
        description: 'Document',
        detail: 'Run the PML formatter on the active document.',
        command: 'pml.formatDocument'
    }
];

const SELECTION_ACTIONS: QuickAction[] = [
    {
        label: '$(symbol-numeric) Smart Natural Sort',
        description: 'Selection',
        detail: 'Sort selected lines using natural numeric-aware order.',
        command: 'pml.sortLinesSmart',
        requiresSelection: true
    },
    {
        label: '$(chrome-minimize) Remove Duplicate Lines',
        description: 'Selection',
        detail: 'Remove duplicate selected lines while keeping the first occurrence.',
        command: 'pml.removeDuplicates',
        requiresSelection: true
    },
    {
        label: '$(whitespace) Trim Trailing Whitespace',
        description: 'Selection',
        detail: 'Remove trailing spaces and tabs from selected lines.',
        command: 'pml.trimWhitespace',
        requiresSelection: true
    },
    {
        label: '$(comment) Add PML Line Comments',
        description: 'Current line or selection',
        detail: 'Add PML line comments to the current line or selected lines.',
        command: 'pml.addComments'
    },
    {
        label: '$(comment-unresolved) Remove PML Line Comments',
        description: 'Current line or selection',
        detail: 'Remove PML line comments from the current line or selected lines.',
        command: 'pml.removeComments'
    }
];

const PRINT_ACTIONS: QuickAction[] = [
    {
        label: '$(output) Open $P Print Actions...',
        description: 'Debug prints',
        detail: 'Open the focused $P print navigation and cleanup picker.',
        command: 'pml.prints.actions'
    },
    {
        label: '$(arrow-up) Go to Previous $P Print',
        description: 'Debug prints',
        detail: 'Move the cursor to the previous $P print statement.',
        command: 'pml.prints.previous'
    },
    {
        label: '$(arrow-down) Go to Next $P Print',
        description: 'Debug prints',
        detail: 'Move the cursor to the next $P print statement.',
        command: 'pml.prints.next'
    },
    {
        label: '$(comment) Comment All $P Prints',
        description: 'Debug prints',
        detail: 'Comment every active $P print statement in the file.',
        command: 'pml.prints.commentAll'
    },
    {
        label: '$(comment-discussion) Uncomment All $P Prints',
        description: 'Debug prints',
        detail: 'Restore commented $P print statements in the file.',
        command: 'pml.prints.uncommentAll'
    },
    {
        label: '$(trash) Delete All $P Prints',
        description: 'Destructive',
        detail: 'Remove every active $P print statement after confirmation.',
        command: 'pml.prints.deleteAll'
    }
];

const DOCUMENTATION_ACTIONS: QuickAction[] = [
    {
        label: '$(symbol-method) Extract Methods',
        description: 'Selection',
        detail: 'Extract method names from the selected text into a new PML document.',
        command: 'pml.extractMethods',
        requiresSelection: true
    },
    {
        label: '$(symbol-variable) Extract Variables',
        description: 'Selection',
        detail: 'Extract variable names from the selected text into a new PML document.',
        command: 'pml.extractVariables',
        requiresSelection: true
    },
    {
        label: '$(note) Insert Method Documentation Block',
        description: 'Documentation',
        detail: 'Insert the existing method documentation helper.',
        command: 'pml.insertMethodDocBlock'
    }
];

const PRESET_ACTIONS: QuickAction[] = [
    {
        label: '$(symbol-method) Preset: Method',
        description: 'Insert snippet',
        detail: 'Insert a compact method skeleton.',
        snippet: new vscode.SnippetString([
            'define method .${1:methodName}()',
            '    ${0:-- Method body}',
            'endmethod'
        ].join('\n'))
    },
    {
        label: '$(symbol-method) Preset: Documented Method',
        description: 'Insert snippet',
        detail: 'Insert a method skeleton with documentation comments.',
        snippet: new vscode.SnippetString([
            '-- ${1:Describe the method}',
            '-- @param ${2:paramName} - ${3:Description}',
            'define method .${4:methodName}(${5:args})',
            '    ${0:-- Method body}',
            'endmethod'
        ].join('\n'))
    },
    {
        label: '$(symbol-class) Preset: Object With Init Method',
        description: 'Insert snippet',
        detail: 'Insert a small PML object skeleton with one member and init method.',
        snippet: new vscode.SnippetString([
            'define object ${1:ObjectName}',
            '    member .${2:name} is ${3:STRING}',
            '',
            '    define method .${4:init}()',
            '        ${0:-- Initialize object}',
            '    endmethod',
            'endobject'
        ].join('\n'))
    },
    {
        label: '$(window) Preset: Docked Form With Callback',
        description: 'Insert snippet',
        detail: 'Insert a minimal docked form with an Apply button callback.',
        snippet: new vscode.SnippetString([
            'setup form !!${1:FormName} dialog docking ${2:right}',
            '    title |${3:Form Title}|',
            '',
            '    button .${4:btnApply} |${5:Apply}| callback |!this.${6:onApply}()| width ${7:10}',
            'exit',
            '',
            'define method .${6:onApply}()',
            '    ${0:-- Handle Apply}',
            'endmethod'
        ].join('\n'))
    },
    {
        label: '$(list-ordered) Preset: Indexed Array Loop',
        description: 'Insert snippet',
        detail: 'Insert a 1-based PML array index loop.',
        snippet: new vscode.SnippetString([
            'do !${1:i} index !${2:list}',
            '    !${3:item} = !${2:list}[!${1:i}]',
            '    ${0:-- Loop body}',
            'enddo'
        ].join('\n'))
    },
    {
        label: '$(database) Preset: Collect Elements',
        description: 'Insert snippet',
        detail: 'Insert a collectallfor starter block using !!CE as the place.',
        snippet: new vscode.SnippetString([
            '!types = |${1:TYPE}|',
            '!filter = |${2:FILTER}|',
            '!place = ${3:!!CE}',
            '!elements = !!collectallfor(!types, !filter, !place)',
            '$0'
        ].join('\n'))
    }
];

function buildQuickActions(hasSelection: boolean): QuickAction[] {
    const selectionActions = SELECTION_ACTIONS.filter(action => !action.requiresSelection || hasSelection);
    const documentationActions = DOCUMENTATION_ACTIONS.filter(action => !action.requiresSelection || hasSelection);

    return [
        separator('Document'),
        ...DOCUMENT_ACTIONS,
        ...(selectionActions.length > 0 ? [separator('Selection cleanup'), ...selectionActions] : []),
        separator('$P debug prints'),
        ...PRINT_ACTIONS,
        ...(documentationActions.length > 0 ? [separator('Documentation and extraction'), ...documentationActions] : []),
        separator('Starter presets'),
        ...PRESET_ACTIONS
    ];
}

function separator(label: string): QuickAction {
    return { label, kind: vscode.QuickPickItemKind.Separator };
}

export function registerPMLQuickActions(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('pml.quickActions.open', openQuickActions)
    );
}

async function openQuickActions(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    if (editor.document.languageId !== 'pml') {
        vscode.window.showErrorMessage('This is not a PML file');
        return;
    }

    const hasSelection = editor.selections.some(selection => !selection.isEmpty);
    const actions = buildQuickActions(hasSelection);
    const picked = await vscode.window.showQuickPick(actions, {
        title: 'PML Quick Actions and Presets',
        placeHolder: 'Run a tool or insert a common PML block',
        matchOnDescription: true,
        matchOnDetail: true
    });

	if (!picked) {
		return;
	}

	if (picked.command) {
		if (!isActivePMLEditor()) {
			vscode.window.showErrorMessage('This is not a PML file');
			return;
		}
		await vscode.commands.executeCommand(picked.command);
		return;
	}

    if (picked.snippet) {
        await insertPreset(picked.snippet);
    }
}

async function insertPreset(snippet: vscode.SnippetString): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor || !isPMLDocument(editor.document)) {
		vscode.window.showErrorMessage('This is not a PML file');
		return;
	}

    const inserted = await editor.insertSnippet(snippet, editor.selection.active);
	if (!inserted) {
		vscode.window.showErrorMessage('Failed to insert PML preset');
	}
}

function isActivePMLEditor(): boolean {
	const editor = vscode.window.activeTextEditor;
	return !!editor && isPMLDocument(editor.document);
}

function isPMLDocument(document: vscode.TextDocument): boolean {
	return document.languageId === 'pml';
}
