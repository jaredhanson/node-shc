/**
 * Module dependencies.
 */
var debug = require('debug')('shc');


/**
 * `Factory` constructor.
 *
 * @api public
 */
function Factory() {
  this._order = [];
  this._protocols = {};
}

/**
 * Add a remote shell protocol.
 *
 * Examples:
 *
 *     factory.use(shc.ssh2());
 *
 * @param {String} name
 * @param {Function} protocol
 * @api public
 */
Factory.prototype.use = function(name, protocol) {
  if (typeof name == 'function') {
    protocol = name;
    name = protocol.name;
  }
  
  this._order.push(name);
  this._protocols[name] = protocol;
}

/**
 * Establish a remote shell connection.
 *
 * Examples:
 *
 *     network.connect({ host: '127.0.0.1', port: 22 }, function(err, shell) {
 *     });
 *
 * @param {Number|Object} port
 * @param {String} host
 * @param {Object} options
 * @param {Function} cb
 * @api public
 */
Factory.prototype.connect = function(port, host, options, cb) {
  if (typeof port == 'object') {
    cb = host;
    options = port;
    host = options.host;
    port = options.port;
  }
  
  var self = this
    , order = options.protocols || this._order
    , attempt = []
    , idx = 0;
  
  function next(err, sh) {
    if (err) {
      if (err.code && err.code == 'ECONNREFUSED') {
        // ignore error, continue trying other protocols
        debug(attempt[attempt.length - 1] + ' connection refused');
      } else {
        return cb(err);
      }
    }
    if (sh) { return cb(null, sh); }

    var key = order[idx++]
      , proto = self._protocols[key];
    // all done
    if (!key) { return cb(new Error('Unable to connect to "' + host + '". Attempted ' + attempt.join(', ') + ' protocols.')); }
    // unknown protocol
    if (!proto) { return next(); }

    try {
      debug('%s', key || 'anonymous');
      attempt.push(key);
      proto(port, host, options, next);
    } catch (ex) {
      next(ex);
    }
  }
  next();
}


/**
 * Expose `Factory`.
 */
module.exports = Factory;
