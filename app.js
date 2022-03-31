//===================
//====NodeJS Head====
//===================
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const crypto = require("crypto");
const request = require('request');
const fs = require("fs");
const colours = require('colors');
const CronJob = require('cron').CronJob;
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set("view engine", "ejs");
//caching method. This makes sure that browsers don't store unnecessary cash
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})

//============================
//====Programme Parameters====
//============================
const port = 1770; //port that the app listen on
const url = "mongodb://localhost:27017"; //url to MongoDB
const dbName = "PractiseRoomSignup"; //database name to use
const mainCollectionName = "StudentRecords" //collection name to use for student signups

const openHour = 07 //the hour when signup opens; 0 <= openHour <= 23
const openMin = 00 //the minute when signup opens; 0 <= openMin <= 59
const closeHour = 16 //the hour when signup closes; 0 <= closeHour <= 23
const closeMin = 05 //the minute when signup closes; 0 <= closeMin <= 59
const readOnlyHour = 22 //the hour when signup read closes; 0 <= closeHour <= 23
const readOnlyMin = 30 //the minute when signup read closes; 0 <= closeMin <= 59

const operationPasswordHash = "7c9646c6385ff8a32ece75e0b3ff778d007a26ca19a6d5d22bd5394d63e6ebd9"; //set password using this, only put the hash in the source code, DO NOT put anything related to the password
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); //get key from SERVERKEY.txt, DO NOT share this file
const reCaptchaSecretKey = fs.readFileSync("reCaptchaKey.txt", "utf8"); //get google reCaptcha secret key from reCaptchaKey.txt, DO NOT share this file

const roomList = ["MH102", "MH103", "MH104", "MH105", "MH106", "MH107", "MH109", "MH110", "MH117", "MH120", "MH121", "MH113", "MH115", "MH111"] //Used for rendering, changing rooms requires changing html and app.js!

//Initialise Analytics and History
var trafficData = {
total: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
signup: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 
cancel: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
var percentageFullData = {
percentage: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};
var percentageCountDay = 1;
var historicalData = [
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  },
  {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  }
];

// Clear database midnight
const job = new CronJob('00 00 00 * * *', function() {
  logHistory();
  dbRemoveAll();
	const d = new Date();
  console.log('Database cleared at:', d);
  percentageCountDay ++;
});
job.start();

//Record percentage full every hour
const job2 = new CronJob('00 10,20,30,40,50,59 * * * *', function() {

  MongoClient.connect(url, function (err, db) {
    if (err) throw err
    var dbo = db.db(dbName)
    dbo.collection(mainCollectionName).find({}).toArray(function (err, result) {
      if (err) throw err
      logPercentageFull(result.length);
      db.close()
    })
  })

	const d = new Date();
  console.log('Logging percentage full at:', d);
});
job2.start();

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
  // console.log(("[Time-check] Check open time: " + hour + ":" + min + ":" + sec).grey)

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
  // console.log(("[Time-check] Check read-only time: " + hour + ":" + min + ":" + sec).grey)

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
        console.log(("[DB] Student " + fullName + " with ID " + studentID + " exists").cyan)
      } 
      else {
        console.log(("[DB] Student " + fullName + " with ID " + studentID + " does not exist").cyan)
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
        // console.log(("[DB] Room " + room + " at " + time + " is occupied").cyan)
      } 
      else {
        // console.log(("[DB] Room " + room + " at " + time + " is not occupied").cyan)
      }
      callBack((result.length > 0)? true : false)
			db.close()
		})
	})
}

//Check if student blacklisted
function checkBlacklisted(studentID) {
  var blacklist = fs.readFileSync('blacklist.txt').toString().split(",")
  console.log(blacklist)
  return blacklist.includes(studentID)
}

