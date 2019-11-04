//========================
//====Request Handling====
//========================
//Home Page
app.get("/", function(req, res){
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection("studentRecords").find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('index', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, maxPopulation: maxPopulation});

		})
  })
});

//Signup Page 1
app.get("/signup/:timeSelect", function(req, res){
  var timeSelect = req.params.timeSelect;
  console.log("selected time is " + timeSelect)
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection("studentRecords").find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('signup', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, timeSelect: timeSelect, maxPopulation: maxPopulation})
		})
  })
});
//Signup Page 2
app.get("/signup", function(req, res){
  var timeSelect = 0;
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection("studentRecords").find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('signup', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, timeSelect: timeSelect, maxPopulation: maxPopulation})
		})
  })
});

//Data Page
app.get("/data", function(req, res){
  var T1Count = 0
  var T2Count = 0
  var T3Count = 0
  var T4Count = 0
  var T5Count = 0
  var T6Count = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection("studentRecords").find({}).toArray(function(err, result) {
			if (err) throw err
      for (var i = 0; i < result.length; i++) {
				if (result[i].Time == "19:00-19:10") {
          T1Count++
        }
				if (result[i].Time == "19:10-19:20") {
          T2Count++
        }
        if (result[i].Time == "19:20-19:30") {
          T3Count++
        }
        if (result[i].Time == "19:35-19:45") {
          T4Count++
        }
        if (result[i].Time == "19:45-19:55") {
          T5Count++
        }
        if (result[i].Time == "19:55-20:05") {
          T6Count++
        }
      }
      console.log("count result: " + "|" + T1Count + "|" + T2Count + "|" + T3Count + "|" + T4Count + "|" + T5Count + "|" + T6Count + "|")
      db.close()   
      res.render('data', {T1Count: T1Count, T2Count: T2Count, T3Count: T3Count, T4Count: T4Count, T5Count: T5Count, T6Count: T6Count, dataList: result, maxPopulation: maxPopulation})
		})
  })
});

//Cancel Page
app.get("/cancel", function(req, res){
  res.render('cancel');
});

//Erase Page
app.get("/erase", function(req, res){
  res.render('erase');
});

//Signup POST
app.post("/signup", function(req, res){
  console.log("sugnup post request recieved")
  //get post info
  var time = req.body.time
  var firstName = req.body.firstName
  var lastName = req.body.lastName
  var year = req.body.year
  var studentID = req.body.studentID
  console.log("request info: " + "|" + time + "|" + firstName + "|" + lastName + "|" + year + "|" + studentID + "|");

  //check availability
  var availabilityCount = 0
  
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		var dbo = db.db(dbName)
		dbo.collection("studentRecords").find({}).toArray(function(err, result) {
			if (err) throw err
			for (var i = 0; i < result.length; i++) {
				if (result[i].Time == time) {
          availabilityCount++
        }
      }
      console.log("Avalibility count:" + availabilityCount)
      db.close()
      
      //control flow
      if (availabilityCount < maxPopulation) {
        //add entry to database
        console.log("Availabiligy check passed, adding to database")
        dbInsert(time, firstName, lastName, year, studentID);
        res.render("signuped", {time: time, firstName: firstName, lastName: lastName, year: year, studentID: studentID});
      }
      else{
        console.log("OOPS, ERROR, too many sign-ups")
        //Some Error Reporting Machanism
        res.render("info", {location: "index", infoTitle: "ERROR", infoMessage: "The selected time period is full, please select a different time and signup again. You don't need to pay again."})
      }
		});
  });
});

//Cancel POST
app.post("/cancel", function(req, res){
  console.log("cancel post request recieved")
  //get post info
  var studentID = req.body.studentID
  var operationPassword = req.body.operationPassword
  console.log("request info: " + "|" + studentID + "|" + operationPassword + "|");
  
  //check password
  if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash) {
    //Check ID availability
      MongoClient.connect(url, function(err, db) {
        if (err) throw err
        var dbo = db.db(dbName)
        dbo.collection("studentRecords").find({StudentID: studentID}).toArray(function(err, result) {
          if (err) throw err
          if (result.length > 0) {
            dbRemove(studentID);
            res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "One occurance of " + studentID + " has been removed from the list"})
          }
          else {
            res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "The requested student ID is invalid, pleas try again."})
          }
        });
      });
  }
  else {
    res.render("info", {location: "cancel", infoTitle: "ERROR", infoMessage: "Wrong operation password, please try again"})  }
});

//Erase POST
app.post("/erase", function(req, res){
  console.log("erase post request recieved")
  //get post info
  var operationPassword = req.body.operationPassword
  var varificationQuestion = req.body.varificationQuestion
  console.log("request info: " + "|" + operationPassword + "|" + varificationQuestion + "|");
  
  //check password
  if (crypto.createHmac('sha256', operationPassword).digest('hex') == operationPasswordHash && varificationQuestion == 17) {
    dbRemoveAll();
    res.render("info", {location: "data", infoTitle: "Operation Successful", infoMessage: "All information has been erased."})
  }
  else {
    res.render("info", {location: "erase", infoTitle: "ERROR", infoMessage: "Wrong operation password or varification question answer, please try again."})
  }
});