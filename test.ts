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
