rm -rf android/build/
cordova create android/build com.tanayseven.pitchybird PitchyBird
cp android/AndroidManifest.xml android/build/
cp -r views/* android/build/www/
cd android/build
cordova platform rm android
cordova platform add android@6.2.2
cordova plugin add cordova-plugin-android-permissions
cordova plugin add cordova-plugin-microphone
cordova plugin add cordova-plugin-screen-orientation
cordova build android --debug