//insert entry function
function dbInsert(room, time, fullName, grade, studentID, ensembleStatus, noteStatus, note) {
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {room: room, time: time, fullName: fullName, grade: grade, studentID: studentID, ensembleStatus: ensembleStatus, noteStatus: noteStatus, note: note}

    //insert document
		dbo.collection(mainCollectionName).insertOne(myobj, function(err, res) {
      if (err) console.log(err);
      db.close();
      console.log(("[DB] Entry " + JSON.stringify(myobj) + " added").cyan);
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
			console.log(("[DB] One occurance of " + obj + " removed").cyan);
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
			console.log(("[DB] One occurance of " + obj + " removed").cyan);
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
			console.log(("[DB] Removed all entry").cyan);
			db.close();
		});
	});
};

//Organise data from database
function organiseData(list) {
  var result = {
    MH102: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH103: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH104: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH105: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH106: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH107: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH109: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH110: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH117: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH120: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH121: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  }
  for (var i = 0; i < list.length; i++) {
    result[list[i].room][list[i].time].fullName = list[i].fullName
    result[list[i].room][list[i].time].grade = list[i].grade
    result[list[i].room][list[i].time].studentID = list[i].studentID
    result[list[i].room][list[i].time].noteStatus = list[i].noteStatus
    result[list[i].room][list[i].time].ensembleStatus = list[i].ensembleStatus
    result[list[i].room][list[i].time].note = list[i].note
  }
  return result;
}

function clearTime(time) {
  for (var i = 0; i < roomList.length; i++) {
    console.log("trying to remove " + roomList[i] + ", " + time)
    dbForceRemove(roomList[i], time)
  }
}

function fillTime(time) {
  for (var i = 0; i < roomList.length; i++) {
    console.log("trying to fill " + roomList[i] + ", " + time)
    dbInsert(roomList[i], time, "-", "-", "-", false, false, "Sign-ups are disabled for this time period");
  }
}

//Log traffic
function logTraffic(type) {
  var hour = Number(getDateTime().hour);
  // console.log("logging " + type + " traffic for time " + hour);
  trafficData[type][hour] ++;
  trafficData[type][24] = trafficData[type][0];
  if (type ==! "total") {
    trafficData["total"][hour] ++;
    trafficData["total"][24] = trafficData["total"][0];
  }
  // console.log(trafficData);
}

//Log percentage full
function logPercentageFull(count) {
  var hour = Number(getDateTime().hour);
  // console.log("logging percentage full for time " + hour);

  percentageFullData["percentage"][hour] = (percentageFullData["percentage"][hour] + (count / 56)) / 2;

  // console.log(percentageFullData);
}

//Log history
function logHistory() {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err
    var dbo = db.db(dbName)
    dbo.collection(mainCollectionName).find({}).toArray(function (err, result) {
      if (err) throw err
      logPercentageFull(result.length);

      var organisedData = organiseData(result);
      historicalData.unshift(organisedData)
      console.log(historicalData)

      db.close()
    })
  })
}

//========================
//====Request Handling====
//========================
//Listen
app.listen(port, function(){
  console.log(("app started on port " + port).black.bgBrightBlue);
});

//Home page
app.get("/", function(req, res){
  console.log(("[GET] Getting home page").yellow)
  logTraffic("total")

  if (checkReadStatus() == false) {
    res.render("response", {responseTitle: "Not Yet", responseMessage: "Sign-up opens between " + (openHour < 10 ? "0" : "") + openHour + ":" + (openMin < 10 ? "0" : "") + openMin + " to " + (closeHour < 10 ? "0" : "") + closeHour + ":" + (closeMin < 10 ? "0" : "") + closeMin + ", please come back later.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
  }
  else {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err
      var dbo = db.db(dbName)
      dbo.collection(mainCollectionName).find({}).toArray(function (err, result) {
        if (err) throw err
        logPercentageFull(result.length);

        var organisedData = organiseData(result);
        var announcement = fs.readFileSync("announcement.txt", "utf8")

        res.render("index", {organisedData: organisedData, roomList: roomList, openHour: (openHour < 10 ? "0" : "") + openHour, openMin: (openMin < 10 ? "0" : "") + openMin, closeHour: (closeHour < 10 ? "0" : "") + closeHour, closeMin: (closeMin < 10 ? "0" : "") + closeMin, announcement: announcement, date: getDateTime().month + "/" + getDateTime().day + "/" + getDateTime().year});

        db.close()
      })
    })
  }

});

