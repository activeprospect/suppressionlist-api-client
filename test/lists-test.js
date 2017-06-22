const tap    = require('tap'),
      nock   = require('nock'),
      Client = require('../');

tap.test('get lists', (t) => {
  const sl = nock('http://suppressionlist.dev')
    .get('/lists')
    .reply(200, [
      {
        "id": "54f495b34efbbe5e44000001",
        "name": "Duplicate Check",
        "url_name": "duplicate_check",
        "type": "md5",
        "ttl": 2592000,
        "count": 770,
        "total_jobs": 1
      },
      {
        "id": "53c95bb14efbbe8fca000004",
        "name": "Email",
        "url_name": "email",
        "type": "md5",
        "ttl": null,
        "count": 8,
        "total_jobs": 1
      }
    ]);
  const client = new Client('asdf', 'test');
  client.getLists((err, lists) => {
    if (err) throw err;
    t.equal(lists.length, 2);

    t.equal(lists[0].id, '54f495b34efbbe5e44000001');
    t.equal(lists[0].name, 'Duplicate Check');
    t.equal(lists[0].url_name, 'duplicate_check');
    t.equal(lists[0].type, 'md5');
    t.equal(lists[0].ttl, 2592000);
    t.equal(lists[0].count, 770);
    t.equal(lists[0].total_jobs, 1);

    t.equal(lists[1].id, '53c95bb14efbbe8fca000004');
    t.equal(lists[1].name, 'Email');
    t.equal(lists[1].url_name, 'email');
    t.equal(lists[1].type, 'md5');
    t.equal(lists[1].ttl, null);
    t.equal(lists[1].count, 8);
    t.equal(lists[1].total_jobs, 1);
    
    sl.done();
    nock.cleanAll();
    t.end();
  });
});


tap.test('create list', (t) => {
  const sl = nock('http://suppressionlist.dev')
    .post('/lists')
    .reply(201, {
        "id": "594bee48b0c345a49d04caef",
        "name": "Foo Bar",
        "url_name": "foo_bar",
        "type": "md5",
        "ttl": 123,
        "count": 0,
        "total_jobs": 0
      });
  const client = new Client('asdf', 'test');
  client.createList('Foo Bar', (err, list) => {
    if (err) throw err;

    t.equal(list.id, '594bee48b0c345a49d04caef');
    t.equal(list.name, 'Foo Bar');
    t.equal(list.url_name, 'foo_bar');
    t.equal(list.type, 'md5');
    t.equal(list.ttl, 123);
    t.equal(list.count, 0);
    t.equal(list.total_jobs, 0);
    
    sl.done();
    nock.cleanAll();
    t.end();
  });
});


tap.test('ensure list does nothing when list exists', (t) => {
  const sl = nock('http://suppressionlist.dev')
    .get('/lists')
    .reply(200, [
      {
        "id": "54f495b34efbbe5e44000001",
        "name": "Duplicate Check",
        "url_name": "duplicate_check",
        "type": "md5",
        "ttl": 2592000,
        "count": 770,
        "total_jobs": 1
      },
      {
        "id": "53c95bb14efbbe8fca000004",
        "name": "Email",
        "url_name": "email",
        "type": "md5",
        "ttl": null,
        "count": 8,
        "total_jobs": 1
      }
    ]);
  const client = new Client('asdf', 'test');
  client.ensureList('Email', (err, list) => {
    if (err) throw err;

    t.equal(list.id, '53c95bb14efbbe8fca000004');
    t.equal(list.name, 'Email');
    t.equal(list.url_name, 'email');
    t.equal(list.type, 'md5');
    t.equal(list.ttl, null);
    t.equal(list.count, 8);
    t.equal(list.total_jobs, 1);
    
    sl.done();
    nock.cleanAll();
    t.end();
  });
});


tap.test('ensure list creates a list when it does not exist', (t) => {
  const sl = nock('http://suppressionlist.dev')
    .get('/lists')
    .reply(200, [
      {
        "id": "54f495b34efbbe5e44000001",
        "name": "Duplicate Check",
        "url_name": "duplicate_check",
        "type": "md5",
        "ttl": 2592000,
        "count": 770,
        "total_jobs": 1
      },
      {
        "id": "53c95bb14efbbe8fca000004",
        "name": "Email",
        "url_name": "email",
        "type": "md5",
        "ttl": null,
        "count": 8,
        "total_jobs": 1
      }
    ])
    .post('/lists')
    .reply(201, {
      "id": "594bee48b0c345a49d04caef",
      "name": "Foo Bar",
      "url_name": "foo_bar",
      "type": "md5",
      "ttl": 123,
      "count": 0,
      "total_jobs": 0
    });

  const client = new Client('asdf', 'test');
  client.ensureList('Foo Bar', (err, list) => {
    if (err) throw err;

    t.equal(list.id, '594bee48b0c345a49d04caef');
    t.equal(list.name, 'Foo Bar');
    t.equal(list.url_name, 'foo_bar');
    t.equal(list.type, 'md5');
    t.equal(list.ttl, 123);
    t.equal(list.count, 0);
    t.equal(list.total_jobs, 0);

    sl.done();
    nock.cleanAll();
    t.end();
  });
});


tap.test('ensure list is not case sensitive', (t) => {
  const sl = nock('http://suppressionlist.dev')
    .get('/lists')
    .reply(200, [
      {
        "id": "54f495b34efbbe5e44000001",
        "name": "Duplicate Check",
        "url_name": "duplicate_check",
        "type": "md5",
        "ttl": 2592000,
        "count": 770,
        "total_jobs": 1
      },
      {
        "id": "53c95bb14efbbe8fca000004",
        "name": "Email",
        "url_name": "email",
        "type": "md5",
        "ttl": null,
        "count": 8,
        "total_jobs": 1
      }
    ]);
  const client = new Client('asdf', 'test');
  client.ensureList('email', (err, list) => {
    if (err) throw err;

    t.equal(list.id, '53c95bb14efbbe8fca000004');
    t.equal(list.name, 'Email');
    t.equal(list.url_name, 'email');
    t.equal(list.type, 'md5');
    t.equal(list.ttl, null);
    t.equal(list.count, 8);
    t.equal(list.total_jobs, 1);

    sl.done();
    nock.cleanAll();
    t.end();
  });
});