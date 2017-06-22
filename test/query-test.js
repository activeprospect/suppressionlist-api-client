const tap = require('tap'),
      Client = require('../');


tap.test('finds value', (t) => {
  const client = new Client('5bd2bcb21a69d255f302263f94a71818', 'staging');
  client.query('CG Test', 'foo', (err, result) => {
    if (err) throw err;
    console.log(result);
    t.end();
  });
});