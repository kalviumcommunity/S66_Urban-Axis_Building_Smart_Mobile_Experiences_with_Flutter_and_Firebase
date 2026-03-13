import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CommunityControlPage extends StatelessWidget {
  const CommunityControlPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Setup', style: TextStyle(fontSize: 18)),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Save Changes', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('General Information', 'Basic details about your residential community'),
            const SizedBox(height: 16),
            _buildTextField('Community Name', 'e.g. Greenwood Heights'),
            const SizedBox(height: 12),
            _buildTextField('Registration Number', 'e.g. REG-123456'),
            const SizedBox(height: 12),
            _buildTextField('Full Address', 'Enter full community address...', maxLines: 3),
            const SizedBox(height: 16),
            _buildLogoUpload(),
            const SizedBox(height: 32),
            
            _buildSectionHeader('Blocks & Wings', 'Define the structure of the community'),
            const SizedBox(height: 16),
            _buildBlockItem('Block A', '12 Floors, 48 Units', Icons.business),
            const SizedBox(height: 8),
            _buildBlockItem('Block B', '15 Floors, 60 Units', Icons.business),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Add New Block'),
            ),
            const SizedBox(height: 32),
            
            _buildSectionHeader('Floor Configuration', 'Standard floor and unit layout'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField('Number of floors', '12')),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Units per floor', '4')),
              ],
            ),
            const SizedBox(height: 12),
            _buildTextField('Unit Prefixing (e.g., 101, 1204)', 'Floor + Unit No (e.g. 101)'),
            const SizedBox(height: 32),

            _buildSectionHeader('Emergency Contacts', 'Primary contacts visible to all residents'),
            const SizedBox(height: 16),
            _buildContactItem('Security', '+1 (555) 000-1111', 'Head Guard'),
            const SizedBox(height: 8),
            _buildContactItem('Fire Safety', '+1 (555) 000-2222', 'Compliance Officer'),
            const SizedBox(height: 8),
            _buildContactItem('Maintenance', '+1 (555) 000-3333', 'Chief Engineer'),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Add Emergency Service'),
            ),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {},
                child: const Text('Save Community Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor)),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(fontSize: 14, color: AppTheme.textSecondaryColor)),
      ],
    );
  }

  Widget _buildTextField(String label, String hint, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextFormField(
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.secondaryColor),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppTheme.primaryColor),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLogoUpload() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.05),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3), style: BorderStyle.solid),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Icon(Icons.image, size: 48, color: AppTheme.primaryColor),
          const SizedBox(height: 12),
          const Text('Community Logo', style: TextStyle(fontWeight: FontWeight.bold)),
          const Text('PNG, JPG up to 5MB\nRecommended ration 1:1', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.upload),
            label: const Text('Upload Logo'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
              side: const BorderSide(color: AppTheme.primaryColor),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildBlockItem(String title, String subtitle, IconData icon) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppTheme.primaryColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: AppTheme.primaryColor),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(icon: const Icon(Icons.edit, size: 20, color: AppTheme.textSecondaryColor), onPressed: () {}),
            IconButton(icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red), onPressed: () {}),
          ],
        ),
      ),
    );
  }

  Widget _buildContactItem(String service, String number, String details) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(service, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            Expanded(
              flex: 3,
              child: Text(number, style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              flex: 2,
              child: Text(details, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
            ),
            IconButton(icon: const Icon(Icons.more_vert, size: 20), onPressed: () {}),
          ],
        ),
      ),
    );
  }
}
