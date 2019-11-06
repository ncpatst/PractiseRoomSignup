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

//============================
//====Programme Parameters====
//============================
const port = 1770; //port that the app listen on
const url = "mongodb://localhost:27017"; //url to MongoDB
const dbName = "PractiseRoomSignup"; //database name to use
const mainCollectionName = "StudentRecords" //collection name to use for student signups

const openHour = 6 //the hour when signup opens; 0 <= openHour <= 23
const openMin = 30 //the minute when signup opens; 0 <= openMin <= 59
const closeHour = 23 //the hour when signup closes; 0 <= closeHour <= 23
const closeMin = 05 //the minute when signup closes; 0 <= closeMin <= 59
const readOnlyHour = 23 //the hour when signup read closes; 0 <= closeHour <= 23
const readOnlyMin = 30 //the minute when signup read closes; 0 <= closeMin <= 59

const operationPasswordHash = "7c9646c6385ff8a32ece75e0b3ff778d007a26ca19a6d5d22bd5394d63e6ebd9"; //set password using this, only put the hash in the source code, DO NOT put anything related to the password
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); //get key from SERVERKEY.txt, DO NOT share the file to anywhere

const roomList = ["MH102", "MH103", "MH104", "MH105", "MH106", "MH107", "MH108", "MH110", "MH117", "MH118", "MH119", "MH113", "MH115", "MH111"] //Used for rendering, changing rooms requires changing html and app.js!

const roomTimeDataStructure = 
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
  MH118: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  MH119: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
}


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
function dbInsert(room, time, fullName, grade, studentID, remarkStatus, remark) {
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {room: room, time: time, fullName: fullName, grade: grade, studentID: studentID, remarkStatus: remarkStatus, remark: remark}

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

//Organise data from database
function organiseData(list) {
  var result = roomTimeDataStructure
  for (var i = 0; i < list.length; i++) {
    result[list[i].room][list[i].time].fullName = list[i].fullName
    result[list[i].room][list[i].time].grade = list[i].grade
    result[list[i].room][list[i].time].studentID = list[i].studentID
    result[list[i].room][list[i].time].remarkStatus = list[i].remarkStatus
    result[list[i].room][list[i].time].remark = list[i].remark
  }
  return result;
}

//========================
//====Request Handling====
//========================
//Listen
app.listen(port, function(){
  console.log("app started on port" + port);
});

//Home page
app.get("/", function(req, res){

  if (checkReadStatus() == false) {
    res.send("signup closed page")
  }
  else {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err
      var dbo = db.db(dbName)
      dbo.collection(mainCollectionName).find({}).toArray(function (err, result) {
        if (err) throw err

        var organisedData = organiseData(result);
        res.render("index", {organisedData: organisedData, roomList: roomList});

        db.close()
      })
    })
  }

});

//Signup/Info Bridge
app.get("/:room/:time", function(req, res){
  var room = req.params.room;
  var time = req.params.time;
  console.log("clicked room and time is " + room + " and " + time)

  dbCheckOccupation(room, time, function(callBackResult){
    if (callBackResult == true){
      if (checkReadStatus() == true) {
        res.render("info", {room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year})
      }
      else {
        res.redirect("/")
      }
    }
    else {
      if (checkOpenStatus() == true) {
        res.render("signup", {room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year})
      } 
      else if (checkReadStatus() == true) {
        res.render("info", {room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year})
      }
      else {
        res.redirect("/")
      }
    }
  })
})

//=================
//====Test Zone====
//=================
// console.log("password hash: " + crypto.createHmac('sha256', "string").digest('hex'));
// console.log(dbCheck("124543"))

// dbInsert("MH103", "T19001930", "Leon Loo", "7", "2220056", true, "Some other names");
// dbInsert("MH104", "T19001930", "Leon Lou", "8", "2220066", true, "Some other names");
// dbInsert("MH105", "T19001930", "Leon L", "9", "2220076", true, "Some other names");
// dbInsert("MH106", "T19302000", "Leon Lu", "10", "2220086", true, "Some other names");

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