//Signup/Info Bridge
app.get("/:room/:time", function(req, res){
  var room = req.params.room;
  var time = req.params.time;
  console.log(("[GET] Getting room page for " + room + " at " + time).yellow)
  logTraffic("total")

  dbCheckOccupation(room, time, function(callBackResult){

    MongoClient.connect(url, function (err, db) {
      if (err) throw err
      var dbo = db.db(dbName)
      dbo.collection(mainCollectionName).find({}).toArray(function (err, result) {
        if (err) throw err

        var organisedData = organiseData(result);

        if (callBackResult == true) {
          // If occupied
          if (checkReadStatus() == true) {
            // If occupied and readable
            res.render("info", {roomOccupationStatus: "Room Occupied", room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year, fullName: organisedData[room][time].fullName, grade: organisedData[room][time].grade, studentID: organisedData[room][time].studentID, ensembleStatus: organisedData[room][time].ensembleStatus, note: organisedData[room][time].note, organisedData: organisedData})
          }
          else {
            // If occupied and closed
            res.redirect("/")
          }
        }
        else {
          // If not occupied
          if (checkOpenStatus() == true) {
            // If not occupied and open
            res.render("signup", { room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year, organisedData: organisedData})
          }
          else if (checkReadStatus() == true) {
            // If not occupied and read-only
            res.render("info", {roomOccupationStatus: "Signup Closed", room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year, fullName: organisedData[room][time].fullName, grade: organisedData[room][time].grade, studentID: organisedData[room][time].studentID, ensembleStatus: organisedData[room][time].ensembleStatus, note: organisedData[room][time].note, organisedData: organisedData})
          }
          else {
            // If not occupied and closed
            res.redirect("/")
          }
        }

        db.close()
      })
    })



  })
})

