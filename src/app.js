function checkIfNeededToAddUndefinedType(obj, objectKey) {
  const temporaryObject = {};
  let maxLenghtOfObject = 0;

  Object.keys(obj).forEach(currentKey => {
    // check if it's our Object,
    // like awards.editions in awards.editions.outcome
    if (~currentKey.indexOf(objectKey) && currentKey !== objectKey) {
      temporaryObject[currentKey] = obj[currentKey];
    }
  });

  // We need to check the local maximum
  Object.keys(temporaryObject).forEach(key => {
    const currentKeyLength = temporaryObject[key].length;

    if (currentKeyLength > maxLenghtOfObject) maxLenghtOfObject = currentKeyLength;
  });

  // If the maximum is bigger than the current value,
  // but only one child in, we can also have an undefined.
  Object.keys(temporaryObject).forEach(key => {
    if (key.split('.').length < 2) {
      if (maxLenghtOfObject > temporaryObject[key].length) {
        this[key].push('undefined');
      }
    }
  });
}


function keepUniqueTypes(obj, jsonObjects) {
  const temporaryObject = obj;
  const remainingObject = {};
  const numberOfJSONDefinitions = jsonObjects.length;

  Object.keys(obj).forEach(objectKey => {
    if (!~objectKey.indexOf('.')) {
      if (obj[objectKey].length < numberOfJSONDefinitions) {
        temporaryObject[objectKey].push('undefined');
      }
    }

    obj[objectKey].forEach(anyValue => {
      if (anyValue === 'object' || anyValue === 'object[]') {
        checkIfNeededToAddUndefinedType.bind(temporaryObject, obj, objectKey)();
      }
    });
  });

  Object.keys(temporaryObject).forEach(key => {
    remainingObject[key] = getUnique(temporaryObject[key]);
  });

  return remainingObject;
}


/**
 * @param {Array} array - The array that needs to be ded-duplicated
 * @returns {Array}
 */
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
    let results = {};

    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      results = JSON.parse(xmlHttp.responseText).query.results;

      if (!results) { throw Error(`Could not retrieve URL (${reqUrl}`); }
      callback(results.json || results);
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

  if (!currentType) currentType = '*';

  return currentType[0].toUpperCase() + currentType.substr(1);
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
  // Root Object don't have a objectName
  if (!doNotReinsert && objectName) {
    if (!(objectName in this)) this[objectName] = [];
    this[objectName].push('object');
  }
}

function ParseRootDefinition(obj) {
  // 1. What is the default type for our Definition?
  const jsonType = typeof obj;

  if (jsonType === 'array') parseArray.bind(this, obj)();
  else if (jsonType === 'object') parseObject.bind(this, obj)();
}

/**
 * @param {Object} obj
 * @param {Object[]} jsonObjects
 */
function printTheTypeDef(obj, jsonObjects) {
  let output = '';
  // 0. A default name for our Definition
  const jsonDef = 'json';
  const jsonTypes = [];

  Object.keys(jsonObjects).forEach(key => {
    jsonTypes.push(getTypeOfValue(jsonObjects[key]));
  });

  output = `/**\n * @typedef {${getUnique(jsonTypes)}} ${jsonDef} \n`;

  Object.keys(obj).sort().forEach(key => {
    output += ` * @property {${obj[key].join('|')}} ${key} \n`;
  });

  output += ' */';

  window.output.getDoc().setValue(output);
}

/**
 * @param {Array} jsonObjects
 */
function goThroughAndParse(jsonObjects) {
  const theObjectDefinition = {};

  jsonObjects.forEach(obj => ParseRootDefinition.bind(theObjectDefinition, obj)());

  printTheTypeDef(keepUniqueTypes(theObjectDefinition, jsonObjects), jsonObjects);
}


function grabAndConvertJSONData() {
  // We get the value from the input field. It might be JSON or Links
  const json = window.input.getValue('');
  const jsonObjects = [];

  try {
    jsonObjects.push(JSON.parse(json));
    goThroughAndParse(jsonObjects);
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
