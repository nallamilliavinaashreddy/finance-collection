import * as XLSX from 'xlsx';

/**
 * Export JSON array data to XLSX spreadsheet file
 */
export function exportToExcel(data: Record<string, any>[], fileName: string, sheetName: string = 'Report') {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write file and trigger browser download
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export tabular data to PDF document via print container
 */
export function exportToPdf(title: string, headers: string[], rows: (string | number)[][], fileName: string) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #0f172a; font-size: 22px; margin-bottom: 4px; }
          p { color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-weight: 600; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Finance Collection Report - ${title}</h1>
        <p>Generated on: ${new Date().toLocaleString('en-IN')} | Live Supabase Dataset</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${cell !== undefined && cell !== null ? cell : '-'}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">Finance Collection Management System &copy; ${new Date().getFullYear()}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
