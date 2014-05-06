/**
 * Module dependencies.
 */
var EventEmitter = require('events').EventEmitter
  , Deferred = require('promise-deferred')
  , util = require('util')
  , debug = require('debug')('shc:ssh');


/**
 * `Upload` constructor.
 *
 * @api protected
 */
function Upload(options, cb) {
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
util.inherits(Upload, EventEmitter);

/**
 * Setup upload.
 *
 * @api protected
 */
Upload.prototype.setup = function(err, sftp) {
  if (err) { return this._fini(err); }
  this._sftp = sftp;

  var self = this;
  
  this._sftp.on('timeout', function() {
    var err = new Error('Timed out');
    err.code = 'ETIMEDOUT';
    self._fini(err);
  });
  
  this._sftp.on('error', function(err) {
    self._fini(err);
  });
}

/**
 * Start upload.
 *
 * @api protected
 */
Upload.prototype.start = function(src, dest, options) {
  debug('%s@%s:%d$ PUT %s %s', this._username, this._host, this._port, src, dest);

  var self = this
    , ppct = 0;

  function progress(sum, chunk, total) {
    var pct = Math.floor((sum / total) * 100);
    if (pct != ppct) {
      debug('%s@%s:%d$ PUT %s%% %s %s', self._username, self._host, self._port, pct, src, dest);
      ppct = pct;
    }
    
    // TODO: Investigate progress extension to Promises/A+
    //       https://github.com/promises-aplus/progress-spec
  }
  options.step = progress;

  this._sftp.fastPut(src, dest, options, function(err) {
    self._fini(err, dest);
    self.emit('done');
  });
}

/**
 * Finalize upload.
 *
 * @api private
 */
Upload.prototype._fini = function(err, dest) {
  // dispose SFTP connection
  if (this._sftp) {
    this._sftp.end();
    this._sftp = null;
  }
  
  // TODO: How should this operate in relation to promises?
  //if (err) { this.emit('error', err); }
  
  if (this._callback) {
    this._callback(err);
  }
  
  if (err) {
    this._deferred.reject(err);
  } else {
    this._deferred.resolve(dest);
  }
}


/**
 * Expose `Upload`.
 */
module.exports = Upload;
