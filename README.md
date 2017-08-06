cup-parser
==============================================================================

[![Build Status](https://travis-ci.org/Turbo87/cup-parser.svg?branch=master)](https://travis-ci.org/Turbo87/cup-parser)

CUP waypoint and task file parser


Install
------------------------------------------------------------------------------

```bash
npm install --save cup-parser
```

or using [`yarn`](https://yarnpkg.com/):

```bash
yarn add cup-parser
```


Usage
------------------------------------------------------------------------------

```js
const fs = require('fs');
const parse = require('cup-parser');

let result = parse(fs.readFileSync('waypoints.cup', 'utf8'));
```

For more examples have a look at our [test suite](test.ts).


License
------------------------------------------------------------------------------

cup-parser is licensed under the [MIT License](LICENSE).
