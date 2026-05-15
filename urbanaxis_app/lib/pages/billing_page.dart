import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../api_service.dart';

class BillingPage extends StatefulWidget {
  const BillingPage({super.key});

  @override
  State<BillingPage> createState() => _BillingPageState();
}

class _BillingPageState extends State<BillingPage> {
  Future<Map<String, dynamic>>? _billingFuture;

  @override
  void initState() {
    super.initState();
    _billingFuture = _fetchBillingData();
  }

  Future<Map<String, dynamic>> _fetchBillingData() async {
    final invoicesData = await ApiService.getData('/api/v1/superadmin/invoices');
    final summaryData = await ApiService.getData('/api/v1/superadmin/billing-summary');
    final rawInvoices = List<Map<String, dynamic>>.from(invoicesData['invoices'] ?? []);
    final invoices = rawInvoices.map((inv) {
      return {
        'id': inv['id'] ?? 'INV',
        'title': inv['title'] ?? 'Invoice',
        'date': _formatDate(inv['createdAt']),
        'amount': _formatAmount(inv['amount']),
        'status': _formatStatus(inv['status']),
      };
    }).toList();
    return {
      'invoices': invoices,
      'summary': Map<String, dynamic>.from(summaryData ?? {}),
    };
  }

  String _formatDate(dynamic createdAt) {
    final dt = _parseTimestamp(createdAt);
    if (dt == null) return 'Unknown date';
    return '${dt.month.toString().padLeft(2, '0')}/${dt.day.toString().padLeft(2, '0')}/${dt.year}';
  }

  String _formatAmount(dynamic amount) {
    if (amount == null) return '-';
    if (amount is num) return '\$${amount.toStringAsFixed(2)}';
    return amount.toString();
  }

  String _formatStatus(dynamic status) {
    final raw = (status ?? '').toString().toLowerCase();
    if (raw == 'paid') return 'Paid';
    if (raw == 'pending') return 'Pending';
    if (raw == 'overdue') return 'Overdue';
    return 'Pending';
  }

  DateTime? _parseTimestamp(dynamic ts) {
    if (ts == null) return null;
    if (ts is String) return DateTime.tryParse(ts);
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
        title: const Text('Billing & Invoices', style: TextStyle(fontSize: 18)),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _billingFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('No data'));
          }
          final invoices = List<Map<String, dynamic>>.from(snapshot.data!['invoices'] ?? []);
          final summary = snapshot.data!['summary'] ?? {};
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard('Total Collected', _formatAmount(summary['totalCollected']), Icons.account_balance_wallet, Colors.green),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildSummaryCard('Pending Dues', _formatAmount(summary['pendingDues']), Icons.pending_actions, Colors.orange),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Recent Invoices', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Create'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: invoices.length,
                  itemBuilder: (context, index) {
                    return _buildInvoiceCard(invoices[index]);
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryCard(String title, String amount, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
          const SizedBox(height: 4),
          Text(amount, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryColor)),
        ],
      ),
    );
  }

  Widget _buildInvoiceCard(Map<String, dynamic> invoice) {
    String status = invoice['status'];
    Color statusColor = Colors.grey;
    if (status == 'Paid') statusColor = Colors.green;
    if (status == 'Pending') statusColor = Colors.orange;
    if (status == 'Overdue') statusColor = Colors.red;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.receipt_long, color: AppTheme.primaryColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(invoice['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('${invoice['id']} • ${invoice['date']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryColor)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(invoice['amount'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primaryColor)),
                const SizedBox(height: 16),
                IconButton(
                  icon: const Icon(Icons.arrow_forward_ios, size: 16, color: AppTheme.textSecondaryColor),
                  onPressed: () {},
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}