/**
 * Traffic Graphs Feature Module
 * Visual charts for network traffic using Chart.js
 */

(function() {
  'use strict';

  let packetsChart = null;
  let attacksChart = null;
  let updateInterval = null;

  // Load Chart.js from CDN if not already loaded
  function loadChartJS() {
    return new Promise((resolve, reject) => {
      if (window.Chart) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Create chart container
  function createChartContainer() {
    const container= document.createElement('div');
    container.id = 'trafficGraphsPanel';
    container.style.cssText = `
      position: fixed;
      top: 70px;
      right: -600px;
      width: 550px;
     background: var(--bg-panel, #ffffff);
      border: 2px solid var(--border-medium, #cbd5e0);
      border-radius: 12px;
      padding: 20px;
      z-index: 9998;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      transition: right 0.4s ease;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--border-light, #e2e8f0);
    `;

    const title = document.createElement('h3');
    title.textContent = '📊 Traffic Analytics';
    title.style.cssText = `
      margin: 0;
      color: var(--text-primary, #1a202e);
      font-size: 1.1rem;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-red';
    closeBtn.textContent = '✕';
    closeBtn.onclick = toggleGraphPanel;

    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Packets over time chart
    const packetsCanvas = document.createElement('canvas');
    packetsCanvas.id = 'packetsChart';
    packetsCanvas.height = '200';
    packetsCanvas.style.marginBottom = '30px';
    container.appendChild(packetsCanvas);

    // Attack types chart
    const attacksCanvas = document.createElement('canvas');
    attacksCanvas.id = 'attacksChart';
    attacksCanvas.height = '200';
    container.appendChild(attacksCanvas);

    document.body.appendChild(container);
  }

  // Toggle graph panel visibility
  function toggleGraphPanel() {
    const panel = document.getElementById('trafficGraphsPanel');
    if (!panel) return;

    const isVisible = panel.style.right === '20px';
    panel.style.right = isVisible ? '-600px' : '20px';
  }

  // Create toggle button
  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'graphsToggle';
    btn.className = 'btn btn-blue';
    btn.textContent = '📊 Analytics';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      padding: 12px 20px;
      border: 2px solid #3b82f6;
      border-radius: 8px;
     background: white;
      color: #1a202e;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s;
    `;
    btn.onmouseover = () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    };
    btn.onclick = toggleGraphPanel;

    document.body.appendChild(btn);
  }

  // Initialize packets chart
  function initPacketsChart() {
    const ctx = document.getElementById('packetsChart').getContext('2d');
    
    packetsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Packets/sec',
          data: [],
          borderColor: '#10b981',
         backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              maxTicksLimit: 8,
              color: '#4a5568'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#4a5568'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#4a5568'
            }
          }
        }
      }
    });
  }

  // Initialize attacks chart
  function initAttacksChart() {
    const ctx = document.getElementById('attacksChart').getContext('2d');
    
    attacksChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['FLOOD', 'ML-ANOMALY', 'MANUAL'],
        datasets: [{
          data: [0, 0, 0],
         backgroundColor: [
            '#ef4444',
            '#f59e0b',
            '#3b82f6'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#4a5568',
              padding: 15
            }
          }
        }
      }
    });
  }

  // Update charts with new data
  async function updateCharts() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();

      // Update packets chart
      if (packetsChart) {
        const now = new Date().toLocaleTimeString();
        
        // Calculate total PPS
        const totalPPS = Object.values(data.ip_stats || {})
          .reduce((sum, stats) => sum + (stats.pps || 0), 0);

        if (packetsChart.data.labels.length > 20) {
          packetsChart.data.labels.shift();
          packetsChart.data.datasets[0].data.shift();
        }

        packetsChart.data.labels.push(now);
        packetsChart.data.datasets[0].data.push(totalPPS);
        packetsChart.update('none');
      }

      // Update attacks chart
      if (attacksChart && data.attack_types) {
        const floodCount = data.attack_types['FLOOD'] || 
                          data.attack_types['URG/SYN FLOOD'] || 
                          data.attack_types['ICMP FLOOD'] || 
                          data.attack_types['UDP FLOOD'] || 0;
        const mlCount = data.attack_types['ML-ANOMALY'] || 0;
        const manualCount = data.attack_types['MANUAL'] || 0;

        attacksChart.data.datasets[0].data = [floodCount, mlCount, manualCount];
        attacksChart.update();
      }

    } catch (error) {
      console.error('[Graphs] Error updating charts:', error);
    }
  }

  // Start auto-update
  function startAutoUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    updateInterval = setInterval(updateCharts, 2000);
    console.log('[Graphs] Auto-update started');
  }

  // Initialize everything
  async function init() {
    try {
      await loadChartJS();
      createChartContainer();
      createToggleButton();
      
      // Wait for container to be in DOM
      setTimeout(() => {
        initPacketsChart();
        initAttacksChart();
        startAutoUpdate();
      }, 100);

      console.log('[Graphs] Initialized successfully');
    } catch (error) {
      console.error('[Graphs] Initialization error:', error);
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.TrafficGraphs = {
    togglePanel: toggleGraphPanel,
    updateCharts,
    showPanel: () => {
      document.getElementById('trafficGraphsPanel').style.right = '20px';
    },
    hidePanel: () => {
      document.getElementById('trafficGraphsPanel').style.right = '-600px';
    }
  };

})();
