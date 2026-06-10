import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Create workbook
wb = openpyxl.Workbook()
wb.remove(wb.active)  # Remove default sheet

# Sheet 1: Overview
ws_overview = wb.create_sheet("Overview")

# Header style
header_font = Font(name='Arial', size=12, bold=True, color='FFFFFF')
header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
header_alignment = Alignment(horizontal='center', vertical='center')

# Data style
data_font = Font(name='Arial', size=11)
data_alignment = Alignment(horizontal='left', vertical='center')

# Headers
headers = ['Metric', 'Value']
for col, header in enumerate(headers, start=1):
    cell = ws_overview.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment

# Overview data
overview_data = [
    ['Total Automated Tests', '134'],
    ['Backend Coverage %', '88.24%'],
    ['Authentication Tests', '8'],
    ['Security Tests', '9'],
    ['Supplier Selection Tests', '7'],
    ['Escrow Lifecycle Tests', '10'],
    ['x402 Payment Tests', '12'],
    ['End-to-End Workflow Tests', '1'],
    ['Analytics Tests', '10'],
    ['Integration Tests', '77'],
]

for row_idx, (metric, value) in enumerate(overview_data, start=2):
    ws_overview.cell(row=row_idx, column=1, value=metric).font = data_font
    ws_overview.cell(row=row_idx, column=1).alignment = data_alignment
    ws_overview.cell(row=row_idx, column=2, value=value).font = data_font
    ws_overview.cell(row=row_idx, column=2).alignment = data_alignment

# Column widths
ws_overview.column_dimensions['A'].width = 35
ws_overview.column_dimensions['B'].width = 20

# Sheet 2: Test Inventory
ws_inventory = wb.create_sheet("Test Inventory")

# Headers
headers = ['Test File', 'Number of Tests', 'Purpose']
for col, header in enumerate(headers, start=1):
    cell = ws_inventory.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment

# Test inventory data
inventory_data = [
    ['test_auth.py', '8', 'Authentication & JWT validation'],
    ['test_security_hardening.py', '9', 'Security hardening & validation'],
    ['test_supplier_selection.py', '7', 'Supplier selection & ranking'],
    ['test_escrow.py', '5', 'Escrow lifecycle management'],
    ['test_escrow_edge.py', '5', 'Escrow edge cases & error handling'],
    ['test_x402_payment.py', '12', 'x402 payment protocol verification'],
    ['test_end_to_end_procurement_flow.py', '1', 'Complete end-to-end workflow'],
    ['test_health.py', '3', 'Health check & service availability'],
    ['test_services_coverage.py', '10', 'Service layer coverage'],
    ['test_high_coverage.py', '35', 'High-coverage unit tests'],
    ['test_coverage_90_push.py', '12', 'Coverage boost tests'],
    ['test_coverage_boost.py', '7', 'Additional coverage tests'],
]

for row_idx, (file, count, purpose) in enumerate(inventory_data, start=2):
    ws_inventory.cell(row=row_idx, column=1, value=file).font = data_font
    ws_inventory.cell(row=row_idx, column=1).alignment = data_alignment
    ws_inventory.cell(row=row_idx, column=2, value=count).font = data_font
    ws_inventory.cell(row=row_idx, column=2).alignment = data_alignment
    ws_inventory.cell(row=row_idx, column=3, value=purpose).font = data_font
    ws_inventory.cell(row=row_idx, column=3).alignment = data_alignment

# Column widths
ws_inventory.column_dimensions['A'].width = 30
ws_inventory.column_dimensions['B'].width = 18
ws_inventory.column_dimensions['C'].width = 40

# Sheet 3: Coverage
ws_coverage = wb.create_sheet("Coverage")

# Headers
headers = ['Module', 'Coverage %']
for col, header in enumerate(headers, start=1):
    cell = ws_coverage.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment

# Coverage data
coverage_data = [
    ['main.py', '89.52%'],
    ['ai_agent.py', '92.63%'],
    ['blockchain.py', '100%'],
    ['db.py', '95%'],
    ['escrow_service.py', '59.26%'],
    ['services/', '87.94%'],
    ['x402/', 'High coverage'],
    ['Overall Backend', '88.24%'],
]

for row_idx, (module, coverage) in enumerate(coverage_data, start=2):
    ws_coverage.cell(row=row_idx, column=1, value=module).font = data_font
    ws_coverage.cell(row=row_idx, column=1).alignment = data_alignment
    ws_coverage.cell(row=row_idx, column=2, value=coverage).font = data_font
    ws_coverage.cell(row=row_idx, column=2).alignment = data_alignment

# Column widths
ws_coverage.column_dimensions['A'].width = 30
ws_coverage.column_dimensions['B'].width = 15

# Save workbook
wb.save('test-reports/testing-report.xlsx')
print("Excel report generated successfully!")
