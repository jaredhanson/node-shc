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
    var isReady = false;
  
    c.once('connect', function() {
      debug('ssh connected');
    });
    
    c.once('ready', function() {
      debug('ssh ready');
      isReady = true;
      return cb(null, new Shell(c));
    });
    
    c.once('close', function(hadError) {
      if (!isReady) {
        return cb(new Error('SSH connection closed prior to being ready'));
      }
    });
  
    c.once('error', function(err) {
      isReady = true; // prevent close after error from triggering, this needs cleanup
      return cb(err);
    });
    
    options.host = host;
    options.port = port;
    
    debug('attempting ssh connection');
    c.connect(options);
  }
}