//Signup POST
app.post("/signup-req", function(req, res){
  //get post info
  var room = "" + req.body.room
  var time = "" + req.body.time
  var fullName = "" + req.body.fullName.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  var grade = "" + req.body.grade
  var studentID = "" + req.body.studentID
  var password = "" + req.body.password
  var ensembleStatus = "" + req.body.ensembleStatus
  var note = "" + req.body.note
  var ip = req.connection.remoteAddress
  console.log(("[POST] Requesting sign-up with information: |" + room + "|" + time + "|" + fullName + "|" + grade + "|" + studentID + "|" + password + "|" + ensembleStatus + "|" + note + "|<" + ip + ">|").green)
  logTraffic("signup")

  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.
  if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    // response on missing captcha
    res.render("response", {responseTitle: "ERROR", responseMessage: "Please complete the captcha to proceed.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Missing Captcha").bold.red);
    return
  }

  // check if student banned from sign up. If so, return error.
  if(checkBlacklisted(studentID)) {
    // response on blacklisted student
    res.render("response", {responseTitle: "ERROR", responseMessage: "This student has been blacklisted. Please contact a music teacher for help.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Blacklisted Student").bold.red);
    return
  }

  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + reCaptchaSecretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  // Hitting GET request to the URL, Google will respond with success or error scenario.
  request(verificationUrl,function(error,response,body) {
    body = JSON.parse(body);
    // Success will be true or false depending upon captcha validation.
    if(body.success !== undefined && !body.success) {
      //Upon false validation
      res.render("response", {responseTitle: "ERROR", responseMessage: "Suspecious traffic, please try again later.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
      console.log(("[ERR] Wrong Captcha").bold.red)
      return
    }
    //Upon true validation


    if (checkOpenStatus() == false) {
      // if signup is open
      res.render("response", {responseTitle: "Not Yet", responseMessage: "Sign-up opens between " + (openHour < 10 ? "0" : "") + openHour + ":" + (openMin < 10 ? "0" : "") + openMin + " to " + (closeHour < 10 ? "0" : "") + closeHour + ":" + (closeMin < 10 ? "0" : "") + closeMin + ", please come back later.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
    }
    else {
      dbCheckStudent(fullName, studentID, function(callBackResult){
        if (callBackResult == true){
          // If student exists
          res.render("response", {responseTitle: "ERROR", responseMessage: "You have already signed up, please do not sign-up more than once in the same day.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true,})
          console.log(("[ERR] Student already signed up").bold.red)
        }
        else {
          // If student does not exist, check occupation
          dbCheckOccupation(room, time, function (callBackResult) {
            if (callBackResult == true) {
              // If room occupied
              res.render("response", {responseTitle: "Ooooops", responseMessage: "It seems like that someone just signed up for this particular room at this particular time when you were filling out the form, please select another room or another time and try again.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
              console.log(("[ERR] Room crash").bold.red)
            }
            else {
              // If room available, check password
              if (SHALL24(fullName + studentID) !== password.toLowerCase() && crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
                // Wrong password
                res.render("response", {responseTitle: "Wrong Information", responseMessage: "Your name, student ID and your password do not match, please double check and try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
                console.log(("[ERR] Wrong password").bold.red)
              } else {
                // Correct password, add to database
                var noteStatus = false;
                if (ensembleStatus == "on" || note.length >= 1) {
                  noteStatus = true
                }
                if (ensembleStatus == "on") {
                  ensembleStatus = true
                }

                console.log(("[Signup-req] Adding to database: " + "|" + room + "|" + time + "|" + fullName + "|" + grade + "|" + studentID + "|" + password + "|" + ensembleStatus + "|" + noteStatus + "|" + note + "|").magenta);

                dbInsert(room, time, fullName, grade, studentID, ensembleStatus, noteStatus, note)

                res.render("response", {responseTitle: "Sign-up Successful!", responseMessage: "You will now be able to see your name on the sign-up table, please remember to come to your practise session. \n\nRedirecting in 3 seconds.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 3000, debugStatus: false})
              }
            }
          })
        }
      })
    }

  });




});

//Cancel direct GET
app.get("/cancel", function(req, res){
  console.log(("[GET] Getting cancel page directly").yellow)
  logTraffic("total")

  //check if open
  if (checkReadStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: "", studentID: ""});
  } else {
    //respond with error
    res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when the sign-up form is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
  }

});

//Cancel page POST
app.post("/cancel", function(req, res){
  //get post info
  var fullName = req.body.fullName.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  var studentID = req.body.studentID
  console.log(("[POST] Requesting cancel page with information: |" + fullName + "|" + studentID + "|").green)
  logTraffic("total")
  
  //check if open
  if (checkReadStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: fullName, studentID: studentID});
  } else {
    //respond with error
    res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when the sign-up form is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
  }

});

//Cancel POST
app.post("/cancel-req", function(req, res){
  //get post info
  var fullName = req.body.fullName.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  var studentID = req.body.studentID
  var password = req.body.password
  console.log(("[POST] Requesting cancel post with information: |" + fullName + "|" + studentID + "|" + password + "|").green)
  logTraffic("cancel")


  if (checkOpenStatus() == false) {
    // if signup is closed
    if (checkReadStatus() == true) {
      // if signup is read-only, only teachers can cancel
      dbCheckStudent(fullName, studentID, function (callBackResult) {
        if (callBackResult == true) {
          // If student exists, check password
          if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
            // Wrong password
            res.render("response", {responseTitle: "Wrong Information", responseMessage: "The name, student ID or admin password is incorrect, please double check and try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
            console.log(("[ERR] Wrong password").bold.red)
          } else {
            // Correct password, remove entry
  
            console.log(("[Cancel-req] Removing from database: " + "|" + fullName + "|" + studentID + "|" + password + "|").magenta);
  
            dbRemove(fullName, studentID);
  
            res.render("response", {responseTitle: "Cancel Successful!", responseMessage: "Removing your name from the sign-up table.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
          }
        }
        else {
          // If student does not exists
          res.render("response", {responseTitle: "ERROR", responseMessage: "This student has not signed up, please check the information you entered.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
          console.log(("[ERR] Student does not exist").bold.red)
        }
      })
    }
    else {
      res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when the sign-up form is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
    }
  }
  else {
    dbCheckStudent(fullName, studentID, function (callBackResult) {
      if (callBackResult == true) {
        // If student exists, check password
        if (SHALL24(fullName + studentID) !== password.toLowerCase() && crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
          // Wrong password
          res.render("response", {responseTitle: "Wrong Information", responseMessage: "The name, student ID and your password do not match, please double check and try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
          console.log(("[ERR] Wrong password").bold.red)
        } else {
          // Correct password, remove entry

          console.log(("[Cancel-req] Removing from database: " + "|" + fullName + "|" + studentID + "|" + password + "|").magenta);

          dbRemove(fullName, studentID);

          res.render("response", {responseTitle: "Cancel Successful!", responseMessage: "Removing your name from the sign-up table.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
        }
      }
      else {
        // If student does not exists
        res.render("response", {responseTitle: "ERROR", responseMessage: "This student has not signed up, please check the information you entered.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
        console.log(("[ERR] Student does not exist").bold.red)
      }
    })

  }
});

//Help page
app.get("/help", function(req, res){
  console.log(("[GET] Getting help page").yellow)
  logTraffic("total")
  res.render("help")
});

//Analytics page
app.get("/analytics", function(req, res){
  console.log(("[GET] Getting analytics page").yellow)
  logTraffic("total")
  res.render("analytics", {trafficData: trafficData, percentageFullData: percentageFullData, historicalData: historicalData})
});

//Issues page
app.get("/issues", function(req, res){
  console.log(("[GET] Getting issues page").yellow)
  logTraffic("total")

  res.render("issues")

});

//Admin page
app.get("/admin", function(req, res){
  console.log(("[GET] Getting admin page").yellow)
  logTraffic("total")

  var blacklist = fs.readFileSync("blacklist.txt", "utf8")

  res.render("admin", {blacklist: blacklist})
});

//Password lookup POST
app.post("/password-req", function(req, res){
  //get post info
  var fullName = req.body.fullName.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  var studentID = req.body.studentID
  var password = req.body.password
  console.log(("[POST] Requesting password lookup with information: |" + fullName + "|" + studentID + "|" + password + "|").green)
  logTraffic("total")

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, please try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    var lookupPassword = SHALL24(fullName + studentID);
    res.render("response", {responseTitle: "Password Lookup", responseMessage: "The student's password is:", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: false, lookupPassword: lookupPassword})
    console.log(("[Password-lookup] Password sent").magenta)
  }

});

//Batch Password lookup POST
app.post("/batch-password-req", function(req, res){
  //get post info
  var fullNames = req.body.fullNames
  var studentIDs = req.body.studentIDs
  var password = req.body.password

  fullNames = fullNames.split("\n")
  studentIDs = studentIDs.split("\n")

  // length check
  if (fullNames.length !== studentIDs.length) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Student name data and student ID data has different length. Please make sure you entered the same number of items for Full Names and Student IDs", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  }
  
  for (let i = 0; i < fullNames.length; i++) {
    fullNames[i] = fullNames[i].trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));  
    studentIDs[i] = studentIDs[i].trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));  
  }

  console.log(fullNames)
  console.log(studentIDs)
  
  console.log(("[POST] Requesting batch password lookup with information: |" + fullNames + "|" + studentIDs + "|" + password + "|").green)
  logTraffic("total")

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, please try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    var passwordTable = []
    for (let i = 0; i < fullNames.length; i++) {
      passwordTable.push({
        fullName: fullNames[i],
        studentID: studentIDs[i],
        password: SHALL24(fullNames[i] + studentIDs[i]),
      })
    } 
    console.log(passwordTable)

    res.render("batchPasswordTable", {responseTitle: "Batch Password", responseMessage: "Here's the list of new credentials:", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: false, passwordTable: passwordTable})

    console.log(("[Batch Password Lookup] Batch sent").magenta)
  }

});

//Announcement POST
app.post("/announcement-req", function(req, res){
  //get post info
  var announcement = req.body.announcement
  var password = req.body.password
  console.log(("[POST] Requesting announcement with information: |" + announcement + "|" + password + "|").green)
  logTraffic("total")

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, please try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    fs.writeFile("announcement.txt", announcement, function (err) {
    });
    res.render("response", {responseTitle: "Success", responseMessage: "The announcement has been modified successfully!", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
    console.log(("[Announcement] Ammouncement added").magenta)
  }

});

app.post("/blacklist-req", function(req, res){
  //get post info
  var blacklist = req.body.blacklist
  var password = req.body.password
  console.log(("[POST] Requesting blacklist with information: |" + blacklist + "|" + password + "|").green)
  logTraffic("total")

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, please try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    fs.writeFile("blacklist.txt", blacklist, function (err) {
    });
    res.render("response", {responseTitle: "Success", responseMessage: "The blacklist has been modified successfully!", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
    console.log(("[Blacklist] Blacklist added").magenta)
  }
});

//Disable POST
app.post("/disable-req", function(req, res){
  //get post info
  var T19001930 = req.body.T19001930
  var T19302000 = req.body.T19302000
  var T20002030 = req.body.T20002030
  var T20302100 = req.body.T20302100
  var password = req.body.password
  console.log(("[POST] Requesting disabling with information: |" + T19001930 + "|" + T19302000 + "|" + T20002030 + "|" + T20302100 + "|" + password + "|").green)
  logTraffic("total")

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, please try again.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    if (T19001930 == "on") {
      clearTime("T19001930");
      fillTime("T19001930");
      console.log(("[Disable] Disabled for time " + "T19001930").magenta)
    }
    if (T19302000 == "on") {
      clearTime("T19302000");
      fillTime("T19302000");
      console.log(("[Disable] Disabled for time " + "T19302000").magenta)
    }
    if (T20002030 == "on") {
      clearTime("T20002030");
      fillTime("T20002030");
      console.log(("[Disable] Disabled for time " + "T20002030").magenta)
    }
    if (T20302100 == "on") {
      clearTime("T20302100");
      fillTime("T20302100");
      console.log(("[Disable] Disabled for time " + "T20302100").magenta)
    }

    res.render("response", {responseTitle: "Success", responseMessage: "Sign-ups for the specified time period(s) have been disabled!", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
  }

});

//Debug POST
app.post("/debug-req", function(req, res){
  console.log(("DEBUG REQUEST RECIEVED").black.bgWhite)
  logTraffic("total")
  //get post info
  var type = req.body.type
  var room = req.body.room
  var time = req.body.time
  var fullName = req.body.fullName.trim().toLowerCase().replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  var grade = req.body.grade
  var studentID = req.body.studentID
  var password = req.body.password
  var ensembleStatus = req.body.ensembleStatus
  var note = req.body.note
  var noteStatus = false;
  if (ensembleStatus == "on" || note.length >= 1) {
    noteStatus = true
  }
  if (ensembleStatus == "on") {
    ensembleStatus = true
  }

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.send("Wrong admin password, don't even try to break the system")
  } else {
    if (type == "lookup") {
      var lookupPassword = SHALL24(fullName + studentID);
      res.send("The student's password is " + lookupPassword)
    }
    else if (type == "add") {
      dbCheckOccupation(room, time, function (callBackResult) {
        if (callBackResult == true) {
          // If room occupied
          res.send("The room is occupied")
        }
        else {
          dbInsert(room, time, fullName, grade, studentID, ensembleStatus, noteStatus, note)

          res.send("Emtry added")
        }
      })
    }
    else if (type == "remove") {
      dbRemove(fullName, studentID);
      res.send("Removed " + fullName + " " + studentID)
    }
    else if (type == "removeAll") {
      dbRemoveAll();
      res.send("Removed everything")
    }

  }
});