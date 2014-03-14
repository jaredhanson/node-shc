/**
 * Module dependencies.
 */
var Shell = require('./shell')
  , Connection = require('ssh2')
  , debug = require('debug')('shc');


/**
 * Secure Shell (SSH) protocol.
 *
 * This module implements support for establishing remote shell connections
 * using SSH 2.0.
 *
 * References:
 *   [Secure Shell](http://en.wikipedia.org/wiki/Secure_Shell)
 *   [OpenSSH](http://www.openssh.com/)
 *
 * @api public
 */
module.exports = function(options) {
  
  return function ssh2(port, host, options, cb) {
    port = port || 22;
    
    var c = new Connection();
  
    c.once('connect', function() {
      debug('ssh connected');
    });
    
    c.once('ready', function() {
      debug('ssh ready');
      return cb(null, new Shell(c));
    });
  
    c.once('error', function(err) {
      return cb(err);
    });
    
    options.host = host;
    options.port = port;
    
    debug('attempting ssh connection');
    c.connect(options);
  }
}
