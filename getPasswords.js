/*
The file takes a json-like data of names and student IDs and prints the generated passwords
To get the input data, one can use http://beautifytools.com/excel-to-json-converter.php to convert an xlsx file into json format.
Taking a sheet of data and pasting in the data input area completes the script.
A server key stored in `SERVERKEY.txt` in the same directory is required for running this script.
The console output can be pasted in a txt file an then imported into excel.
*/

const utils = require('./utils') // import from `utils.js`

// #region data input

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

// #endregion data input

// Construct password list
var passwordList = ""
for (var i = 0; i < fromExcel.length; i++) {
  var password = utils.SHALL24(fromExcel[i].fullName + fromExcel[i].studentID);
  passwordList = passwordList + password + "\n"
}

// print the passwords
console.log(passwordList);