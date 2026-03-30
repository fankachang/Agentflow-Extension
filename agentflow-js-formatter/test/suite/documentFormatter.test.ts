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
