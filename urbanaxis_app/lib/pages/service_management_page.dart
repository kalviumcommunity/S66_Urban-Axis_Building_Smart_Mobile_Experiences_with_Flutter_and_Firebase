import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class ServiceManagementPage extends StatefulWidget {
  const ServiceManagementPage({super.key});

  @override
  State<ServiceManagementPage> createState() => _ServiceManagementPageState();
}

class _ServiceManagementPageState extends State<ServiceManagementPage> {
  String _selectedFilter = 'All Services';
  Future<List<Map<String, dynamic>>>? _servicesFuture;

  @override
  void initState() {
    super.initState();
    _servicesFuture = _fetchServices();
  }

  Future<List<Map<String, dynamic>>> _fetchServices() async {
    final data = await ApiService.getData('/api/v1/superadmin/services');
    final services = List<Map<String, dynamic>>.from(data['services'] ?? []);
    return services.map((s) {
      final status = _formatStatus(s['status']);
      final hours = s['operatingHours'] as Map<String, dynamic>?;
      final open = hours?['open']?.toString();
      final close = hours?['close']?.toString();
      final timing = (open != null && close != null) ? 'Daily $open - $close' : 'Hours not set';
      final current = s['currentOccupancy'] ?? 0;
      final max = s['maxCapacity'] ?? 0;
      final users = 'Occupancy $current/$max';
      final visible = s['visibilitySettings']?['isVisible'] == true ? 'Visible' : 'Hidden';
      final booking = visible;

      final icon = _typeIcon(s['type']);
      final color = _typeColor(s['type']);

      return {
        'name': s['name'] ?? 'Service',
        'timing': timing,
        'status': status,
        'users': users,
        'booking': booking,
        'icon': icon,
        'color': color,
      };
    }).toList();
  }

  String _formatStatus(dynamic status) {
    final raw = (status ?? '').toString().toLowerCase();
    if (raw == 'active') return 'Active';
    if (raw == 'maintenance') return 'Maintenance';
    if (raw == 'temporarily_closed' || raw == 'emergency_closed') return 'Closed';
    return 'Closed';
  }

  IconData _typeIcon(dynamic type) {
    switch ((type ?? '').toString().toLowerCase()) {
      case 'gym':
        return Icons.fitness_center;
      case 'pool':
        return Icons.pool;
      case 'party_hall':
        return Icons.celebration;
      case 'parking':
        return Icons.local_parking;
      case 'clubhouse':
        return Icons.home_work;
      case 'sports_area':
        return Icons.sports_soccer;
      default:
        return Icons.design_services;
    }
  }

  Color _typeColor(dynamic type) {
    switch ((type ?? '').toString().toLowerCase()) {
      case 'gym':
        return Colors.deepOrange;
      case 'pool':
        return Colors.blue;
      case 'party_hall':
        return Colors.purple;
      case 'parking':
        return Colors.grey;
      case 'clubhouse':
        return Colors.teal;
      case 'sports_area':
        return Colors.green;
      default:
        return AppTheme.primaryColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Service Management', style: TextStyle(fontSize: 18)),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _servicesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final List<Map<String, dynamic>> services = snapshot.data!;
          List<Map<String, dynamic>> filteredServices = services.where((s) {
            final status = (s['status'] ?? '').toString().toLowerCase();
            if (_selectedFilter == 'All Services') return true;
            if (_selectedFilter == 'Active') return status == 'active';
            if (_selectedFilter == 'Inactive') return status == 'closed' || status == 'inactive';
            if (_selectedFilter == 'Maintenance') return status == 'maintenance';
            return true;
          }).toList();
          return Column(
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
