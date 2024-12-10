#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "GCDWebUploader.h" // 1. 引入类型

@interface AppDelegate : RCTAppDelegate

+ (GCDWebUploader *) getServer; // 2. 类方法声明

@end
