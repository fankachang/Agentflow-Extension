import * as assert from 'assert';
import { CustomBlockDetector } from '../../src/formatter/customBlockDetector';

suite('CustomBlockDetector', () => {
  const detector = new CustomBlockDetector();

  test('英文鍵名偵測：{ALL: ...} 正確偵測一個區塊', () => {
    const source = '{ALL:\n  doSomething();\n}';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].index, 0);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 2);
    assert.strictEqual(blocks[0].originalText, source);
    assert.strictEqual(blocks[0].placeholder, '__AGENTFLOW_BLOCK_0__');
  });

  test('中文鍵名偵測：{初始化: ...} 正確偵測一個區塊', () => {
    const source = '{初始化:\n  doSomething();\n}';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 2);
  });

  test('字串內的 {KEY: 不觸發（template literal 跨行）', () => {
    // {KEY: 出現在 template literal 內部，不應觸發偵測
    const source = 'const x = `\n{KEY:\n  doSomething();\n}`;';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 0);
  });

  test('單行註解內的 {KEY: 不觸發', () => {
    // 以 // 開頭的行不符合正則，不觸發偵測
    const source = '// {KEY:\n//   doSomething();\n// }';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 0);
  });

  test('多行區塊註解內的 {KEY: 不觸發', () => {
    const source = '/*\n{KEY:\n  doSomething();\n}\n*/';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 0);
  });

  test('extract() → restore() round-trip：還原後與原始文字完全相同', () => {
    const source = 'before\n{KEY:\n  doSomething();\n}\nafter';
    const { extractedText, blocks } = detector.extract(source);
    assert.ok(blocks.length === 1);
    assert.ok(extractedText !== source);
    const restored = detector.restore(extractedText, blocks);
    assert.strictEqual(restored, source);
  });

  test('巢狀大括號 brace depth：正確找到結尾行', () => {
    const source = '{KEY:\n  if(x) {\n    foo();\n  }\n}';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].startLine, 0);
    assert.strictEqual(blocks[0].endLine, 4);
    assert.strictEqual(blocks[0].originalText, source);
  });

  test('不含自訂語法：detect() 回傳空陣列，extractedText === sourceText', () => {
    const source = 'function foo() {\n  return 1;\n}\nconst x = 42;';
    const blocks = detector.detect(source);
    assert.strictEqual(blocks.length, 0);
    const { extractedText } = detector.extract(source);
    assert.strictEqual(extractedText, source);
  });

  test('多個區塊：正確提取與還原', () => {
    const source = '{BLOCK_A:\n  a();\n}\n{BLOCK_B:\n  b();\n}';
    const { extractedText, blocks } = detector.extract(source);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].placeholder, '__AGENTFLOW_BLOCK_0__');
    assert.strictEqual(blocks[1].placeholder, '__AGENTFLOW_BLOCK_1__');
    assert.ok(extractedText.includes('__AGENTFLOW_BLOCK_0__'));
    assert.ok(extractedText.includes('__AGENTFLOW_BLOCK_1__'));
    const restored = detector.restore(extractedText, blocks);
    assert.strictEqual(restored, source);
  });
});
