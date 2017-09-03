#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <Cordova/CDVPlugin.h>

@interface Microphone : CDVPlugin

- (void)microphone:(CDVInvokedUrlCommand*)command;

@end
