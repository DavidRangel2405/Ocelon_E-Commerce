// ================================
// ADMIN - REPORTES DINÁMICOS
// ================================

let reportData = [];

async function generateReportCRUD() {
  const startDate = document.getElementById('reportStartDate')?.value;
  const endDate = document.getElementById('reportEndDate')?.value;
  if (!startDate || !endDate) return showNotification('Selecciona un rango de fechas', 'warning');

  const res = await fetch(`/api/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const result = await res.json();
  if (result.success) {
    reportData = result.data;
    renderReportResultsCRUD(reportData);
  } else {
    showNotification('Error al generar reporte', 'error');
  }
}

function renderReportResultsCRUD(data) {
  const container = document.getElementById('adminReportResults');
  if (!container) return;

  const summary = data.summary || {};
  container.innerHTML = `
    <div class="row mb-4">
      <div class="col-md-3"><div class="card text-center"><h6>Ingresos Totales</h6><h3 class="text-primary">${formatCurrency(summary.totalRevenue || 0)}</h3></div></div>
      <div class="col-md-3"><div class="card text-center"><h6>Transacciones</h6><h3 class="text-info">${summary.totalTransactions || 0}</h3></div></div>
      <div class="col-md-3"><div class="card text-center"><h6>Promedio</h6><h3 class="text-success">${formatCurrency(summary.avgTransaction || 0)}</h3></div></div>
      <div class="col-md-3"><div class="card text-center"><h6>IVA Total</h6><h3 class="text-warning">${formatCurrency(summary.totalIVA || 0)}</h3></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5>Detalle por Estacionamiento</h5>
        <div>
          <button class="btn btn-sm btn-success" onclick="exportReportToExcel()"><i class="fas fa-file-excel"></i> Excel</button>
          <button class="btn btn-sm btn-danger ms-2" onclick="exportReportToPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
        </div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped" id="adminReportTable">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estacionamiento</th>
                <th class="text-end">Ingresos</th>
                <th class="text-center">Transacciones</th>
                <th class="text-end">Promedio</th>
              </tr>
            </thead>
            <tbody>
              ${data.details.map(d => `
                <tr>
                  <td>${d._id.date}</td>
                  <td>${d._id.parking}</td>
                  <td class="text-end">${formatCurrency(d.totalAmount)}</td>
                  <td class="text-center">${d.totalTransactions}</td>
                  <td class="text-end">${formatCurrency(d.avgAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

window.exportReportToExcel = () => exportTableToExcel('adminReportTable', 'reporte_ingresos');
window.exportReportToPDF = () => exportTableToPDF('adminReportTable', 'reporte_ingresos');

// === INICIALIZAR ===
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reportForm');
  if (form) form.addEventListener('submit', e => { e.preventDefault(); generateReportCRUD(); });
});