const _       = require('lodash'),
      request = require('request');


class SuppressionListError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
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
        return callback(new SuppressionListError('Could not fetch lists', res.statusCode));
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
        return callback(new SuppressionListError('Could not create list', res.statusCode));
      }
      callback(null, body);
    })
  }

  ensureList(name, ttl, callback) {
    if (typeof ttl === 'function') {
      callback = ttl;
      ttl = null;
    }
    name = name.toLowerCase();
    this.getLists((err, lists) => {
      if (err) return callback(err);
      const list = lists.find((list) => {
        return list.name && list.name.toLowerCase() === name;
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

  query(name, value, callback) {
    if (!value) {
      process.nextTick(() => {
        callback(null, null);
      });
    }
    const opts = {
      uri: `/exists/${encodeURIComponent(name)}/values/${encodeURIComponent(value)}`,
      method: 'GET'
    };
    this._request(opts, (err, res, body) => {
      if (err) return callback(err);

      if (res.statusCode % 400 < 100) {
        callback(new SuppressionListError(body.error, res.statusCode));
      } else if (res.statusCode === 200) {
        callback(null, body)
      } else {
        callback(new SuppressionListError('Unknown response', res.statusCode));
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

    console.log("send", opts);

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