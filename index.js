const _       = require('lodash'),
      request = require('request');


class SuppressionListError extends Error {
  constructor(message, statusCode, body) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
  }
}


class Client {
  constructor(apiKey, env) {
    let baseUrl;
    if (env === 'production')
      baseUrl = 'https://app.suppressionlist.com';
    else if (env === 'staging')
      baseUrl = 'http://staging.suppressionlist.com';
    else
      baseUrl = 'http://suppressionlist.dev';

    this.base = {
      url: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${new Buffer(`X:${apiKey}`).toString('base64')}`
      }
    };
  }

  getLists(callback) {
    this._request({ method: 'GET', uri: '/lists' }, (err, res, body) => {
      if (err) return callback(err);
      if (res.statusCode !== 200) {
        return callback(new SuppressionListError('Could not fetch lists', res.statusCode, body));
      }
      callback(null, body);
    })
  }

  createList(name, ttl, callback) {
    if (typeof ttl === 'function') {
      callback = ttl;
      ttl = null;
    }
    const list = { name, ttl };
    this._request({ method: 'POST', uri: '/lists', body: list }, (err, res, body) => {
      if (err) return callback(err);
      if (res.statusCode !== 201) {
        return callback(new SuppressionListError('Could not create list', res.statusCode, body));
      }
      callback(null, body);
    })
  }

  ensureList(name, ttl, callback) {
    if (typeof ttl === 'function') {
      callback = ttl;
      ttl = null;
    }
    const lowerCaseName = name.toLowerCase();
    this.getLists((err, lists) => {
      if (err) return callback(err);
      const list = lists.find((list) => {
        return list.name && list.name.toLowerCase() === lowerCaseName;
      });
      if (!list) {
        this.createList(name, ttl, callback)
      } else {
        process.nextTick(() => {
          callback(null, list);
        });
      }
    });
  }

  _request(options, callback) {
    const opts = {
      url: `${this.base.url}${options.uri}`,
      method: options.method,
      headers: _.merge({}, this.base.headers, options.headers)
    };

    if (options.query) {
      opts.qs = options.query;
    }

    if (options.body) {
      let body = options.body;
      if (_.isPlainObject(body)) {
        body = JSON.stringify(body);
      }
      opts.body = body;
      opts.headers['Content-Type'] = 'application/json';
    }

    request(opts, (err, res, body) => {
      if (err) return callback(err);
      const contentType = res.headers['content-type'];
      if (contentType && contentType.indexOf('json') > -1 && _.isString(body))  {
        try {
          body = JSON.parse(body);
        } catch (err) {
          return callback(err);
        }
      }
      callback(null, res, body);
    });
  }
}

module.exports = Client;