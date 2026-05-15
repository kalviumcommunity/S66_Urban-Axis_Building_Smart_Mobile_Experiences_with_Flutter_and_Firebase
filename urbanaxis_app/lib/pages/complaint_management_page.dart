import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class ComplaintManagementPage extends StatefulWidget {
  const ComplaintManagementPage({super.key});

  @override
  State<ComplaintManagementPage> createState() => _ComplaintManagementPageState();
}

class _ComplaintManagementPageState extends State<ComplaintManagementPage> {
  Future<List<Map<String, dynamic>>>? _complaintsFuture;

  @override
  void initState() {
    super.initState();
    _complaintsFuture = _fetchComplaints();
  }

  Future<List<Map<String, dynamic>>> _fetchComplaints() async {
    final data = await ApiService.getData('/api/v1/superadmin/complaints');
    final complaints = List<Map<String, dynamic>>.from(data['complaints'] ?? []);
    return complaints.map((c) {
      final priority = _formatPriority(c['priority']);
      final icon = _categoryIcon(c['category']);
      final color = _priorityColor(priority);

      return {
        'id': c['id'] ?? '',
        'title': c['title'] ?? 'Complaint',
        'priority': priority,
        'category': c['category'] ?? 'General',
        'service': c['linkedServiceId'] ?? 'General',
        'status': _formatStatus(c['status']),
        'icon': icon,
        'color': color,
      };
    }).toList();
  }

  String _formatPriority(dynamic priority) {
    final raw = (priority ?? '').toString().toUpperCase();
    if (raw == 'CRITICAL') return 'CRITICAL PRIORITY';
    if (raw == 'HIGH') return 'HIGH PRIORITY';
    if (raw == 'MEDIUM') return 'MEDIUM PRIORITY';
    if (raw == 'LOW') return 'LOW PRIORITY';
    return 'MEDIUM PRIORITY';
  }

  String _formatStatus(dynamic status) {
    final raw = (status ?? '').toString().toLowerCase();
    if (raw == 'open') return 'Open';
    if (raw == 'in_progress') return 'In Progress';
    if (raw == 'resolved') return 'Resolved';
    if (raw == 'rejected') return 'Rejected';
    return 'Open';
  }

  IconData _categoryIcon(dynamic category) {
    final raw = (category ?? '').toString().toLowerCase();
    if (raw.contains('water') || raw.contains('plumb')) return Icons.water_damage;
    if (raw.contains('road')) return Icons.add_road;
    if (raw.contains('electric') || raw.contains('light')) return Icons.lightbulb;
    if (raw.contains('security')) return Icons.security;
    return Icons.report_problem;
  }

  Color _priorityColor(String priority) {
    if (priority.contains('CRITICAL') || priority.contains('HIGH')) return Colors.red;
    if (priority.contains('MEDIUM')) return Colors.orange;
    if (priority.contains('LOW')) return Colors.green;
    return Colors.grey;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Complaints', style: TextStyle(fontSize: 18)),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _complaintsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final List<Map<String, dynamic>> complaints = snapshot.data!;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Review and manage citizen grievances across all sectors.',
                      style: TextStyle(color: AppTheme.textSecondaryColor),
                    ),
                    SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _TabBtn(title: 'Open (24)', isSelected: true),
                        _TabBtn(title: 'In Progress (8)', isSelected: false),
                        _TabBtn(title: 'Resolved (120)', isSelected: false),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: complaints.length,
                  itemBuilder: (context, index) {
                    return _buildComplaintCard(complaints[index]);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildComplaintCard(Map<String, dynamic> complaint) {
    Color priorityColor = Colors.grey;
    if (complaint['priority'].contains('HIGH')) priorityColor = Colors.red;
    if (complaint['priority'].contains('MEDIUM')) priorityColor = Colors.orange;
    if (complaint['priority'].contains('LOW')) priorityColor = Colors.green;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 140,
            width: double.infinity,
            color: priorityColor.withOpacity(0.2),
            child: Center(
              child: Icon(complaint['icon'], size: 64, color: priorityColor),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: priorityColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        complaint['priority'],
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: priorityColor),
                      ),
                    ),
                    Text(complaint['id'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  complaint['title'],
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.category_outlined, size: 14, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 4),
                    Text(complaint['category'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                    const SizedBox(width: 12),
                    Icon(Icons.business_outlined, size: 14, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 4),
                    Text(complaint['service'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.sync),
                        label: const Text('Status', style: TextStyle(fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                        child: const Text('View Details', style: TextStyle(fontSize: 13)),
                      ),
                    ),
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String title;
  final bool isSelected;

  const _TabBtn({required this.title, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryColor : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
      ),
      child: Text(
        title,
        style: TextStyle(
          color: isSelected ? Colors.white : AppTheme.textSecondaryColor,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 13,
        ),
      ),
    );
  }
}