Pitchy Bird
===========

A retro themed game controlled by voice, inspired from the game Flappy Bird
---------------------------------------------------------------------------


Running it locally
------------------
```bash
$ npm install # To install all the application dependencies
$ node app.js # To run the applicaiton locally in the browser
```

Creating an APK (needs Android SDK and gradle installed)
---------------------------------------------
```bash
$ npm install -g cordova # Install Cordova on your system (If not already installed)
$ ./build-android.sh # Build an APK
# The following commads needs a connected device or an emulator
$ adb install -r [path-printed-after-build] # Install the apk onto the device
```
