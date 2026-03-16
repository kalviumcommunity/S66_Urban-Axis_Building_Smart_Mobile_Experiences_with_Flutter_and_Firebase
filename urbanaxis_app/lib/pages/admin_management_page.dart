import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AdminManagementPage extends StatefulWidget {
  const AdminManagementPage({super.key});

  @override
  State<AdminManagementPage> createState() => _AdminManagementPageState();
}

class _AdminManagementPageState extends State<AdminManagementPage> {
  final List<Map<String, dynamic>> _admins = [
    {
      'name': 'Alex Rivera',
      'phone': '+1 (555) 010-0456',
      'services': ['Waste Management', 'Energy Grid'],
      'status': 'Active',
    },
    {
      'name': 'Sarah Jenkins',
      'phone': '+1 (555) 010-9932',
      'services': ['Security Portal', 'Facility Comm.'],
      'status': 'Active',
    },
    {
      'name': 'Mark Thompson',
      'phone': '+1 (555) 010-8451',
      'services': ['Public Transit'],
      'status': 'Suspended',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Management', style: TextStyle(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Manage and monitor your urban service administrators.',
              style: TextStyle(color: AppTheme.textSecondaryColor),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.person_add),
                label: const Text('Add Admin'),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _buildStatBox('Total Admins', '24', '+2 this month')),
                const SizedBox(width: 16),
                Expanded(child: _buildStatBox('Active Devices', '12', 'Assigned Roles')),
              ],
            ),
            const SizedBox(height: 16),
            _buildStatBox('System Uptime', '98%', 'Optimal Status', isWide: true),
            const SizedBox(height: 24),
            TextField(
              decoration: InputDecoration(
                hintText: 'Search admins by name, service or status...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide(color: Colors.grey.shade300),
                ),
              ),
            ),
            const SizedBox(height: 16),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _admins.length,
              itemBuilder: (context, index) {
                return _buildAdminCard(_admins[index]);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBox(String title, String value, String subtitle, {bool isWide = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor)),
          const SizedBox(height: 4),
          Row(
            children: [
              if (subtitle.startsWith('+'))
                const Icon(Icons.arrow_upward, size: 12, color: Colors.green),
              if (!subtitle.startsWith('+'))
                Icon(isWide ? Icons.check_circle : Icons.admin_panel_settings, size: 12, color: AppTheme.primaryColor),
              const SizedBox(width: 4),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildAdminCard(Map<String, dynamic> admin) {
    bool isActive = admin['status'] == 'Active';
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: const Icon(Icons.person, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(admin['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.phone, size: 14, color: AppTheme.textSecondaryColor),
                          const SizedBox(width: 4),
                          Text(admin['phone'], style: const TextStyle(color: AppTheme.textSecondaryColor, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    admin['status'].toUpperCase(),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isActive ? Colors.green : Colors.red),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ASSIGNED SERVICES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textSecondaryColor)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (admin['services'] as List<String>).map((service) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(service, style: const TextStyle(fontSize: 11)),
                      );
                    }).toList(),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    child: const Text('Assign'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    child: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isActive ? Colors.red : Colors.green,
                      side: BorderSide(color: isActive ? Colors.red : Colors.green),
                    ),
                    child: Text(isActive ? 'Suspend' : 'Activate'),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
