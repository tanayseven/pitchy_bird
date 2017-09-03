# Microphone

```bash
cordova plugin install com.bandpad.cordova.microphone
```

```JavaScript
navigator.microphone(function (on) {
  if (on) {
    // now you can use the Cordova media plugin to record
  }
  else {
    // instruct how to enable your app's access to the microphone
  }
});
```
