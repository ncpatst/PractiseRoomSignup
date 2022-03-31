//===================
//====NodeJS Head====
//===================
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const CronJob = require('cron').CronJob;

// Get the list from http://beautifytools.com/excel-to-json-converter.php by uploading the xlsx file, only take the value of "Sheet1".

//|================================================================|
//|====Input Data Table Below======================================|
//|================================================================|

const fromExcel = [
  {
      "Name": "First Last",
      "fullName": "First Last",
      "studentID": "981273"
  },
  {
      "Name": "First Last2",
      "fullName": "First Last2",
      "studentID": "212394"
  }
]

//|================================================================|
//|====Input Data Table Above======================================|
//|================================================================|



// Get key from SERVERKEY.txt, DO NOT share this file
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); 

// HASH ALGORITHM
function SHALL24(string) {
  function convertBase(str, fromBase, toBase) {

    const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";

    const add = (x, y, base) => {
        let z = [];
        const n = Math.max(x.length, y.length);
        let carry = 0;
        let i = 0;
        while (i < n || carry) {
            const xi = i < x.length ? x[i] : 0;
            const yi = i < y.length ? y[i] : 0;
            const zi = carry + xi + yi;
            z.push(zi % base);
            carry = Math.floor(zi / base);
            i++;
        }
        return z;
    }
  
    const multiplyByNumber = (num, x, base) => {
        if (num < 0) return null;
        if (num == 0) return [];
  
        let result = [];
        let power = x;
        while (true) {
            num & 1 && (result = add(result, power, base));
            num = num >> 1;
            if (num === 0) break;
            power = add(power, power, base);
        }
  
        return result;
    }
  
    const parseToDigitsArray = (str, base) => {
        const digits = str.split('');
        let arr = [];
        for (let i = digits.length - 1; i >= 0; i--) {
            const n = DIGITS.indexOf(digits[i])
            if (n == -1) return null;
            arr.push(n);
        }
        return arr;
    }
  
    const digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;
  
    let outArray = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        digits[i] && (outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase));
        power = multiplyByNumber(fromBase, power, toBase);
    }
  
    let out = '';
    for (let i = outArray.length - 1; i >= 0; i--)
        out += DIGITS[outArray[i]];
  
    return out;
  }
  return convertBase(crypto.createHmac('sha256', crypto.createHmac('sha256', string + SERVERKEY).digest('hex') + SERVERKEY).digest('hex'), 16, 32).substr(0, 6);
}

// Construct password list
var passwordList = ""
for (var i = 0; i < fromExcel.length; i++) {
  var password = SHALL24(fromExcel[i].fullName + fromExcel[i].studentID);
  passwordList = passwordList + password + "\n"
}

// Copy the console output and past it inside a txt file, then import the txt file into excel.
console.log(passwordList);