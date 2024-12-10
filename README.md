# React Native局域网无线U盘的iPhone应用
> 要点：使用GCDWebUploader创建一个文件管理服务器，GCDWebUploader是GCDWebServer的一个扩展类，由基础web服务器功能扩展文件上传，删除等功能。

参考：

* [GCDWebServer](https://github.com/swisspol/GCDWebServer)
* [GCDWebUploader](https://github.com/swisspol/GCDWebServer/blob/master/GCDWebUploader/GCDWebUploader.m)

### 如何直接Clone并运行
```
git clone https://github.com/Charley-Tang/LocalWirelessDisk.git
```
```
cd LocalWirelessDisk
```
```
yarn install
```
```
cd ios && pod install && cd ..
```
```
npx react-native run-ios
```

> 如果运行失败，尝试在Xcode中指定Team开发者，以下是我的创建过程，项目没有添加图标，由于本人并没有证书，所以也没构建发布到App Store，个人是使用巨魔商店安装使用着。


### 初始化一个RN项目
> 我创建项目是0.74.6版本

1. 创建项目，下载/复制/处理模板，CocoaPods安装输入y确认

```
npx @react-native-community/cli init LocalWirelessDisk --version 0.74.6
```
2. 进入项目目录

```
cd LocalWirelessDisk
```
3. 启动项目

```
npx react-native run-ios
```

> 如果遇到启动项目失败

> LocalWirelessDisk.xcodeproj: error: Signing for "LocalWirelessDisk" requires a development team. Select a development team in the Signing & Capabilities editor. (in target 'LocalWirelessDisk' from project 'LocalWirelessDisk')
> 

> 在Xcode中指定Team



### 引入GCDWebUploader
> 由于GCDWebUploader是ObjectC写的，无法直接在RN中直接使用，我们通过写一个原生模块来创建实例，并把启动/关闭服务器两个方法通过RN Bridge暴露出来

[iOS 原生模块](https://reactnative.cn/docs/0.74/native-modules-ios)

[安装GCDWebUploader](https://github.com/swisspol/GCDWebServer)

在VSCode中打开`ios`目录下的`Podfile`，添加下面这句模块依赖，我是放在`prepare_react_native_project!`这行下边，然后保存文件

```
pod "GCDWebServer/WebUploader", "~> 3.0"
```
接着在终端进入ios目录运行`pod install`安装这个依赖，终端日志绿色字体显示新安装的依赖

```
cd ios && pod install && cd ..
```

### 添加自定义原生模块

* 安装完依赖，在Xcode中找到`AppDelegate.h`文件，引入头文件`GCDWebUploader.h`导入类型，定义类方法`getServer `。
* 在`AppDelegate.mm`文件，在`@implementation AppDelegate`下面定义静态变量`webUploader `，在`application`方法中return之前实例化对象保存到静态变量，指定目录为沙盒文档目录，在Xcode中运行，查看控制台是否显示日志：GCDWebUploader实例创建成功，由于静态变量作用域仅在编译原单（.m文件），我们需要一个类方法`getServer`将其返回，通过类方法共享到自定义原生模块。

```
// AppDelegate.h
#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "GCDWebUploader.h" // 1. 引入类型

@interface AppDelegate : RCTAppDelegate

+ (GCDWebUploader *) getServer; // 2. 类方法声明

@end

```

```
// AppDelegate.mm
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

static GCDWebUploader *webUploader; // 3.定义静态类变量

// 4. 类方法返回静态类变量
+ (GCDWebUploader *) getServer {
  return webUploader;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  ...原来的代码
  // 5. 实例化
  if (webUploader == nil) {
    NSString* documentsPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    webUploader = [[GCDWebUploader alloc] initWithUploadDirectory:documentsPath];
    NSLog(@"GCDWebUploader实例创建成功");
  }
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}
...后面的代码
```

实例化成功后，我们接着创建自定义原生模块，Xcode点击一下`AppDelegate.mm`所在的目录，然后command+N，新建文件

* iOS->Source->Cocoa Touch Class新建一个类
* 类名WebUploader，NSObject语的子类，语言选择Object-C。
* 保存在`AppDelegate.mm`同目录下

头文件`WebUploader.h`中`#importy`语句引入RN桥模块，声明一个类叫WebUploader，继承NSObject，是一个RCTBridgeModule

```
// WebUploader.h

#import <React/RCTBridgeModule.h>

@interface WebUploader : NSObject <RCTBridgeModule>

@end

```

.m文件写WebUploader类的实现，导出RN原生模块，以及方法`startServer`和`stopServer`

```
// WebUploader.m

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
```

### 在App.tsx调用导出的方法
从`react-native`中导入`NativeModules`和`Button`，创建一个serverURL状态，在Step One上面添加UI。

```
import { NativeModules, Button } from 'react-native';
...
const [serverURL, setServerURL] = React.useState('');
...
<Text style={{textAlign: 'center', margin: 16}}>
  {serverURL
    ? `Server is running at ${serverURL}`
    : 'Server is not running...'}
</Text>
<Button
  title={serverURL ? `Stop server` : 'Start server'}
  onPress={() => {
    if (serverURL) {
      NativeModules.WebUploader.stopServer();
      setServerURL('');
    } else {
      NativeModules.WebUploader.startServer((url: string) => {
        setServerURL(url);
      });
    }
  }}
/><Section title="Step One">
  Edit <Text style={styles.highlight}>App.tsx</Text> to change this
  screen and then come back to see your edits.
</Section>
...
```

控制台重新运行，这时候在浏览器打开看看应该可以访问到网页了，我这里是`http://192.168.1.15:8080/`，我创建了一个文件夹，上传了一个文件。接下来，让文件App显示文档目录，Xcode中打开`info.plist`，右键添加一行`Add row`，键`Supports opening documents in place`值`YES`，再加一行`Application supports iTunes file sharing`，也是`YES`，点击Xcode左上角运行，打开文件App查看是否有文件夹，里面是否有刚才上传到文件和建立的文件夹。

最后，清理一下App.tsx

```
import React from 'react';
import {SafeAreaView, Text, useColorScheme, View} from 'react-native';
import {NativeModules, Button} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [serverURL, setServerURL] = React.useState('');

  return (
    <SafeAreaView
      style={{backgroundColor: isDarkMode ? Colors.darker : Colors.lighter}}>
      <Text style={{textAlign: 'center', fontSize: 32, marginVertical: 64}}>
        Local Wireless Disk
      </Text>

      <View style={{backgroundColor: isDarkMode ? Colors.black : Colors.white}}>
        <Text style={{textAlign: 'center', margin: 32}}>
          {serverURL
            ? `Server is running at ${serverURL}`
            : 'Server is NOT running...'}
        </Text>
        <Button
          title={serverURL ? `Stop server` : 'Start server'}
          onPress={() => {
            if (serverURL) {
              NativeModules.WebUploader.stopServer();
              setServerURL('');
            } else {
              NativeModules.WebUploader.startServer((url: string) => {
                setServerURL(url);
              });
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

export default App;

```

