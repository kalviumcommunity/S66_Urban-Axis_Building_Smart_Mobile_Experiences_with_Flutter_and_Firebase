import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';
import 'pages/login_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Connect to emulators in debug mode
  if (kDebugMode) {
    try {
      const String host = '127.0.0.1';
      await FirebaseAuth.instance.useAuthEmulator(host, 9099);
      FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
      print('🛠️ Connected to local Firebase emulators');
    } catch (e) {
      print('❌ Failed to connect to emulators: $e');
    }
  }

  runApp(const UrbanAxisApp());
}

class UrbanAxisApp extends StatefulWidget {
  const UrbanAxisApp({super.key});

  static _UrbanAxisAppState of(BuildContext context) =>
      context.findAncestorStateOfType<_UrbanAxisAppState>()!;

  @override
  State<UrbanAxisApp> createState() => _UrbanAxisAppState();
}

class _UrbanAxisAppState extends State<UrbanAxisApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void changeTheme(ThemeMode themeMode) {
    setState(() {
      _themeMode = themeMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UrbanAxis',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _themeMode,
      home: const LoginPage(),
    );
  }
}
