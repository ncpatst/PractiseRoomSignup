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
//caching method
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})

// app.set('etag', false)
// app.disable('view cache');


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
  console.log(("[Time-check] Check open time: " + hour + ":" + min + ":" + sec).grey)

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
  console.log(("[Time-check] Check read-only time: " + hour + ":" + min + ":" + sec).grey)

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
        console.log(("[DB] Room " + room + " at " + time + " is occupied").cyan)
      } 
      else {
        console.log(("[DB] Room " + room + " at " + time + " is not occupied").cyan)
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
			console.log(("[DB] One occurance of " + JSON.stringify(obj) + " removed").cyan);
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
			console.log(("[DB] One occurance of " + obJSON.stringify(obj) + " removed").cyan);
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
  console.log(("app started on port " + port).black.bgBrightBlue);
});

//Home page
app.get("/", function(req, res){
  console.log(("[GET] Getting home page").yellow)

  if (checkReadStatus() == false) {
    res.render("response", {responseTitle: "Not Yet", responseMessage: "Sign-up opens between " + (openHour < 10 ? "0" : "") + openHour + ":" + (openMin < 10 ? "0" : "") + openMin + " to " + (closeHour < 10 ? "0" : "") + closeHour + ":" + (closeMin < 10 ? "0" : "") + closeMin + ", please come back later.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
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
  console.log(("[GET] Getting room page for " + room + " at " + time).yellow)

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

app.post('/reCaptchaTest',function(req,res){
  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.
  if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    return res.json({"responseCode" : 1,"responseDesc" : "Please select captcha"});
  }
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + reCaptchaSecretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  // Hitting GET request to the URL, Google will respond with success or error scenario.
  request(verificationUrl,function(error,response,body) {
    body = JSON.parse(body);
    // Success will be true or false depending upon captcha validation.
    if(body.success !== undefined && !body.success) {
      return res.json({"responseCode" : 1,"responseDesc" : "Failed captcha verification"});
    }
    res.json({"responseCode" : 0,"responseDesc" : "Sucess"});
  });
});

//Signup POST
app.post("/signup-req", function(req, res){
  //get post info
  var room = req.body.room
  var time = req.body.time
  var fullName = req.body.fullName
  var grade = req.body.grade
  var studentID = req.body.studentID
  var password = req.body.password
  var ensembleStatus = req.body.ensembleStatus
  var remark = req.body.remark
  console.log(("[POST] Requesting sign-up with information: |" + room + "|" + time + "|" + fullName + "|" + grade + "|" + studentID + "|" + password + "|" + ensembleStatus + "|" + remark + "|").green)

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
            res.render("response", {responseTitle: "Ooooops", responseMessage: "Someone, somewhere signed up for this very room at this very time when you were filling in the form, please select another room or another time and try again.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
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
              var remarkStatus = false;
              if (ensembleStatus == "on" || remark.length >= 1) {
                remarkStatus = true
              }
              if (ensembleStatus == "on") {
                ensembleStatus = true
              }

              console.log(("[Signup-req] Adding to database: " + "|" + room + "|" + time + "|" + fullName + "|" + grade + "|" + studentID + "|" + password + "|" + ensembleStatus + "|" + remarkStatus + "|" + remark + "|").bold.brightBlue);

              dbInsert(room, time, fullName, grade, studentID, ensembleStatus, remarkStatus, remark)

              res.render("response", {responseTitle: "Sign-up Successful!", responseMessage: "You will now be able to see your name on the sign-up table, please remember to come to your practise session. \n\nRedirecting in 3 seconds.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 3000, debugStatus: false})
            }
          }
        })
      }
    })
  }

});

//Cancel direct GET
app.get("/cancel", function(req, res){
  console.log(("[GET] Getting cancel page directly").yellow)
  //check if open
  if (checkOpenStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: "", studentID: ""});
  } else {
    //respond with error
    res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when sign-up is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
  }

});

//Cancel page POST
app.post("/cancel", function(req, res){
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  console.log(("[POST] Requesting cancel page with information: |" + fullName + "|" + studentID + "|").green)
  
  //check if open
  if (checkOpenStatus() == true) {
    //respond with a unfilled form
    res.render("cancel", {fullName: fullName, studentID: studentID});
  } else {
    //respond with error
    res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when sign-up is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
  }

});

//Cancel POST
app.post("/cancel-req", function(req, res){
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  var password = req.body.password
  console.log(("[POST] Requesting cancel post with information: |" + fullName + "|" + studentID + "|" + password + "|").green)


  if (checkOpenStatus() == false) {
    // if signup is closed
    res.render("response", {responseTitle: "Not Now", responseMessage: "You can only submit cancel requests when sign-up is open.", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: true})
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

          console.log(("[Cancel-req] Removing from database: " + "|" + fullName + "|" + studentID + "|" + password + "|").bold.brightBlue);

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

  res.render("help")

});

//Admin page
app.get("/admin", function(req, res){
  console.log(("[GET] Getting admin page").yellow)

  res.render("admin")

});

//Password lookup POST
app.post("/password-req", function(req, res){
  //get post info
  var fullName = req.body.fullName
  var studentID = req.body.studentID
  var password = req.body.password
  console.log(("[POST] Requesting password lookup with information: |" + fullName + "|" + studentID + "|" + password + "|").green)

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, don't try to break into the system.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    var lookupPassword = SHALL24(fullName + studentID);
    res.render("response", {responseTitle: "Password Lookup", responseMessage: "The student's password is " + lookupPassword + ", please stop using FORGETTING PASSWORD as an excuse of NOT PRACTISING!", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: false})
    console.log(("[Password-lookup] Password sent").bold.brightBlue)
  }

});

//Announcement POST
app.post("/announcement-req", function(req, res){
  //get post info
  var announcement = req.body.announcement
  var password = req.body.password
  console.log(("[POST] Requesting announcement with information: |" + announcement + "|" + password + "|").green)

  if (crypto.createHmac('sha256', password).digest('hex') !== operationPasswordHash) {
    res.render("response", {responseTitle: "ERROR", responseMessage: "Wrong admin password, don't try to break into the system.", linkStatus: false, linkLocation: ".", linkText: "Home", backStatus: true, redirectDuration: 0, debugStatus: true})
    console.log(("[ERR] Wrong admin password").bold.red)
  } else {
    fs.writeFile("announcement.txt", announcement, function (err) {
    });
    res.render("response", {responseTitle: "Success", responseMessage: "The announcement has been modified successfully!", linkStatus: true, linkLocation: ".", linkText: "Home", backStatus: false, redirectDuration: 0, debugStatus: false})
    console.log(("[Announcement] Ammouncement added").bold.brightBlue)
  }

});

//Debug POST
app.post("/debug-req", function(req, res){
  console.log(("DEBUG REQUEST RECIEVED").black.bgWhite)
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


//Response page test
// app.get("/response-test", function(req, res){
//   res.render("response", {responseTitle: "title", responseMessage: "message \n2nd paragraph", linkStatus: true, linkLocation: "/help", linkText: "haha", backStatus: true, redirectDuration: 0})
// });