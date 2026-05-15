import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';
import 'community_control_page.dart';
import 'resident_management_page.dart';
import 'service_management_page.dart';
import 'admin_management_page.dart';
import 'complaint_management_page.dart';
import 'notifications_page.dart';
import 'document_management_page.dart';
import 'billing_page.dart';
import 'settings_page.dart';

class SuperAdminDashboard extends StatefulWidget {
  const SuperAdminDashboard({super.key});

  @override
  State<SuperAdminDashboard> createState() => _SuperAdminDashboardState();
}

class _SuperAdminDashboardState extends State<SuperAdminDashboard> {
  int _currentIndex = 0;
  Future<Map<String, dynamic>>? _dashboardFuture;

  @override
  void initState() {
    super.initState();
    _dashboardFuture = _fetchDashboardData();
  }

  Future<Map<String, dynamic>> _fetchDashboardData() async {
    final data = await ApiService.getData('/api/v1/superadmin/dashboard');
    return Map<String, dynamic>.from(data ?? {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('UrbanAxis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            Text('Super Admin Portal (v2)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
          const Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: CircleAvatar(
              backgroundColor: Colors.white24,
              child: Text('SA', style: TextStyle(color: Colors.white)),
            ),
          )
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.home_repair_service), label: 'Services'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Residents'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt), label: 'Billing'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 1:
        return const ServiceManagementPage();
      case 2:
        return const ResidentManagementPage();
      case 3:
        return const BillingPage();
      case 4:
        return const SettingsPage();
      case 0:
      default:
        return FutureBuilder<Map<String, dynamic>>(
          future: _dashboardFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (!snapshot.hasData) {
              return const Center(child: Text('No data'));
            }
            return _buildDashboardContent(snapshot.data!);
          },
        );
    }
  }

  Widget _buildDashboardContent(Map<String, dynamic> dashboardData) {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Overview',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor),
          ),
          const SizedBox(height: 16),
          _buildOverviewCards(dashboardData),
          const SizedBox(height: 24),
          const Text(
            'Management Modules',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor),
          ),
          const SizedBox(height: 16),
          _buildModulesGrid(context),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent Activity',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor),
              ),
              TextButton(onPressed: (){}, child: const Text('View All'))
            ],
          ),
          _buildRecentActivityList(),
        ],
      ),
    );
  }

  Widget _buildOverviewCards(Map<String, dynamic> dashboardData) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'Total Residents',
            value: dashboardData['totalResidents']?.toString() ?? '-',
            icon: Icons.people_alt,
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            title: 'Active Residents',
            value: dashboardData['activeResidents']?.toString() ?? '-',
            icon: Icons.person_pin,
            color: AppTheme.primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildModulesGrid(BuildContext context) {
    final modules = [
      {'title': 'Community Control', 'icon': Icons.location_city, 'page': const CommunityControlPage()},
      {'title': 'Resident Management', 'icon': Icons.people, 'page': const ResidentManagementPage()},
      {'title': 'Service Management', 'icon': Icons.design_services, 'page': const ServiceManagementPage()},
      {'title': 'Admin Management', 'icon': Icons.admin_panel_settings, 'page': const AdminManagementPage()},
      {'title': 'Complaint Management', 'icon': Icons.warning_amber_rounded, 'page': const ComplaintManagementPage()},
      {'title': 'Notifications & Broadcast', 'icon': Icons.campaign, 'page': const NotificationsPage()},
      {'title': 'Document Management', 'icon': Icons.folder_copy, 'page': const DocumentManagementPage()},
      {'title': 'Audit Logs', 'icon': Icons.history, 'page': null},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.1,
      ),
      itemCount: modules.length,
      itemBuilder: (context, index) {
        final module = modules[index];
        return _ModuleCard(
          title: module['title'] as String,
          icon: module['icon'] as IconData,
          onTap: () {
            if (module['page'] != null) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => module['page'] as Widget),
              );
            }
          },
        );
      },
    );
  }

  Widget _buildRecentActivityList() {
    return Column(
      children: [
        _ActivityTile(title: 'New Resident Approval', subtitle: 'Block A - Sarah Jenkins', time: '2m ago', icon: Icons.person_add, color: Colors.green),
        _ActivityTile(title: 'Service Schedule Updated', subtitle: 'Elevator Maintenance', time: '45m ago', icon: Icons.build, color: Colors.blue),
        _ActivityTile(title: 'Complaint Status: Resolved', subtitle: 'Plumbing Issue - Flat 402', time: '2h ago', icon: Icons.check_circle, color: AppTheme.primaryColor),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor)),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
          ],
        ),
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _ModuleCard({required this.title, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppTheme.primaryColor, size: 32),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimaryColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String time;
  final IconData icon;
  final Color color;

  const _ActivityTile({required this.title, required this.subtitle, required this.time, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade200)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
        trailing: Text(time, style: const TextStyle(fontSize: 12, color: AppTheme.secondaryColor)),
      ),
    );
  }
}
