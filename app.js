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
const port = 1770; //port that the app listen on
const url = "mongodb://localhost:27017"; //url to MongoDB
const dbName = "PractiseRoomSignup"; //database name to use
const mainCollectionName = "StudentRecords" //collection name to use for student signups

const openHour = 6 //the hour when signup opens; 0 <= openHour <= 23
const openMin = 30 //the minute when signup opens; 0 <= openMin <= 59
const closeHour = 15 //the hour when signup closes; 0 <= closeHour <= 23
const closeMin = 05 //the minute when signup closes; 0 <= closeMin <= 59
const readOnlyHour = 21 //the hour when signup read closes; 0 <= closeHour <= 23
const readOnlyMin = 30 //the minute when signup read closes; 0 <= closeMin <= 59

const operationPasswordHash = "7c9646c6385ff8a32ece75e0b3ff778d007a26ca19a6d5d22bd5394d63e6ebd9"; //set password using this, only put the hash in the source code, DO NOT put anything related to the password
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); //get key from SERVERKEY.txt, DO NOT share the file to anywhere

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

//Get time
function getDateTime() {
  var date = new Date();
  
	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
	var sec  = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;
	var milisec = date.getMilliseconds();
	milisec = ((milisec < 100) ? ((milisec < 10) ? "00" : "0") : "") + milisec;

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;
	var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  var timeArray = {year: year, month: month, day: day, hour: hour, min: min, sec: sec, milisec: milisec}
	return timeArray;
}

//Check open status
function checkOpenStatus() {
  var date = new Date();
	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  console.log("check open time: " + hour + ":" + min + ":" + sec)

  if ((hour > openHour || hour == openHour && min >= openMin) && (hour < closeHour || hour == closeHour && min < closeMin)) {
    return true
  }
  else {
    return false
  }
}

//Check read-only status
function checkReadStatus() {
  var date = new Date();
	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;
  console.log("check read-only time: " + hour + ":" + min + ":" + sec)

  if ((hour > openHour || hour == openHour && min >= openMin) && (hour < readOnlyHour || hour == readOnlyHour && min < readOnlyMin)) {
    return true
  }
  else {
    return false
  }
}

//Check if a student exists
function dbCheckStudent(fullName, studentID, callBack) {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(mainCollectionName).find({fullName: fullName, studentID: studentID}).toArray(function(err, result) {
      if (err) throw err
      if (result.length > 0) {
        console.log("[DB]Student " + fullName + " with ID " + studentID + " exists")
      } 
      else {
        console.log("[DB]Student " + fullName + " with ID " + studentID + " does not exist")
      }
      callBack((result.length > 0)? true : false)
			db.close()
		})
	})
}

//Check if time room occupied
function dbCheckOccupation(room, time, callBack) {
  MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection(mainCollectionName).find({room: room, time: time}).toArray(function(err, result) {
      if (err) throw err
      if (result.length > 0) {
        console.log("[DB]Room " + room + " at " + time + " is occupied")
      } 
      else {
        console.log("[DB]Room " + room + " at " + time + " is not occupied")
      }
      callBack((result.length > 0)? true : false)
			db.close()
		})
	})
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

//remove entry by room and time function
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

//========================
//====Request Handling====
//========================
//Listen
app.listen(port, function(){
  console.log("app started on port" + port);
});

//=================
//====Test Zone====
//=================
// console.log("password hash: " + crypto.createHmac('sha256', "string").digest('hex'));
// console.log(dbCheck("124543"))

// dbInsert("MH103", "19:00-19:30", "Leon Lu", "10", "2220056", true, "Some other names");
// dbRemove("Leon Lu", "2220056");
// dbRemoveAll();
// dbCheck("Leon Lu", "29134");
// dbCheckStudent("Leon Lu", "2220056", function(callBackResult){
//   if (callBackResult == true){
//     console.log("the student exist");
//   }
//   else {
//     console.log("the student does not exist")
//   }
// })
// dbCheckOccupation("MH103", "19:00-19:30", function(callBackResult){
//   if (callBackResult == true){
//     console.log("the room is occupied");
//   }
//   else {
//     console.log("the room is not occupied")
//   }
// })

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

// console.log(getDateTime())
// console.log(getDateTime().year)
// console.log(checkOpenStatus())
// console.log(checkReadStatus())



//=================
//====Temporary====
//=================
app.get("/", function(req, res){
  res.render('index');
});