#import "WebUploader.h"
#import "AppDelegate.h"

@implementation WebUploader

RCT_EXPORT_MODULE(); // 导出模块到RN

RCT_EXPORT_METHOD(startServer:(RCTResponseSenderBlock)callback) {
  GCDWebUploader* server = [AppDelegate getServer]; // 调用类方法AppDelegate中的getServer方法
  
  if(![server isRunning]) {
    [server start];
    NSLog(@"Start server on %@", server.serverURL);
  }
  
  NSString *url = [server.serverURL absoluteString]; // URL转String
  callback(@[url]); // 将URL传入回调函数
}

RCT_EXPORT_METHOD(stopServer) {
  GCDWebUploader* server = [AppDelegate getServer];
  
  if([server isRunning]) {
    [server stop];
    NSLog(@"Stop server");
  }
}

@end
