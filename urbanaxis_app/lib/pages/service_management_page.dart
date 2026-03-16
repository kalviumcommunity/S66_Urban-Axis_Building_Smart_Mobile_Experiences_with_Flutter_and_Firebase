import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ServiceManagementPage extends StatefulWidget {
  const ServiceManagementPage({super.key});

  @override
  State<ServiceManagementPage> createState() => _ServiceManagementPageState();
}

class _ServiceManagementPageState extends State<ServiceManagementPage> {
  String _selectedFilter = 'All Services';


  final List<Map<String, dynamic>> _services = [
    {
      'name': 'Elite Fitness Center',
      'timing': 'Daily 6:00 AM - 10:00 PM',
      'status': 'Active',
      'users': '45 Active Users',
      'booking': 'Booking Required',
      'icon': Icons.fitness_center,
      'color': Colors.deepOrange,
    },
    {
      'name': 'Rooftop Infinity Pool',
      'timing': 'Daily 6:00 AM - 8:00 PM',
      'status': 'Active',
      'users': 'Temp. 28°C',
      'booking': 'pH 7.4 (Good)',
      'icon': Icons.pool,
      'color': Colors.blue,
    },
    {
      'name': 'Smart Parking (B2)',
      'timing': '24/7 Access',
      'status': 'Maintenance',
      'users': '12 Slots Available',
      'booking': '4 EV Stations',
      'icon': Icons.local_parking,
      'color': Colors.grey,
    },
    {
      'name': 'Community Grand Hall',
      'timing': 'By Reservation Only',
      'status': 'Closed',
      'users': '200 Person Cap.',
      'booking': 'AV Equipment Incl.',
      'icon': Icons.celebration,
      'color': Colors.purple,
    },
  ];

  @override
  Widget build(BuildContext context) {
    List<Map<String, dynamic>> filteredServices = _services.where((s) {
      if (_selectedFilter == 'All Services') return true;
      if (_selectedFilter == 'Active') return s['status'] == 'Active';
      if (_selectedFilter == 'Inactive') return s['status'] == 'Closed';
      if (_selectedFilter == 'Maintenance') return s['status'] == 'Maintenance';
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Management', style: TextStyle(fontSize: 18)),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const ClampingScrollPhysics(),
              child: Row(
                children: [
                  const SizedBox(width: 16),
                  _TabItem(title: 'All Services', isSelected: _selectedFilter == 'All Services', onTap: () => setState(() => _selectedFilter = 'All Services')),
                  const SizedBox(width: 24),
                  _TabItem(title: 'Active', isSelected: _selectedFilter == 'Active', onTap: () => setState(() => _selectedFilter = 'Active')),
                  const SizedBox(width: 24),
                  _TabItem(title: 'Inactive', isSelected: _selectedFilter == 'Inactive', onTap: () => setState(() => _selectedFilter = 'Inactive')),
                  const SizedBox(width: 24),
                  _TabItem(title: 'Maintenance', isSelected: _selectedFilter == 'Maintenance', onTap: () => setState(() => _selectedFilter = 'Maintenance')),
                  const SizedBox(width: 16),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: filteredServices.length,
              itemBuilder: (context, index) {
                return _buildServiceCard(filteredServices[index]);
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppTheme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    String status = service['status'];
    Color statusBg = status == 'Active' ? Colors.green : (status == 'Maintenance' ? Colors.orange : Colors.red);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Simulated Image Header
          Container(
            height: 120,
            width: double.infinity,
            color: service['color'].withOpacity(0.2),
            child: Stack(
              children: [
                Center(
                  child: Icon(service['icon'], size: 64, color: service['color']),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ],
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
                    Expanded(
                      child: Text(
                        service['name'],
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, color: AppTheme.textSecondaryColor),
                      onPressed: () {},
                    ),
                  ],
                ),
                Text(
                  service['timing'],
                  style: const TextStyle(color: AppTheme.textSecondaryColor, fontSize: 13),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.people_outline, size: 16, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 4),
                    Text(service['users'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                    const SizedBox(width: 16),
                    Icon(Icons.calendar_today_outlined, size: 16, color: AppTheme.textSecondaryColor),
                    const SizedBox(width: 4),
                    Text(service['booking'], style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                  ],
                ),
                const Divider(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                        ),
                        child: const Text('Delete'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                        ),
                        child: const Text('Manage'),
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

class _TabItem extends StatelessWidget {
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabItem({required this.title, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? AppTheme.primaryColor : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryColor,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
