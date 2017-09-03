#import "Microphone.h"
#import <Cordova/CDV.h>

@implementation Microphone

- (void)microphone:(CDVInvokedUrlCommand*)command {
  CDVPluginResult* __block pluginResult = nil;

  NSArray* version = [[UIDevice currentDevice].systemVersion componentsSeparatedByString:@"."];

  if ([[version objectAtIndex:0] intValue] < 7) {
    // iOS versions before 7 need no permission to record
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:true];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
  }
  else {
    [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
      pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:granted];
      [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
  }

  
}

@end
