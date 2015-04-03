var Q = require('q');
var fetchJSON = require('./fetchJSON.js');
var customError = require('./customError.js');

/**                                                                              
 * Represents an error that has both a name and message.
 * @param {String} name - the name/type of the error
 * @param {String} message - the corresponding message
 * Mainly used to avoid crashing the program, as it does with regular errors.
 */
function CustomError(name, message) {
  this.name = name;
  this.message = message;
}

/** 
 * Attempts to access configuration file data for the shared extension
 *   If this is the first time accessing this said extension, then it creates
 *   a new sharedExtension "object" and its relevant underlying data structures,
 *   adds it to the array of extsInUse and returns it.
 *   Simply returns the object in extsInUse if already previously created. This
 *   is done so that the busy data of the trunk will be used when 
 *   getSharedExtension is called by another user when a call is in session.
 * @param {string} confFile - the path and filename to the configuration file
 * @param {string} name - the name of the sharedExtension to access
 * @return {Q} - Q promise object
 */

var getSharedExtension = function(confFile, name) {
  var defer = Q.defer();
  var sharedExtension = {};
  sharedExtension.found = false;
  fetchJSON(confFile).then(function(data) {
    data.sharedExtensions.some(function(extension, i) {
      if (extension[name]) {
        sharedExtension.name = name;
        sharedExtension.busy = false;
        sharedExtension.getAllTrunks = getAllTrunks;
        sharedExtension.getAllStations = getAllStations;
        sharedExtension.stations = extension[sharedExtension.name].stations;
        sharedExtension.trunks = extension[sharedExtension.name].trunks;
        sharedExtension.pos = i;
        sharedExtension.found = true;
      }
    });
    if (!sharedExtension.found) {
      defer.reject(new customError.CustomError('InvalidExtension',
          'Invalid specified extension: ' + name));
    } else {
      defer.resolve(sharedExtension);
    }
  })
  .catch(function (err) {
    defer.reject(new customError.CustomError('InvalidConfiguration',
        err.message));
  });
  return defer.promise;
};

/** 
 * Returns all trunks that are under a sharedExtension
 * @return {Q} - Q promise object
 */
var getAllTrunks = function() {
  return Q.resolve(this.trunks);
};

  
/** 
 * Returns all stations that are under a sharedExtension
 * @return {Q} - Q promise object
 */
var getAllStations = function() {
  return Q.resolve(this.stations);
};

module.exports = {
  getSharedExtension: getSharedExtension
};
