import * as vscode from 'vscode';
import { ALL_TYPE_METHODS } from './pmlTypes';

interface MethodItem extends vscode.QuickPickItem {
    method: { name: string; params: string[]; returnType: string; description: string };
    typeName?: string;
}

export class PMLMethodCommands {
    private static showMethodsForType(typeName: string) {
        const methods = ALL_TYPE_METHODS[typeName as keyof typeof ALL_TYPE_METHODS];
        if (!methods) {
            vscode.window.showErrorMessage(`Unknown type: ${typeName}`);
            return;
        }

        const items: MethodItem[] = methods.map(method => {
            const params = method.params.length > 0 ? `(${method.params.join(', ')})` : '()';
            return {
                label: method.name,
                description: `${method.returnType} ${method.name}${params}`,
                detail: method.description,
                method
            };
        });

        vscode.window.showQuickPick(items, {
            placeHolder: `Select a method`,
            matchOnDescription: true,
            matchOnDetail: true
        }).then(selected => {
            if (selected) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const position = editor.selection.active;
                    if (selected.method.params.length > 0) {
                        const placeholders = selected.method.params.map((p: string, i: number) => `\${${i + 1}:${p}}`).join(', ');
                        const snippet = new vscode.SnippetString(`${selected.method.name}(${placeholders})`);
                        editor.insertSnippet(snippet, position);
                    } else {
                        editor.edit(editBuilder => {
                            editBuilder.insert(position, `${selected.method.name}()`);
                        });
                    }
                }
            }
        });
    }

    static registerCommands(context: vscode.ExtensionContext) {
        const showStringMethods = vscode.commands.registerCommand('pml.showStringMethods', () => {
            this.showMethodsForType('STRING');
        });

        const showRealMethods = vscode.commands.registerCommand('pml.showRealMethods', () => {
            this.showMethodsForType('REAL');
        });

        const showArrayMethods = vscode.commands.registerCommand('pml.showArrayMethods', () => {
            this.showMethodsForType('ARRAY');
        });

        const showDbrefMethods = vscode.commands.registerCommand('pml.showDbrefMethods', () => {
            this.showMethodsForType('DBREF');
        });

        const showAllMethods = vscode.commands.registerCommand('pml.showAllMethods', () => {
            const allMethods: MethodItem[] = [];
            for (const [typeName, methods] of Object.entries(ALL_TYPE_METHODS)) {
                for (const method of methods) {
                    const params = method.params.length > 0 ? `(${method.params.join(', ')})` : '()';
                    allMethods.push({
                        label: method.name,
                        description: `[${typeName}] ${method.returnType} ${method.name}${params}`,
                        detail: method.description,
                        method,
                        typeName
                    });
                }
            }

            vscode.window.showQuickPick(allMethods, {
                placeHolder: 'Select a method',
                matchOnDescription: true,
                matchOnDetail: true
            }).then(selected => {
                if (selected) {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const position = editor.selection.active;
                        if (selected.method.params.length > 0) {
                            const placeholders = selected.method.params.map((p: string, i: number) => `\${${i + 1}:${p}}`).join(', ');
                            const snippet = new vscode.SnippetString(`${selected.method.name}(${placeholders})`);
                            editor.insertSnippet(snippet, position);
                        } else {
                            editor.edit(editBuilder => {
                                editBuilder.insert(position, `${selected.method.name}()`);
                            });
                        }
                    }
                }
            });
        });

        context.subscriptions.push(
            showStringMethods,
            showRealMethods,
            showArrayMethods,
            showDbrefMethods,
            showAllMethods
        );
    }
}

