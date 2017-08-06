import {parseDuration} from './index';

import fs = require('fs');
import parse = require('.');

const DATA_PATH = `${__dirname}/data`;

const files = fs.readdirSync(`${DATA_PATH}`).filter(filename => (/\.cup$/).test(filename));

for (let filename of files) {
  test(filename, () => {
    let content = fs.readFileSync(`${DATA_PATH}/${filename}`, 'utf8');
    let result = parse(content);
    expect(result).toMatchSnapshot(filename);
  });
}

describe('parseDuration()', () => {
  const TESTS = [
    ['00', 0],
    ['00:00', 0],
    ['00:00:00', 0],
    ['01', 1],
    ['00:01', 1],
    ['00:00:01', 1],
    ['01:00', 60],
    ['00:01:00', 60],
    ['1:00:00', 60 * 60],
    ['01:00:00', 60 * 60],
    ['12:34:56', 12 * 60 * 60 + 34 * 60 + 56],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${expected} sec`, () => {
      expect(parseDuration(input as string)).toEqual(expected);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseDuration(undefined)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseDuration('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseDuration('ab:cd:de')).toThrow();
  });
});
