import * as vscode from 'vscode';
import { DocumentFormatter } from './formatter/documentFormatter';

const documentFormatter = new DocumentFormatter();

export function activate(context: vscode.ExtensionContext): void {
  const provider = vscode.languages.registerDocumentFormattingEditProvider(
    'javascript',
    {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
      ): Promise<vscode.TextEdit[]> {
        if (token.isCancellationRequested) {
          return [];
        }

        const context = {
          sourceText: document.getText(),
          tabSize: options.tabSize,
          insertSpaces: options.insertSpaces,
        };

        const result = await documentFormatter.format(context);

        if (!result.success || result.formattedText === null) {
          vscode.window.showErrorMessage(
            `Agentflow 格式化失敗：${result.error?.message ?? '未知錯誤'}`
          );
          return [];
        }

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );

        return [vscode.TextEdit.replace(fullRange, result.formattedText)];
      },
    }
  );

  context.subscriptions.push(provider);
}

export function deactivate(): void {}
