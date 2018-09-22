import {
  parse,
  parseBoolean,
  parseDuration,
  parseHDistance,
  parseLatitude,
  parseLongitude,
  parseVDistance,
} from './index';

import fs = require('fs');

const DATA_PATH = `${__dirname}/data`;

const files = fs.readdirSync(`${DATA_PATH}`).filter(filename => (/\.cup$/).test(filename));

describe('parse()', () => {
  for (let filename of files) {
    test(filename, () => {
      let content = fs.readFileSync(`${DATA_PATH}/${filename}`, 'utf8');
      let result = parse(content);
      expect(result).toMatchSnapshot(filename);
    });
  }
});

describe('parseHDistance()', () => {
  const TESTS = [
    ['0m', { value: 0, unit: 'm' }],
    ['1m', { value: 1, unit: 'm' }],
    ['1.2m', { value: 1.2, unit: 'm' }],
    ['12345m', { value: 12345, unit: 'm' }],
    ['12.345km', { value: 12.345, unit: 'km' }],
    ['4.2nm', { value: 4.2, unit: 'nm' }],
    ['4.2ml', { value: 4.2, unit: 'ml' }],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${JSON.stringify(expected)}`, () => {
      expect(parseHDistance(input as string)).toEqual(expected);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseHDistance(undefined)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseHDistance('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseHDistance('1.2ft')).toThrow();
    expect(() => parseHDistance('m')).toThrow();
    expect(() => parseHDistance('1.2.3m')).toThrow();
  });
});

describe('parseVDistance()', () => {
  const TESTS = [
    ['0m', { value: 0, unit: 'm' }],
    ['1m', { value: 1, unit: 'm' }],
    ['1.2m', { value: 1.2, unit: 'm' }],
    ['12345m', { value: 12345, unit: 'm' }],
    ['12.345ft', { value: 12.345, unit: 'ft' }],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${JSON.stringify(expected)}`, () => {
      expect(parseVDistance(input as string)).toEqual(expected);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseVDistance(undefined)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseVDistance('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseVDistance('1.2nm')).toThrow();
    expect(() => parseVDistance('1.2km')).toThrow();
    expect(() => parseVDistance('1.2ml')).toThrow();
    expect(() => parseVDistance('m')).toThrow();
    expect(() => parseVDistance('1.2.3m')).toThrow();
  });
});

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

describe('parseBoolean()', () => {
  const TESTS = [
    ['true', true],
    ['True', true],
    ['TRUE', true],
    ['false', false],
    ['False', false],
    ['FALSE', false],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${expected}`, () => {
      expect(parseBoolean(input as string)).toEqual(expected);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseBoolean(undefined)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseBoolean('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseBoolean('foo')).toThrow();
  });
});

describe('parseLatitude()', () => {
  const TESTS = [
    ['0000.000N', 0],
    ['0000.000S', 0],
    ['1234.567N', 12.57612],
    ['4621.666N', 46.3611],
    ['4621.666S', -46.3611],
    ['9000.000N', 90],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${expected} deg`, () => {
      expect(parseLatitude(input as string)).toBeCloseTo(expected as number);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseLatitude(undefined as any)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseLatitude('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseLatitude('foo')).toThrow();
    expect(() => parseLatitude('1234.567E')).toThrow();
    expect(() => parseLatitude('9000.001N')).toThrow();
  });
});

describe('parseLongitude()', () => {
  const TESTS = [
    ['00000.000E', 0],
    ['00000.000W', 0],
    ['12345.678E', 123.7613],
    ['04621.666E', 46.3611],
    ['04621.666W', -46.3611],
    ['18000.000E', 180],
  ];

  for (let [input, expected] of TESTS) {
    test(`${input} -> ${expected} deg`, () => {
      expect(parseLongitude(input as string)).toBeCloseTo(expected as number);
    });
  }

  it('throws for undefined input', () => {
    expect(() => parseLongitude(undefined as any)).toThrow();
  });

  it('throws for empty input', () => {
    expect(() => parseLongitude('')).toThrow();
  });

  it('throws for invalid input', () => {
    expect(() => parseLongitude('foo')).toThrow();
    expect(() => parseLongitude('12345.678S')).toThrow();
    expect(() => parseLongitude('18000.001E')).toThrow();
  });
});
