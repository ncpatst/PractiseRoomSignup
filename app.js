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

const openHour = 07 //the hour when signup opens; 0 <= openHour <= 23
const openMin = 00 //the minute when signup opens; 0 <= openMin <= 59
const closeHour = 23 //the hour when signup closes; 0 <= closeHour <= 23
const closeMin = 05 //the minute when signup closes; 0 <= closeMin <= 59
const readOnlyHour = 23 //the hour when signup read closes; 0 <= closeHour <= 23
const readOnlyMin = 30 //the minute when signup read closes; 0 <= closeMin <= 59

const operationPasswordHash = "7c9646c6385ff8a32ece75e0b3ff778d007a26ca19a6d5d22bd5394d63e6ebd9"; //set password using this, only put the hash in the source code, DO NOT put anything related to the password
const SERVERKEY = crypto.createHmac('sha256', fs.readFileSync("SERVERKEY.txt", "utf8")).digest('hex'); //get key from SERVERKEY.txt, DO NOT share this file

const roomList = ["MH102", "MH103", "MH104", "MH105", "MH106", "MH107", "MH108", "MH110", "MH117", "MH118", "MH119", "MH113", "MH115", "MH111"] //Used for rendering, changing rooms requires changing html and app.js!

// Clear database midnight
const job = new CronJob('00 00 00 * * *', function() {
  dbRemoveAll();
	const d = new Date();
	console.log('Database cleared at:', d);
});
job.start();

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
function dbInsert(room, time, fullName, grade, studentID, ensembleStatus, remarkStatus, remark) {
  //connect to mongo client
  MongoClient.connect(url, function(err, db) {
    if (err) console.log(err);
    var dbo = db.db(dbName);
    //create object
    var myobj = {room: room, time: time, fullName: fullName, grade: grade, studentID: studentID, ensembleStatus: ensembleStatus, remarkStatus: remarkStatus, remark: remark}

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
    MH118: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH119: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH113: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH115: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
    MH111: {T19001930: {}, T19302000: {}, T20002030: {}, T20302100: {},},
  }
  for (var i = 0; i < list.length; i++) {
    result[list[i].room][list[i].time].fullName = list[i].fullName
    result[list[i].room][list[i].time].grade = list[i].grade
    result[list[i].room][list[i].time].studentID = list[i].studentID
    result[list[i].room][list[i].time].remarkStatus = list[i].remarkStatus
    result[list[i].room][list[i].time].ensembleStatus = list[i].ensembleStatus
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
        var announcement = fs.readFileSync("announcement.txt", "utf8")

        res.render("index", {organisedData: organisedData, roomList: roomList, openHour: (openHour < 10 ? "0" : "") + openHour, openMin: (openMin < 10 ? "0" : "") + openMin, closeHour: (closeHour < 10 ? "0" : "") + closeHour, closeMin: (closeMin < 10 ? "0" : "") + closeMin, announcement: announcement });

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
            res.render("info", {roomOccupationStatus: "Room Occupied", room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year, fullName: organisedData[room][time].fullName, grade: organisedData[room][time].grade, studentID: organisedData[room][time].studentID, ensembleStatus: organisedData[room][time].ensembleStatus, remark: organisedData[room][time].remark, organisedData: organisedData})
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
            res.render("info", {roomOccupationStatus: "Signup Closed", room: room, time: time, date: getDateTime().day + "/" + getDateTime().month + "/" + getDateTime().year, fullName: organisedData[room][time].fullName, grade: organisedData[room][time].grade, studentID: organisedData[room][time].studentID, ensembleStatus: organisedData[room][time].ensembleStatus, remark: organisedData[room][time].remark, organisedData: organisedData})
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
  console.log("[signup-req]sugnup post request recieved")
  //get post info
  var room = req.body.room
  var time = req.body.time
  var fullName = req.body.fullName
  var grade = req.body.grade
  var studentID = req.body.studentID
  var password = req.body.password
  var ensembleStatus = req.body.ensembleStatus
  var remark = req.body.remark

  if (checkOpenStatus() == false) {
    // if signup is open
    res.send("sorry, signup closed")
  }
  else {
    dbCheckStudent(fullName, studentID, function(callBackResult){
      if (callBackResult == true){
        // If student exists
        res.send("you already signed up")
      }
      else {
        // If student does not exist, check occupation
        dbCheckOccupation(room, time, function (callBackResult) {
          if (callBackResult == true) {
            // If room occupied
            res.send("Ooooops, someone signed up for this very room at this very time when you were filling in the form")
          }
          else {
            // If room available, check password
            if (SHALL24(fullName + studentID) !== password.toLowerCase() && crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
              // Wrong password
              res.send("wrong name or password, please double check and try again")
            } else {
              // Correct password, add to database
              var remarkStatus = false;
              if (ensembleStatus == "on" || remark.length >= 1) {
                remarkStatus = true
              }
              if (ensembleStatus == "on") {
                ensembleStatus = true
              }

              console.log("[signup-req]adding to database: " + "|" + room + "|" + time + "|" + fullName + "|" + grade + "|" + studentID + "|" + password + "|" + ensembleStatus + "|" + remarkStatus + "|" + remark + "|");

              dbInsert(room, time, fullName, grade, studentID, ensembleStatus, remarkStatus, remark)

              res.send("signup successful!")
            }
          }
        })
      }
    })
  }

});

//Cancel direct GET
app.get("/cancel", function(req, res){
  //check if open
  if (checkOpenStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: "", studentID: ""});
  } else {
    //respond with error
    res.send("you can only submit cancel requests when signup is open")
  }

});

