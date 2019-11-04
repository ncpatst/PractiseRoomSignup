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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set("view engine", "ejs");
//disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})


//=================
//====Variables====
//=================
const port = 1770;
const url = "mongodb://localhost:27017";
const dbName = "PractiseRoomSignup";

const operationPasswordHash = "ac1082fe70f1a1ec37cb54a3038e8b45dd5f242800eb8415eeaa06e85869d3a6";

var SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex');

//=================
//====Functions====
//=================
//HASH ALGORITHM
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

//insert entry function
function dbInsert(time, firstName, lastName, year, studentID) {
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {Time: time, FirstName: firstName, LastName: lastName, Year: year, StudentID: studentID};

    //insert document
		dbo.collection("studentRecords").insertOne(myobj, function(err, res) {
      if (err) console.log(err);
      console.log("Entry added");
			db.close();
		});
  });
  return
};

//Remove entry function
function dbRemove(studentID) {
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    
    //remove document
		dbo.collection("studentRecords").deleteOne({StudentID: studentID}, function(err, obj) {
			if (err) console.log(err);
			console.log("Entry removed");
			db.close();
		});
	});
};

//Remove all function
function dbRemoveAll() {
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    
    //remove document
		dbo.collection("studentRecords").remove({}, function(err, result) {
			if (err) console.log(err);
			console.log("Removed all");
			db.close();
		});
	});
};

//Listen
app.listen(port, function(){
  console.log("app started on port" + port);
});


//=================
//====Test Zone====
//=================
// console.log(crypto.createHmac('sha256', "string").digest('hex'));
// dbInsert("07:00-08:00", "Leon", "Lu", "10", "2220067");
// dbRemove("2220067");
// console.log(dbCheck("124543"))
// dbRemoveAll()

//// *Read data from file*
//// 1
// fs.readFile("SERVERKEY", "utf8", function(error, data) {
//   console.log(data);
// });
//// 2
// var SERVERKEY = fs.readFileSync("SERVERKEY.txt", "utf8");
// console.log(data);

//// *Cryto*
// console.log(crypto.createHmac('sha256', "string").digest('hex'));

console.log(SHALL24("Leon Lu" + "2220056"))