import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';
import 'pages/login_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
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
