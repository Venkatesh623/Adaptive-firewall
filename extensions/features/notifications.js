/**
 * Browser Notifications Feature Module
 * Sends desktop notifications for security alerts
 */

(function() {
  'use strict';

  let notificationPermission = 'default';
  let lastAlertId = null;

  // Request notification permission
  function requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      notificationPermission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        notificationPermission = permission;
        console.log(`[Notifications] Permission: ${permission}`);
      });
    }

    return false;
  }

  // Send browser notification
  function sendNotification(title, options) {
    if (notificationPermission !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return;
    }

    const defaultOptions = {
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔔</text></svg>',
      vibrate: [200, 100, 200],
      requireInteraction: true
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Format notification based on alert type
  function formatAlert(alert) {
    let title, body, priority;

    switch (alert.type) {
      case 'BLOCK':
        title = '🚫 Threat Blocked';
        body = `${alert.ip} - ${alert.attack_type}\n${alert.message}`;
        priority = 'high';
        break;
      case 'UNBLOCK':
        title = '✅ IP Unblocked';
        body = `${alert.ip} manually unblocked`;
        priority = 'normal';
        break;
      case 'SYSTEM':
        title = '⚙️ System Alert';
        body = alert.message;
        priority = 'normal';
        break;
      default:
        title = '🔔 Security Alert';
        body = `${alert.ip}: ${alert.message}`;
        priority = 'normal';
    }

    return { title, body, priority };
  }

  // Handle incoming alerts via WebSocket
  function handleNewAlert(alert) {
    // Prevent duplicate notifications
    if (alert.id === lastAlertId) {
      return;
    }
    lastAlertId = alert.id;

    // Only notify for BLOCK events by default
    if (alert.type !== 'BLOCK') {
      return;
    }

    const formatted = formatAlert(alert);
    sendNotification(formatted.title, {
      body: formatted.body,
      tag: `alert-${alert.id}`,
      renotify: true
    });
  }

  // Create notification settings toggle
  function createNotificationToggle() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    `;

    const button = document.createElement('button');
    button.id = 'notificationToggle';
    button.className = 'btn';
    button.style.cssText = `
      padding: 12px 18px;
      border: 2px solid #4a5568;
      border-radius: 8px;
      background: #ffffff;
      color: #1a202e;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transition: all 0.3s;
    `;
    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    };
    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    };

    updateButtonState(button);

    button.onclick = () => {
      requestPermission();
      setTimeout(() => updateButtonState(button), 500);
      
      // Send test notification
      if (notificationPermission === 'granted') {
        sendNotification('✅ Notifications Enabled', {
          body: 'You will now receive security alerts on your desktop'
        });
      }
    };

    container.appendChild(button);
    document.body.appendChild(container);
  }

  // Update button state based on permission
  function updateButtonState(button) {
    const icons = {
      granted: '🔔',
      denied: '🔕',
      default: '🔔'
    };

    const labels = {
      granted: 'Notifications On',
      denied: 'Notifications Blocked',
      default: 'Enable Notifications'
    };

    button.textContent = `${icons[notificationPermission]} ${labels[notificationPermission]}`;
    button.style.borderColor = notificationPermission === 'granted' ? '#10b981' : '#4a5568';
  }

  // Listen to socket alerts
  function setupSocketListener() {
    const checkSocket = setInterval(() => {
      if (window.socket && window.socket.on) {
        window.socket.on('new_alert', handleNewAlert);
        clearInterval(checkSocket);
        console.log('[Notifications] Socket listener registered');
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkSocket), 10000);
  }

  // Initialize
  function init() {
    requestPermission();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createNotificationToggle);
    } else {
      createNotificationToggle();
    }

    setupSocketListener();
  }

  init();

  // Expose API
  window.Notifications = {
    requestPermission,
    sendNotification,
    handleNewAlert,
    isEnabled: () => notificationPermission === 'granted'
  };

})();
