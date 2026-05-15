import 'package:flutter/material.dart';
import '../api_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'super_admin_dashboard.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiService.postData(
        '/api/v1/auth/login',
        {
          'phone': _phoneController.text.trim(),
          'password': _passwordController.text,
        },
      );

      final customToken = data['customToken'] as String?;
      if (customToken == null || customToken.isEmpty) {
        throw Exception('Missing custom token');
      }

      final userCredential = await FirebaseAuth.instance.signInWithCustomToken(customToken);
      final idToken = await userCredential.user?.getIdToken(true);
      if (idToken == null || idToken.isEmpty) {
        throw Exception('Failed to obtain ID token');
      }
      ApiService.setAuthToken(idToken);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const SuperAdminDashboard()),
      );
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
            ],
            ElevatedButton(
              onPressed: _loading ? null : _login,
              child: _loading ? const CircularProgressIndicator() : const Text('Login'),
            ),
          ],
        ),
      ),
    );
  }
}
