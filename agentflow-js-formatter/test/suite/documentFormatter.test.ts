import * as assert from 'assert';
import { DocumentFormatter } from '../../src/formatter/documentFormatter';

suite('DocumentFormatter (US1 整合測試)', () => {
  const formatter = new DocumentFormatter();
  const defaultOpts = { tabSize: 2, insertSpaces: true };

  test('縮排錯誤 JS → 符合 Prettier 標準格式', async () => {
    const input = 'function foo(){const x=1;return x;}';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success);
    assert.ok(result.formattedText!.includes('\n'));
  });

  test('三個以上連續空白行 → 壓縮為一個空白行', async () => {
    const input = 'const a = 1;\n\n\n\nconst b = 2;\n';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success);
    assert.ok(!result.formattedText!.includes('\n\n\n'));
  });

  test('空白檔案 → 回傳空字串不拋出錯誤', async () => {
    const result = await formatter.format({ sourceText: '', ...defaultOpts });
    assert.ok(result.success);
    assert.strictEqual(result.formattedText, '');
  });

  test('語法錯誤 JS → success: false，formattedText: null', async () => {
    const input = 'function foo( { invalid syntax {{{{';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.formattedText, null);
    assert.ok(result.error instanceof Error);
  });
});

suite('DocumentFormatter (US2 自訂語法整合測試)', () => {
  const formatter = new DocumentFormatter();
  const defaultOpts = { tabSize: 2, insertSpaces: true };

  test('{ALL:...} 格式化後第一行仍為 {ALL: 不被拆行', async () => {
    const input = '{ALL:\n  doSomething();\n}\n';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success, `格式化失敗：${result.error?.message}`);
    const lines = result.formattedText!.split('\n');
    assert.ok(
      lines.some((l) => l.trim() === '{ALL:'),
      `輸出應包含 {ALL: 行，實際輸出：\n${result.formattedText}`
    );
  });

  test('中文鍵名 {初始化:...} 保持不變', async () => {
    const input = '{初始化:\n  doSomething();\n}\n';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success, `格式化失敗：${result.error?.message}`);
    assert.ok(
      result.formattedText!.includes('{初始化:'),
      `輸出應包含 {初始化:，實際輸出：\n${result.formattedText}`
    );
  });

  test('混合多個自訂區塊均保留', async () => {
    const input = [
      '{ALL:',
      '  step1();',
      '}',
      'const x = 1;',
      '{初始化:',
      '  step2();',
      '}',
      '',
    ].join('\n');
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success, `格式化失敗：${result.error?.message}`);
    assert.ok(result.formattedText!.includes('{ALL:'));
    assert.ok(result.formattedText!.includes('{初始化:'));
  });

  test('普通 JS 物件 { key: "value" } 仍依標準規則格式化', async () => {
    const input = 'const obj={key:"value"};';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.ok(result.success);
    assert.ok(result.formattedText!.includes('key:'));
  });

  test('語法錯誤檔案回傳 success: false 不拋出例外', async () => {
    const input = '{ALL:\n  doSomething();\n}\nconst x = {{{;\n';
    const result = await formatter.format({ sourceText: input, ...defaultOpts });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.formattedText, null);
  });
});
