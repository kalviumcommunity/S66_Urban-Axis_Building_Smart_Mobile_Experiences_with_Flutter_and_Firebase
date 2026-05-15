import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class DocumentManagementPage extends StatefulWidget {
  const DocumentManagementPage({super.key});

  @override
  State<DocumentManagementPage> createState() => _DocumentManagementPageState();
}

class _DocumentManagementPageState extends State<DocumentManagementPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Official Documents', style: TextStyle(fontSize: 18)),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchDocuments(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final List<Map<String, dynamic>> documents = snapshot.data!;
          return Column(
            children: [
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Manage community guidelines and safety protocols',
                            style: TextStyle(color: AppTheme.textSecondaryColor),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.upload_file, size: 18),
                          label: const Text('Upload PDF'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _TabBtn(title: 'All Files', isSelected: true),
                          SizedBox(width: 8),
                          _TabBtn(title: 'Safety', isSelected: false),
                          SizedBox(width: 8),
                          _TabBtn(title: 'Notices', isSelected: false),
                          SizedBox(width: 8),
                          _TabBtn(title: 'Regulations', isSelected: false),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: documents.length,
                  itemBuilder: (context, index) {
                    return _buildDocCard(documents[index]);
                  },
                ),
              ),
              _buildUploadSection(),
            ],
          );
        },
      ),
    );
  }

  Future<List<Map<String, dynamic>>> _fetchDocuments() async {
    final data = await ApiService.getData('/api/v1/superadmin/documents');
    final documents = List<Map<String, dynamic>>.from(data['documents'] ?? []);
    return documents.map((d) {
      final category = (d['category'] ?? 'DOCUMENT').toString().toUpperCase();
      return {
        'name': d['title'] ?? 'Document',
        'category': category,
        'date': _formatTime(d['createdAt']),
        'size': '-',
        'icon': _categoryIcon(category),
        'color': _categoryColor(category),
      };
    }).toList();
  }

  String _formatTime(dynamic createdAt) {
    final dt = _parseTimestamp(createdAt);
    if (dt == null) return 'Updated -';
    return 'Updated ${dt.month.toString().padLeft(2, '0')}/${dt.day.toString().padLeft(2, '0')}';
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

  IconData _categoryIcon(String category) {
    if (category.contains('SAFETY')) return Icons.local_fire_department;
    if (category.contains('NOTICE')) return Icons.campaign;
    if (category.contains('REGULATION')) return Icons.gavel;
    if (category.contains('POLICY')) return Icons.description;
    return Icons.description;
  }

  Color _categoryColor(String category) {
    if (category.contains('SAFETY')) return Colors.orange;
    if (category.contains('NOTICE')) return Colors.blue;
    if (category.contains('REGULATION')) return Colors.green;
    if (category.contains('POLICY')) return Colors.red;
    return AppTheme.primaryColor;
  }

  Widget _buildDocCard(Map<String, dynamic> doc) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: (doc['color'] as Color).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(doc['icon'] as IconData, color: doc['color'] as Color),
        ),
        title: Text(doc['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(doc['category'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              Text('${doc['date']} • ${doc['size']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
            ],
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(icon: const Icon(Icons.download_for_offline, color: AppTheme.primaryColor), onPressed: () {}),
            IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () {}),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3), style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_upload_outlined, size: 48, color: AppTheme.primaryColor),
          const SizedBox(height: 12),
          const Text('Drag and Drop Files', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          const Text(
            'Upload new community guidelines or notices in PDF format.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppTheme.textSecondaryColor, fontSize: 13),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () {},
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
              side: const BorderSide(color: AppTheme.primaryColor),
            ),
            child: const Text('Browse Local Storage'),
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