// ================================
// EXPORTACIÓN EXCEL & PDF
// ================================

function exportTableToExcel(tableId, filename = 'reporte') {
  const table = document.getElementById(tableId);
  if (!table) return showNotification('Tabla no encontrada', 'warning');
  const wb = XLSX.utils.table_to_book(table, { sheet: 'Reporte' });
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  showNotification('Exportado a Excel', 'success');
}

function exportTableToPDF(tableId, filename = 'reporte') {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const table = document.getElementById(tableId);
  if (!table) return showNotification('Tabla no encontrada', 'warning');
  doc.autoTable({ html: `#${tableId}` });
  doc.save(`${filename}.pdf`);
  showNotification('Exportado a PDF', 'success');
}