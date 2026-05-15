import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  String _selectedGroup = 'All Residents';
  Future<List<Map<String, dynamic>>>? _notificationsFuture;

  @override
  void initState() {
    super.initState();
    _notificationsFuture = _fetchNotifications();
  }

  Future<List<Map<String, dynamic>>> _fetchNotifications() async {
    final data = await ApiService.getData('/api/v1/superadmin/notifications');
    final notifications = List<Map<String, dynamic>>.from(data['notifications'] ?? []);
    return notifications.map((n) {
      final target = _formatTarget(n['targetType']);
      return {
        'title': n['title'] ?? 'Notification',
        'message': n['message'] ?? '',
        'target': target,
        'time': _formatTime(n['createdAt']),
        'delivered': 'Delivered',
        'icon': _targetIcon(n['targetType']),
        'color': AppTheme.primaryColor,
      };
    }).toList();
  }

  String _formatTarget(dynamic targetType) {
    final raw = (targetType ?? '').toString().toLowerCase();
    if (raw == 'all') return 'All Residents';
    if (raw == 'block') return 'Block Residents';
    if (raw == 'service') return 'Service Group';
    return 'All Residents';
  }

  IconData _targetIcon(dynamic targetType) {
    final raw = (targetType ?? '').toString().toLowerCase();
    if (raw == 'block') return Icons.location_city;
    if (raw == 'service') return Icons.design_services;
    return Icons.campaign;
  }

  String _formatTime(dynamic createdAt) {
    final dt = _parseTimestamp(createdAt);
    if (dt == null) return 'Unknown';
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  DateTime? _parseTimestamp(dynamic ts) {
    if (ts == null) return null;
    if (ts is String) {
      return DateTime.tryParse(ts);
    }
    if (ts is Map) {
      final seconds = ts['_seconds'] ?? ts['seconds'];
      if (seconds is int) {
        return DateTime.fromMillisecondsSinceEpoch(seconds * 1000, isUtc: true).toLocal();
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontSize: 18)),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _notificationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final List<Map<String, dynamic>> history = snapshot.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.campaign, color: AppTheme.primaryColor),
                    SizedBox(width: 8),
                    Text('Broadcast New Message', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('Recipient Target Group', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: _buildGroupChip('All Residents')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildGroupChip('Admins')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildGroupChip('Maintenance')),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Notification Title', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                  decoration: InputDecoration(
                    hintText: 'e.g. Scheduled Water Maintenance',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Message Content', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Write your announcement details here...',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.send),
                    label: const Text('Send Notification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Sent History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    TextButton(onPressed: () {}, child: const Text('View All >')),
                  ],
                ),
                const SizedBox(height: 16),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: history.length,
                  itemBuilder: (context, index) {
                    return _buildHistoryCard(history[index]);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildGroupChip(String label) {
    bool isSelected = _selectedGroup == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedGroup = label;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isSelected) const Icon(Icons.check, size: 16, color: Colors.white),
            if (isSelected) const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppTheme.textPrimaryColor,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: (item['color'] as Color).withOpacity(0.1),
                  child: Icon(item['icon'] as IconData, color: item['color'] as Color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text(item['time'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                    ],
                  ),
                ),
                IconButton(icon: const Icon(Icons.more_vert, size: 20), onPressed: () {}),
              ],
            ),
            const SizedBox(height: 12),
            Text(item['message'], style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 16),
            Row(
              children: [
                Icon(Icons.groups, size: 14, color: AppTheme.textSecondaryColor),
                const SizedBox(width: 4),
                Text(item['target'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                const SizedBox(width: 16),
                Icon(Icons.done_all, size: 14, color: Colors.green),
                const SizedBox(width: 4),
                Text(item['delivered'], style: const TextStyle(fontSize: 12, color: Colors.green)),
              ],
            )
          ],
        ),
      ),
    );
  }
}