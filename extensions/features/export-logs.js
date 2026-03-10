/**
 * Export Logs Feature Module
 * Allows users to export alerts and statistics to CSV/JSON
 */

(function() {
  'use strict';

  // Export data as CSV
  function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  // Export data as JSON
  function exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, filename, 'application/json');
  }

  // Download file helper
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[Export] Downloaded ${filename}`);
  }

  // Get current status from API
  async function fetchCurrentStatus() {
    try {
      const response = await fetch('/api/status');
      return await response.json();
    } catch (error) {
      console.error('[Export] Error fetching status:', error);
      return null;
    }
  }

  // Export alerts
  async function exportAlerts(format = 'csv') {
    const status = await fetchCurrentStatus();
    if (!status || !status.alerts || status.alerts.length === 0) {
      alert('No alerts available to export');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `firewall_alerts_${timestamp}.${format}`;

    if (format === 'csv') {
     exportToCSV(status.alerts, filename);
    } else if (format === 'json') {
     exportToJSON(status.alerts, filename);
    }
  }

  // Export IP statistics
  async function exportIPStats(format = 'csv') {
    const status = await fetchCurrentStatus();
    if (!status || !status.ip_stats) {
      alert('No IP statistics available');
      return;
    }

    // Convert ip_stats object to array
    const ipArray = Object.entries(status.ip_stats).map(([ip, stats]) => ({
      ip_address: ip,
      packets: stats.packets,
      pps: stats.pps,
      avg_score: stats.avg_score || 'N/A',
      blocked: stats.blocked ? 'Yes' : 'No'
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `firewall_ip_stats_${timestamp}.${format}`;

    if (format === 'csv') {
     exportToCSV(ipArray, filename);
    } else if (format === 'json') {
     exportToJSON(ipArray, filename);
    }
  }

  // Export full report
  async function exportFullReport() {
    const status = await fetchCurrentStatus();
    if (!status) {
      alert('Failed to fetch status for export');
      return;
    }

    const report = {
     exported_at: new Date().toISOString(),
      summary: {
        packets_captured: status.packets_captured,
        threats_blocked: status.threats_blocked,
        model_trained: status.model_trained,
        blocked_ips_count: status.blocked_ips.length,
        tracked_ips_count: Object.keys(status.ip_stats).length
      },
      attack_types: status.attack_types,
      blocked_ips: status.blocked_ips,
      alerts: status.alerts,
      ip_statistics: status.ip_stats
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `firewall_full_report_${timestamp}.json`;
   exportToJSON(report, filename);
  }

  // Create export button in UI
  function createExportButton() {
    const panel = document.querySelector('.ph span');
    if (!panel || panel.textContent !== 'IP REPUTATION TABLE') {
      setTimeout(createExportButton, 100);
      return;
    }

    const parent = panel.parentElement;
    
    // Check if button already exists
    if (parent.querySelector('#exportBtn')) {
      return;
    }

    const exportBtn = document.createElement('button');
   exportBtn.id = 'exportBtn';
   exportBtn.className = 'btn btn-blue';
   exportBtn.textContent = '📥 EXPORT';
   exportBtn.style.cssText = 'margin-left: 8px;';
   exportBtn.onclick = showExportMenu;

    parent.appendChild(exportBtn);
  }

  // Show export menu
  function showExportMenu() {
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #2d3748;
      border-radius: 8px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      min-width: 250px;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Export Data';
    title.style.cssText = 'margin: 0 0 15px 0; color: #1a202e; font-size: 1.1rem;';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const buttons = [
      { label: '📊 Alerts (CSV)', action: () => exportAlerts('csv') },
      { label: '📊 Alerts (JSON)', action: () => exportAlerts('json') },
      { label: '📈 IP Stats (CSV)', action: () => exportIPStats('csv') },
      { label: '📈 IP Stats (JSON)', action: () => exportIPStats('json') },
      { label: '📋 Full Report (JSON)', action: exportFullReport }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.label;
      button.style.cssText = `
        padding: 10px 15px;
        border: 1px solid #4a5568;
        border-radius: 6px;
        background: #f7fafc;
        color: #2d3748;
        cursor: pointer;
        font-family: inherit;
        font-size: 0.9rem;
        transition: all 0.2s;
      `;
      button.onmouseover= () => {
        button.style.background = '#e2e8f0';
        button.style.transform = 'translateX(5px)';
      };
      button.onmouseout = () => {
        button.style.background = '#f7fafc';
        button.style.transform = 'translateX(0)';
      };
      button.onclick = () => {
        btn.action();
        document.body.removeChild(menu);
      };
      buttonContainer.appendChild(button);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌ Cancel';
    closeBtn.style.cssText = `
      margin-top: 15px;
      padding: 8px 15px;
      border: 1px solid #cbd5e0;
      border-radius: 6px;
      background: white;
      color: #4a5568;
      cursor: pointer;
      width: 100%;
    `;
    closeBtn.onclick = () => document.body.removeChild(menu);

    menu.appendChild(title);
    menu.appendChild(buttonContainer);
    menu.appendChild(closeBtn);
    document.body.appendChild(menu);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createExportButton);
  } else {
    createExportButton();
  }

  // Expose API
  window.ExportLogs = {
   exportAlerts,
   exportIPStats,
   exportFullReport
  };

})();
