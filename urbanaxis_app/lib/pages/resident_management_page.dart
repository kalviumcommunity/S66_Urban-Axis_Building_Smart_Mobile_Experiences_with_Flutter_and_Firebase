import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class ResidentManagementPage extends StatefulWidget {
  const ResidentManagementPage({super.key});

  @override
  State<ResidentManagementPage> createState() => _ResidentManagementPageState();
}

  String _selectedFilter = 'All Residents';
  Future<List<Map<String, dynamic>>>? _residentsFuture;

  @override
  void initState() {
    super.initState();
    _residentsFuture = _fetchResidents();
  }

  Future<List<Map<String, dynamic>>> _fetchResidents() async {
    final data = await ApiService.getData('/api/v1/superadmin/residents');
    final residents = List<Map<String, dynamic>>.from(data['residents'] ?? []);
    return residents.map((r) {
      final block = r['block']?.toString() ?? '';
      final house = r['houseNumber']?.toString() ?? '';
      final floor = r['floor']?.toString();
      final locationParts = <String>[];
      if (block.isNotEmpty) locationParts.add('Block $block');
      if (house.isNotEmpty) locationParts.add('Flat $house');
      if (locationParts.isEmpty && floor != null && floor.isNotEmpty) locationParts.add('Floor $floor');

      return {
        'name': r['name'] ?? 'Unknown',
        'location': locationParts.isNotEmpty ? locationParts.join(' • ') : 'Location not set',
        'status': _formatStatus(r['status']),
        'avatar': Icons.person,
      };
    }).toList();
  }

  String _formatStatus(dynamic status) {
    final raw = (status ?? '').toString().toLowerCase();
    if (raw == 'active') return 'Active';
    if (raw == 'pending') return 'Pending';
    if (raw == 'suspended') return 'Suspended';
    if (raw == 'inactive') return 'Inactive';
    if (raw == 'blacklisted') return 'Blacklisted';
    return 'Pending';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resident Management', style: TextStyle(fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          )
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _residentsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final List<Map<String, dynamic>> residents = snapshot.data!;
          List<Map<String, dynamic>> filteredResidents = residents.where((r) {
            if (_selectedFilter == 'All Residents') return true;
            if (_selectedFilter.startsWith('Pending')) return r['status'] == 'Pending';
            if (_selectedFilter == 'Active') return r['status'] == 'Active';
            return true;
          }).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Manage, approve, and oversee all community members',
                      style: TextStyle(color: AppTheme.textSecondaryColor),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search residents by name, block or flat...',
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
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('All Residents'),
                          const SizedBox(width: 8),
                          _buildFilterChip('Pending (1)'),
                          const SizedBox(width: 8),
                          _buildFilterChip('Active'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: filteredResidents.length,
                  itemBuilder: (context, index) {
                    return _buildResidentCard(filteredResidents[index]);
                  },
                ),
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    bool isSelected = _selectedFilter == label;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (bool selected) {
        setState(() {
          _selectedFilter = label;
        });
      },
      backgroundColor: Colors.white,
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textSecondaryColor,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300),
      ),
    );
  }

  Widget _buildResidentCard(Map<String, dynamic> resident) {
    String status = resident['status'];
    Color statusColor;
    Color statusBgColor;

    if (status == 'Pending') {
      statusColor = Colors.orange;
      statusBgColor = Colors.orange.withOpacity(0.1);
    } else if (status == 'Active') {
      statusColor = Colors.green;
      statusBgColor = Colors.green.withOpacity(0.1);
    } else {
      statusColor = Colors.red;
      statusBgColor = Colors.red.withOpacity(0.1);
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBgColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20, color: AppTheme.secondaryColor),
                  onPressed: () {},
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                )
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                  child: Icon(resident['avatar'] as IconData, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(resident['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Text(resident['location'], style: const TextStyle(color: AppTheme.textSecondaryColor, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (status == 'Pending')
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                      child: const Text('Approve'),
                    ),
                  ),
                ],
              )
            else
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {},
                  child: const Text('View Profile'),
                ),
              )
          ],
        ),
      ),
    );
  }
}
