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
const mainCollectionName = "StudentRecords"

const operationPasswordHash = "7c9646c6385ff8a32ece75e0b3ff778d007a26ca19a6d5d22bd5394d63e6ebd9";

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

//!!Check open status
function checkStatus() {
  return "open";
  //closed, readOnly etc.
}

//!!Check time room availability
function checkAvailability(room, time) {
  return true;
}

//insert entry function
function dbInsert(room, time, fullName, grade, studentID, ensemble, remark) {
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {room: room, time: time, fullName: fullName, grade: grade, studentID: studentID, ensemble: ensemble, remark: remark}

    //insert document
		dbo.collection(mainCollectionName).insertOne(myobj, function(err, res) {
      if (err) console.log(err);
      db.close();
      console.log("[DB] Entry " + myobj + " added");
    });
  });
  return
};

//Remove entry function
function dbRemove(fullName, studentID) {
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    
    //remove document
		dbo.collection(mainCollectionName).deleteOne({fullName: fullName, studentID: studentID}, function(err, obj) {
			if (err) console.log(err);
			console.log("[DB] One occurance of " + obj + " removed");
			db.close();
		});
	});
};

//Remove entry function
function dbForceRemove(room, time) {
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    
    //remove document
		dbo.collection(mainCollectionName).deleteOne({room: room, time: time}, function(err, obj) {
			if (err) console.log(err);
			console.log("[DB] One occurance of " + obj + " removed");
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
		dbo.collection(mainCollectionName).remove({}, function(err, result) {
			if (err) console.log(err);
			console.log("[DB] Removed all entry");
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
// console.log("password hash: " + crypto.createHmac('sha256', "string").digest('hex'));
// console.log(dbCheck("124543"))

// dbInsert("19:00-19:30", "MH103", "Leon Lu", "10", "2220056", true, "Some other names");
// dbRemove("Leon Lu", "2220056");
// dbRemoveAll();

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

// console.log(SHALL24("Leon Lu" + "82234"))
// console.log(SHALL24("oisudf" + "38789123"))
// console.log(SHALL24("NDIdadsf" + "22200123"))
// console.log(SHALL24("OIejw" + "2346213"))



//=================
//====Temporary====
//=================
app.get("/", function(req, res){
  res.render('index');
});