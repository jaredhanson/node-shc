/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , Deferred = require('promise-deferred')
  , Buffers = require('buffers')
  , util = require('util')
  , debug = require('debug')('shc:ssh');


/**
 * `Process` constructor.
 *
 * @api protected
 */
function Process(options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  EventEmitter.call(this);
  
  this._callback = cb;
  this._deferred = new Deferred();
  this.then = this._deferred.promise.then;
  
  this._host = options.host;
  this._port = options.port;
  this._username = options.username;
}

/**
 * Inherit from `EventEmitter`.
 */
util.inherits(Process, EventEmitter);

/**
 * Setup process.
 *
 * @api protected
 */
Process.prototype.setup = function(err, chan) {
  if (err) { return this._fini(err); }
  
  // TODO: Set up stdin, stdout, and stderr streams
  
  var self = this
    , output = new Buffers()
    , errput = new Buffers()
    , exitCode, exitSignal;
  
  chan.on('data', function(data, ext) {
    debug('%s@%s:%d %s', self._username, self._host, self._port, data.toString());
    
    (ext == 'stderr') ? errput.push(data) : output.push(data);
  });
  
  chan.once('exit', function(code, signal) {
    debug('%s@%s:%d {%d, %s}', self._username, self._host, self._port, code, signal);
    
    // NOTE: It has been observed that the underlying `ssh2.Channel` will often
    //       emit `data` events after `exit`.  As a workaround, we delay emitting
    //       `exit` until `close`, ensuring that all `data` events have been
    //       processed before `exit` is emitted.
    
    exitCode = code;
    exitSignal = signal;
  });
  
  chan.once('end', function() {
  });
  
  chan.once('close', function() {
    var error = null;
    var stdout = output.toString();
    var stderr = errput.toString();
    
    if (exitCode !== 0) {
      error = new Error('Command failed: ' + stderr.trim());
      error.code = exitCode;
      error.signal = exitSignal;
    }
    
    self._fini(error, stdout, stderr);
    self.emit('exit', exitCode, exitSignal);
    self.emit('close', exitCode, exitSignal);
  });
}

/**
 * Finalize process.
 *
 * @api private
 */
Process.prototype._fini = function(err, stdout, stderr) {
  // TODO: How should this operate in relation to promises?
  //if (err) { this.emit('error', err); }
  
  if (this._callback) {
    this._callback(err, stdout, stderr);
  }
  
  if (err) {
    this._deferred.reject(err);
  } else {
    this._deferred.resolve([stdout, stderr]);
  }
}


/**
 * Expose `Process`.
 */
module.exports = Process;
