import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../main.dart' as import_main;

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(24),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 36,
                    backgroundColor: AppTheme.primaryColor,
                    child: Text('SA', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Super Admin', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        const Text('admin@urbanaxis.com', style: TextStyle(color: AppTheme.textSecondaryColor)),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('verified', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.edit, color: AppTheme.primaryColor), onPressed: () {}),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _buildSettingsSection('System Preferences', [
              _buildSettingsTile(Icons.language, 'Language', 'English (US)'),
              _buildThemeToggleTile(context),
              _buildSettingsTile(Icons.notifications_active_outlined, 'Push Notifications', 'Enabled', hasToggle: true),
            ]),
            _buildSettingsSection('Security', [
              _buildSettingsTile(Icons.lock_outline, 'Change Password', 'Last changed 3 months ago'),
              _buildSettingsTile(Icons.security, 'Two-Factor Auth', 'Enabled'),
              _buildSettingsTile(Icons.devices, 'Active Sessions', '2 Devices'),
            ]),
            _buildSettingsSection('Support & More', [
              _buildSettingsTile(Icons.help_outline, 'Help Center', ''),
              _buildSettingsTile(Icons.info_outline, 'About UrbanAxis', 'Version 1.2.0'),
              _buildSettingsTile(Icons.logout, 'Log Out', '', isDestructive: true),
            ]),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondaryColor),
          ),
        ),
        Container(
          color: Colors.white,
          child: Column(
            children: children,
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildSettingsTile(IconData icon, String title, String subtitle, {bool hasToggle = false, bool isDestructive = false}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isDestructive ? Colors.red.withOpacity(0.1) : AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: isDestructive ? Colors.red : AppTheme.primaryColor, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(fontWeight: FontWeight.w500, color: isDestructive ? Colors.red : AppTheme.textPrimaryColor),
      ),
      subtitle: subtitle.isNotEmpty ? Text(subtitle, style: const TextStyle(fontSize: 12)) : null,
      trailing: hasToggle
          ? Switch(
              value: true,
              onChanged: (val) {},
              activeColor: AppTheme.primaryColor,
            )
          : const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textSecondaryColor),
      onTap: () {},
    );
  }

  Widget _buildThemeToggleTile(BuildContext context) {
    bool isDark = Theme.of(context).brightness == Brightness.dark;
    
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(
        isDark ? 'Light Mode' : 'Dark Mode',
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: const Text('Toggle app theme', style: TextStyle(fontSize: 12)),
      trailing: Switch(
        value: isDark,
        onChanged: (val) {
          import_main.UrbanAxisApp.of(context).changeTheme(
            val ? ThemeMode.dark : ThemeMode.light
          );
        },
        activeColor: AppTheme.primaryColor,
      ),
    );
  }
}
