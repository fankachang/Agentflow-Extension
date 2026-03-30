import * as assert from 'assert';
import { DocumentFormatter } from '../../src/formatter/documentFormatter';

suite('效能驗收 (SC-001)', () => {
  test('格式化 1000 行 JS 耗時 ≤ 500ms', async () => {
    const lines: string[] = [];
    for (let i = 0; i < 200; i++) {
      lines.push(`function fn${i}(a, b) {`);
      lines.push(`  const result = a + b;`);
      lines.push(`  console.log(result);`);
      lines.push(`  return result;`);
      lines.push(`}`);
    }
    const sourceText = lines.join('\n');
    assert.ok(sourceText.split('\n').length >= 1000, '測試字串應達 1000 行');

    const formatter = new DocumentFormatter();
    const start = Date.now();
    const result = await formatter.format({ sourceText, tabSize: 2, insertSpaces: true });
    const elapsed = Date.now() - start;

    assert.ok(result.success, `格式化失敗：${result.error?.message}`);
    assert.ok(elapsed <= 500, `格式化耗時 ${elapsed}ms，超過 500ms 上限`);
    console.log(`效能測試通過：1000 行格式化耗時 ${elapsed}ms`);
  });
});
