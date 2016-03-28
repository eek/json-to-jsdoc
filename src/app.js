

function getUnique(array) {
  const u = {};
  const a = [];
  for (let i = 0, l = array.length; i < l; ++i) {
    if (u.hasOwnProperty(array[i])) continue;
    a.push(array[i]);
    u[array[i]] = 1;
  }
  return a;
}
/**
 *
 * @param {string} url - URL that must be checked.
 * @returns {boolean}
 * @constructor
 */
function validURL(url) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

  return (pattern.test(url));
}

/**
 * @param {String} url - The url where the request will be made.
 * @param callback
 */
function httpGetAsync(url, callback) {
  const reqUrl = `http://query.yahooapis.com/v1/public/yql?format=json
                  &q=${encodeURIComponent(`select * from json where url="${url}"`)}`;
  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function xmlReadyState() {
    // console.log(xmlHttp);
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      callback(JSON.parse(xmlHttp.responseText).query.results);
    }
  };
  xmlHttp.open('GET', reqUrl, true); // true for asynchronous
  xmlHttp.send();
}

/**
 * @param {*} value
 * @returns {string} currentType - lowerCased type of value
 */
function getTypeOfValue(value) {
  let currentType = Object.prototype.toString.call(value)
                      .split(' ')[1]
                      .slice(0, -1)
                      .toLowerCase();

  if (currentType === 'undefined') currentType = '*';

  return currentType;
}
/**
 * @param {Array} array - The array that we want to parse
 * @param {string} objectName - Usually the Prefix - Root do no have ObjectName
 */
function parseArray(array, objectName) {
  const currentArrayTypes = [];
  const prefix = objectName ? `${objectName}` : '';

  array.forEach(currentValue => {
    currentArrayTypes.push(`${getTypeOfValue(currentValue)}[]`);
  });

  if (!(objectName in this)) this[objectName] = [];
  this[objectName].push(getUnique(currentArrayTypes).join('|'));

  array.forEach(currentValue => {
    const currentValueType = getTypeOfValue(currentValue);

    if (currentValueType === 'array') {
      parseArray.bind(this, currentValue, prefix)();
    } else if (currentValueType === 'object') {
      parseObject.bind(this, currentValue, prefix, true)();
    }
  });
}
/**
 * @param {object} obj - The object that we want to parse
 * @param {string} objectName - Usually the Prefix - Root do no have ObjectName
 * @param {boolean} doNotReinsert - If we want to reinsert the type, usually when we parse
 * an array of objects, we do not want to reinsert.
 */
function parseObject(obj, objectName, doNotReinsert = false) {
  const prefix = objectName ? `${objectName}.` : '';

  Object.keys(obj).forEach(propertyName => {
    const currentValue = obj[propertyName];
    const propertyType = getTypeOfValue(currentValue);
    const currentPrefix = `${prefix}${propertyName}`;
    let result = null;

    // If it's Array, we need the values inside.
    if (propertyType === 'array') parseArray.bind(this, currentValue, currentPrefix)();
    else if (propertyType === 'object') parseObject.bind(this, currentValue, currentPrefix)();
    else {
      result = propertyType;
      if (!(currentPrefix in this)) this[currentPrefix] = [];
      this[currentPrefix].push(result);
    }
  });
  // Root Object doesn't have a objectName
  if (!doNotReinsert) {
    if (!(objectName in this)) this[objectName] = [];
    this[objectName].push('object');
  }
}

function ParseRootDefinition(obj) {
  const theObjectDefinition = {};
  // 0. A default name for our Definition
  const jsonDef = 'Response';
  // 1. What is the default type for our Definition?
  const jsonType = typeof obj;

  if (jsonType === 'array') parseArray.bind(theObjectDefinition, obj)();
  else if (jsonType === 'object') parseObject.bind(theObjectDefinition, obj)();
  // theObjectDefinition.jsonType =
  if (!(jsonDef in this)) this[jsonDef] = [];
  this[jsonDef].push(jsonType);

  console.log(theObjectDefinition);
}


/**
 * @param {Array} jsonObjects
 */
function goThroughAndParse(jsonObjects) {
  jsonObjects.forEach(obj => new ParseRootDefinition(obj));
}

function grabAndConvertJSONData() {
  // We get the value from the input field. It might be JSON or Links
  const json = document.getElementById('json-url-input').value;
  const jsonObjects = [];

  try {
    jsonObjects.push(JSON.parse(json));
  } catch (e) {
    // Let's brake by line and see if they are links.
    const URLs = json.split(/\r\n|\r|\n/g);
    const numberOfURLs = URLs.length;

    let i = 0;
    URLs.forEach(link => {
      const url = link.trim();

      if (validURL(url)) {
        httpGetAsync(url, (obj) => {
          // Increment when the request is ready.
          i++;
          // We need to push the object to an array to parse if multiple JSON's
          jsonObjects.push(obj);

          // We need to parse if we finished
          if (numberOfURLs === i) goThroughAndParse(jsonObjects);
        });
      } else {
        // If one of them is not an URL we still want to finish
        i++;
      }
    });
  }
}

window.grabAndConvertJSONData = grabAndConvertJSONData;


// var typeDef = `/** @typedef {${jsonType}} ${jsonDef} \n`;
//
// var typeDef = insertProperties( json );
//
// function insertProperties( obj, jsonDef ){
//     'use strict';
//     var currentTypeDef = '';
//
//     if ( getTypeOfValue( obj ) !== 'object') {
//         // console.error('Obj is not object:', obj);
//         return currentTypeDef;
//     }
//
//
//
//     Object.keys(obj).forEach(function(propertyName){
//
//         var currentValue = obj[propertyName];
//         var propertyType = getTypeOfValue( currentValue );
//         var finalProType = propertyType;
//         var prefix = jsonDef ? `${jsonDef}.` : '';
//
//         // If it's Array, we need the value of the array's, to specify it is an array
//         if( propertyType === 'array' ) {
//             currentValue = currentValue[0];
//             propertyType = getTypeOfValue(currentValue);
//             finalProType = propertyType + '[]';
//         }
//
//         currentTypeDef += `* @property {${finalProType}} ${prefix}${propertyName}\n`;
//
//         if (propertyType === 'object'){
//             currentTypeDef += insertProperties( currentValue, prefix + propertyName )
//         }
//     });
//
//     return currentTypeDef;
// }
//
// typeDef += `*/`;
//
// console.log( typeDef );
//
//
//
// function getTypeOfValue( value ){
//     var currentType = Object.prototype.toString.call(value).split(' ')[1].slice(0, -1).toLowerCase();
//
//     if ( currentType === 'undefined' ) currentType = '*';
//
//     return currentType;
// }
