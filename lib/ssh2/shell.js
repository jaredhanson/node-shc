/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , Process = require('./process')
  , Upload = require('./upload')
  , util = require('util')
  , debug = require('debug')('shc:ssh');


/**
 * `Shell` constructor.
 *
 * @api protected
 */
function Shell(connection) {
  EventEmitter.call(this);
  this._connection = connection;
  
  this.host = connection._host;
  this.port = connection._port;
  this.username = connection._username;
}

/**
 * Inherit from `EventEmitter`.
 */
util.inherits(Shell, EventEmitter);

/**
 * Runs a command in the shell and buffers the output.
 *
 * The API exposed by this function mirrors that of Node's builtin
 * [Child Process](http://nodejs.org/api/child_process.html) module.
 *
 * The return value is "thenable" (as specified by Promises/A+).  This allows
 * command sequences to be invoked in `then()` chains, idiomatically making
 * asynchronous JavaScript appear similar to sequential Bash scripts.
 *
 * References:
 *   [Promises/A+](http://promises-aplus.github.io/promises-spec/)
 *
 * @param {String} command
 * @param {Object} options
 * @param {Function} cb
 * @return {Process}
 * @api public
 */
Shell.prototype.exec = function(command, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = {};
  }
  
  debug('%s@%s:%d$ %s', this.username, this.host, this.port, command);
  
  var process = new Process({ host: this.host, port: this.port, username: this.username }, cb);
  
  this._connection.exec(command, options, function(err, chan) {
    process.setup(err, chan);
  });
  
  return process;
}

/**
 * Upload file to the remote system.
 *
 * @param {String} src
 * @param {String} dest
 * @param {Function} cb
 * @return {Upload}
 * @api public
 */
Shell.prototype.put = function(src, dest, cb) {
  var upload = new Upload({ host: this.host, port: this.port, username: this.username }, cb);
  
  this._connection.sftp(function(err, sftp) {
    upload.setup(err, sftp);
    upload.start(src, dest);
  });
  
  return upload;
}


/**
 * Expose `Shell`.
 */
module.exports = Shell;
