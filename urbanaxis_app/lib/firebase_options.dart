import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
      case TargetPlatform.fuchsia:
        throw UnsupportedError('Unsupported platform.');
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDemo-apiKey-for-web',
    appId: '1:123456789:web:demo-app-id',
    messagingSenderId: '123456789',
    projectId: 'urbanaxis-app',
    authDomain: 'urbanaxis-app.firebaseapp.com',
    storageBucket: 'urbanaxis-app.appspot.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDemo-apiKey-for-android',
    appId: '1:123456789:android:demo-app-id',
    messagingSenderId: '123456789',
    projectId: 'urbanaxis-app',
    storageBucket: 'urbanaxis-app.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDemo-apiKey-for-ios',
    appId: '1:123456789:ios:demo-app-id',
    messagingSenderId: '123456789',
    projectId: 'urbanaxis-app',
    storageBucket: 'urbanaxis-app.appspot.com',
    iosClientId: '123456789-abc123.apps.googleusercontent.com',
    iosBundleId: 'com.example.urbanaxisApp',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyDemo-apiKey-for-macos',
    appId: '1:123456789:macos:demo-app-id',
    messagingSenderId: '123456789',
    projectId: 'urbanaxis-app',
    storageBucket: 'urbanaxis-app.appspot.com',
    iosClientId: '123456789-abc123.apps.googleusercontent.com',
    iosBundleId: 'com.example.urbanaxisApp',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyDemo-apiKey-for-windows',
    appId: '1:123456789:windows:demo-app-id',
    messagingSenderId: '123456789',
    projectId: 'urbanaxis-app',
    storageBucket: 'urbanaxis-app.appspot.com',
  );
}