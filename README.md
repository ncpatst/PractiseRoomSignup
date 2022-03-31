# PractiseRoomSignup

A signup system without password database utilising crytography

## The Files

Files: 

- `app.js` is the one that handels all the requests and serve information accordingly by connecting to the MongoDB database
- `utils.js` contains helper functions for the app
- `getPasswords.js` is used for batch password generation; a newer web interface is also available in the app's admin panel
- `announcement.txt` is where an announcement message is temporarily stored
- `blacklist.txt` stores the blacklisted student IDs
- `reCaptchaKey.txt` stores the google reChaptcha key
- `SERVERKEY.txt` contains the key used for the SHALL24 algorithm
- `package.json` and `package-lock.json` have something to do with npm

Folders:

- `views/` contains the ejs files that the app uses to render content
- `node_modules/` stores packages installed via npm
- `public/css/` contains css files
- `public/js/` contains js files
- `public/favicons/` contains the app's icon
- `signupDirection/` is the webpage for the site linking multiple signup apps
- `Assets/` is a deprecated folder containing design files

## Feature Implemented (Archive)

- [x] Basic node app setup
- [x] Programmer art UI
- [x] Server-key
- [x] Custom hash function
- [x] Database insert and remove function
- [x] Scheduled tasks
- [x] Check open status function
- [x] requests
- [x] index.ejs
- [x] signup.ejs
- [x] info.ejs
- [x] admin.ejs
- [x] cancel.ejs
- [x] help.ejs
- [x] message.ejs
- [x] announcement system
- [x] Background artwork
- [x] Table responsiveness
- [x] Font size responsiveness
- [x] Recolouring
- [x] Layout