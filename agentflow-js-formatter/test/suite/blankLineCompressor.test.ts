import * as assert from 'assert';
import { BlankLineCompressor } from '../../src/formatter/blankLineCompressor';

suite('BlankLineCompressor', () => {
  const compressor = new BlankLineCompressor();

  test('壓縮三行以上空白行為一行空白行', () => {
    const input = 'a\n\n\n\nb';
    const result = compressor.compress(input);
    assert.strictEqual(result, 'a\n\nb');
  });

  test('壓縮五行空白行為一行空白行', () => {
    const input = 'a\n\n\n\n\nb';
    const result = compressor.compress(input);
    assert.strictEqual(result, 'a\n\nb');
  });

  test('冪等性：compress(compress(x)) === compress(x)', () => {
    const input = 'a\n\n\n\nb\n\n\n\nc';
    const once = compressor.compress(input);
    const twice = compressor.compress(once);
    assert.strictEqual(once, twice);
  });

  test('無空白行的文字保持不變', () => {
    const input = 'a\nb\nc';
    assert.strictEqual(compressor.compress(input), input);
  });

  test('恰好兩行空白行（一個空白行）保持不變', () => {
    const input = 'a\n\nb';
    assert.strictEqual(compressor.compress(input), input);
  });

  test('空字串保持不變', () => {
    assert.strictEqual(compressor.compress(''), '');
  });
});
