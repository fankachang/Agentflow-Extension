import * as vscode from 'vscode';
import { DocumentFormatter } from '../formatter/documentFormatter';

const documentFormatter = new DocumentFormatter();

export async function formatDocumentHandler(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  if (editor.document.languageId !== 'javascript') {
    vscode.window.showInformationMessage('Agentflow: 僅支援 .js 檔案');
    return;
  }

  const options = editor.options;
  const context = {
    sourceText: editor.document.getText(),
    tabSize: typeof options.tabSize === 'number' ? options.tabSize : 2,
    insertSpaces: typeof options.insertSpaces === 'boolean' ? options.insertSpaces : true,
  };

  const result = await documentFormatter.format(context);

  if (!result.success || result.formattedText === null) {
    vscode.window.showErrorMessage(
      `Agentflow 格式化失敗：${result.error?.message ?? '未知錯誤'}`
    );
    return;
  }

  const fullRange = new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(editor.document.getText().length)
  );

  await editor.edit((editBuilder) => {
    editBuilder.replace(fullRange, result.formattedText!);
  });
}
