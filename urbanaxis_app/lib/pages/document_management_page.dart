import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DocumentManagementPage extends StatelessWidget {
  const DocumentManagementPage({super.key});

  final List<Map<String, dynamic>> _documents = const [
    {
      'name': 'Building Rules & Reg...',
      'category': 'POLICY',
      'date': 'Updated Jul 14',
      'size': '2.4 MB',
      'icon': Icons.description,
      'color': Colors.red,
    },
    {
      'name': 'Fire Safety & Emer...',
      'category': 'SAFETY',
      'date': 'Updated Oct 04',
      'size': '1.1 MB',
      'icon': Icons.local_fire_department,
      'color': Colors.orange,
    },
    {
      'name': 'Annual General M...',
      'category': 'MINUTES',
      'date': 'Updated Sep 12',
      'size': '3.2 MB',
      'icon': Icons.people,
      'color': Colors.blue,
    },
    {
      'name': 'Sustainability Initi...',
      'category': 'REGULATION',
      'date': 'Updated Aug 12',
      'size': '800 KB',
      'icon': Icons.eco,
      'color': Colors.green,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Official Documents', style: TextStyle(fontSize: 18)),
      ),
      body: Column(
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
              itemCount: _documents.length,
              itemBuilder: (context, index) {
                return _buildDocCard(_documents[index]);
              },
            ),
          ),
          _buildUploadSection(),
        ],
      ),
    );
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
