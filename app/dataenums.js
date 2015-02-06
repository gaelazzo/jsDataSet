/**
 * Returns a functions that fills some enumeration of dsSpace
 */
/* globals angular */
'use strict';

/**
 * provides DataRow enumeration constants
 * @module DataSet
 * @submodule dataenums
 */
(function (isNode, isAngular) {


  /**
   * Enumerates possible state of a DataRow: detached, deleted, added, unchanged, modified
   * @type {dataRowState}
   */
  var dataRowStateConstant = {
      detached: "detached",
      deleted: "deleted",
      added: "added",
      unchanged: "unchanged",
      modified: "modified"
    },

    /**
     * Enumerates possible version of a DataRow field: original, current
     * @type {dataRowVersion}
     */  dataRowVersionConstant = {
      original: "original",
      current: "current"
    };


  if (isAngular) {
    // AngularJS module definition
    angular.module('dataset.dataenums', [])
      .constant('dataRowState', dataRowStateConstant)
      .constant('dataRowVersion', dataRowStateConstant);
  } else if (isNode) {
    // NodeJS module definition
    module.exports = {
      dataRowState: dataRowStateConstant,
      dataRowVersion: dataRowVersionConstant
    };
  }

})(typeof module !== 'undefined' && module.exports,
    typeof angular !== 'undefined');