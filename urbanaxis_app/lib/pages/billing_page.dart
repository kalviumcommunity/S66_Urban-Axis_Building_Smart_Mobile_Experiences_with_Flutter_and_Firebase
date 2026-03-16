import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BillingPage extends StatefulWidget {
  const BillingPage({super.key});

  @override
  State<BillingPage> createState() => _BillingPageState();
}

class _BillingPageState extends State<BillingPage> {
  final List<Map<String, dynamic>> _invoices = [
    {
      'id': 'INV-2023-081',
      'title': 'Monthly Maintenance',
      'date': 'Oct 01, 2023',
      'amount': '\$4,250.00',
      'status': 'Paid',
    },
    {
      'id': 'INV-2023-082',
      'title': 'Elevator Annual AMC',
      'date': 'Oct 15, 2023',
      'amount': '\$1,100.00',
      'status': 'Pending',
    },
    {
      'id': 'INV-2023-083',
      'title': 'Water Supply Bill',
      'date': 'Oct 18, 2023',
      'amount': '\$850.00',
      'status': 'Overdue',
    },
    {
      'id': 'INV-2023-084',
      'title': 'Landscaping Services',
      'date': 'Oct 20, 2023',
      'amount': '\$600.00',
      'status': 'Paid',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Billing & Invoices', style: TextStyle(fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildSummaryCard('Total Collected', '\$12,450', Icons.account_balance_wallet, Colors.green),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard('Pending Dues', '\$1,950', Icons.pending_actions, Colors.orange),
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
              itemCount: _invoices.length,
              itemBuilder: (context, index) {
                return _buildInvoiceCard(_invoices[index]);
              },
            ),
          ],
        ),
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
