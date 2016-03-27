
// 0. What is the name of your Definition?
var jsonDef = 'userData';
// 1. What is the JSON ?
var jsonType = typeof json;

var typeDef = `/** @typedef {${jsonType}} ${jsonDef} \n`;

typeDef += insertProperties( json );

function insertProperties( obj, jsonDef ){
    'use strict';
    var currentTypeDef = '';

    if ( getType( obj ) !== 'object') {
        // console.error('Obj is not object:', obj);
        return currentTypeDef;
    }



    Object.keys(obj).forEach(function(propertyName){

        var currentValue = obj[propertyName];
        var propertyType = getType( currentValue );
        var finalProType = propertyType;
        var prefix = jsonDef ? `${jsonDef}.` : '';

        // If it's Array, we need the value of the array's, to specify it is an array
        if( propertyType === 'array' ) {
            currentValue = currentValue[0];
            propertyType = getType(currentValue);
            finalProType = propertyType + '[]';
        }

        currentTypeDef += `* @property {${finalProType}} ${prefix}${propertyName}\n`;

        if (propertyType === 'object'){
            currentTypeDef += insertProperties( currentValue, prefix + propertyName )
        }
    });

    return currentTypeDef;
}

typeDef += `*/`;

console.log( typeDef );



function getType( value ){
    var currentType = Object.prototype.toString.call(value).split(' ')[1].slice(0, -1).toLowerCase();

    if ( currentType === 'undefined' ) currentType = '*';

    return currentType;
}