//Cancel page POST
app.post("/cancel", function(req, res){
  console.log("[signup-req]sugnup post request recieved")
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  
  //check if open
  if (checkOpenStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: fullName, studentID: studentID});
  } else {
    //respond with error
    res.send("you can only submit cancel requests when signup is open")
  }

});

//Cancel POST
app.post("/cancel-req", function(req, res){
  console.log("[cancel-req]sugnup post request recieved")
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  var password = req.body.password

  if (checkOpenStatus() == false) {
    // if signup is closed
    res.send("you can only submit cancel requests when signup is open")
  }
  else {
    dbCheckStudent(fullName, studentID, function (callBackResult) {
      if (callBackResult == true) {
        // If student exists, check password
        if (SHALL24(fullName + studentID) !== password.toLowerCase() && crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
          // Wrong password
          res.send("wrong name, student ID or password, please double check and try again")
        } else {
          // Correct password, remove entry

          console.log("[cancel-req]removing from database: " + "|" + fullName + "|" + studentID + "|" + password + "|");

          dbRemove(fullName, studentID);

          res.send("Cancel successful!")
        }
      }
      else {
        // If student does not exists
        res.send("this student have not signed up, check the name and password you entered")
      }
    })

  }
});

//Help page
app.get("/help", function(req, res){

  res.render("help")

});

//Admin page
app.get("/admin", function(req, res){

  res.render("admin")

});

//Password lookup POST
app.post("/password-req", function(req, res){
  console.log("[password-req]lookup post request recieved")
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  var password = req.body.password

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.send("Wrong admin password, don't even try to break the system")
  } else {
    var lookupPassword = SHALL24(fullName + studentID);
    res.send("The student's password is " + lookupPassword + ", please stop using forgetting password as an excuse to not practise!")
  }

});

//Announcement POST
app.post("/announcement-req", function(req, res){
  console.log("[announcement-req]announcement post request recieved")
  //get post info
  var announcement = req.body.announcement
  var password = req.body.password

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.send("Wrong admin password, don't even try to break the system")
  } else {
    fs.writeFile("announcement.txt", announcement, function (err) {
      console.log("Announcement modified!");
    });
    res.send("Announcement midified successfully!")
  }

});

//Debug POST
app.post("/debug-req", function(req, res){
  console.log("[debug-req]debug post request recieved")
  //get post info
  var type = req.body.type
  var room = req.body.room
  var time = req.body.time
  var fullName = req.body.fullName
  var grade = req.body.grade
  var studentID = req.body.studentID
  var password = req.body.password
  var ensembleStatus = req.body.ensembleStatus
  var remark = req.body.remark
  var remarkStatus = false;
  if (ensembleStatus == "on" || remark.length >= 1) {
    remarkStatus = true
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
          dbInsert(room, time, fullName, grade, studentID, ensembleStatus, remarkStatus, remark)

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

//=================
//====Test Zone====
//=================
// console.log("password hash: " + crypto.createHmac('sha256', "string").digest('hex'));
// console.log(dbCheck("124543"))

// dbInsert("MH103", "T19001930", "Leon Loo", "7", "2220056", true, true, "Some other names");
// dbInsert("MH104", "T19001930", "Leon Lou", "8", "2220066", true, true, "Some other names");
// dbInsert("MH105", "T20002030", "Leon L", "9", "2220076", true, true, "Some other names");
// dbInsert("MH106", "T19302000", "Leon Lu", "10", "2220086", true, true, "Some other names");

// dbRemove("Leon Looo", "182937");
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

// console.log(SHALL24("Leon Looo" + "182937")); //ufq8a0
// console.log(SHALL24("Leuon Lu" + "31415926")); //iamvjl
// console.log(SHALL24("Mr Bright" + "12345678")); //1fuk5s
// console.log(SHALL24("Mr Caliva" + "13514")); //1qa5m7
// console.log(SHALL24("Susie Schneider" + "345624")); //4sd5cc
// console.log(SHALL24("Wilson Tucker" + "647345")); //1sbkhl
// console.log(SHALL24("Jessie Russell" + "3425")); //kj5qu6
// console.log(SHALL24("Gerardo Herrera" + "45864")); //13910j

// fs.writeFile("announcement.txt", "(announcement)", function(err) {
//   console.log("Announcement modified!");
// }); 