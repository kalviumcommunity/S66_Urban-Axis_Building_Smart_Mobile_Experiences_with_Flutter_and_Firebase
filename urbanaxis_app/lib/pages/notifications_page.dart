import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  String _selectedGroup = 'All Residents';

  final List<Map<String, dynamic>> _history = [
    {
      'title': 'Elevator Maintenance - Block C',
      'message': 'Elevator A in Block C will be undergoing routine maintenance from 2 PM to 4 PM.',
      'target': 'All Residents',
      'time': '2m ago',
      'delivered': '340 Delivered',
      'icon': Icons.elevator,
      'color': AppTheme.primaryColor,
    },
    {
      'title': 'Emergency Security Update',
      'message': 'Attention all staff: New security protocols for main gate access are now in effect...',
      'target': 'Admins Only',
      'time': 'Yesterday',
      'delivered': '24 Delivered',
      'icon': Icons.security,
      'color': Colors.orange,
    },
    {
      'title': 'Holiday Greeting',
      'message': 'UrbanAxis wishes all our residents a joyful holiday season and a prosperous New Year!',
      'target': 'All Residents',
      'time': '2 days ago',
      'delivered': '450 Delivered',
      'icon': Icons.celebration,
      'color': Colors.green,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontSize: 18)),
      ),
      body: SingleChildScrollView(
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
              itemCount: _history.length,
              itemBuilder: (context, index) {
                return _buildHistoryCard(_history[index]);
              },
            ),
          ],
        ),
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
