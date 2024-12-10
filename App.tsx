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
