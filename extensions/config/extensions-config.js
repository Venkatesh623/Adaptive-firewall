/**
 * Extensions Configuration Manager
 * Central configuration and initialization for all extensions
 */

(function() {
  'use strict';

  // Extension configuration
  const CONFIG = {
    theme: {
      enabled: true,
      default: 'dark', // 'dark' or 'light'
      persist: true
    },
   exportLogs: {
      enabled: true,
      formats: ['csv', 'json']
    },
    notifications: {
      enabled: true,
      autoRequestPermission: true,
      notifyOnBlock: true,
      notifyOnUnblock: false
    },
    trafficGraphs: {
      enabled: true,
      updateInterval: 2000, // ms
      maxDataPoints: 20
    }
  };

  // Load extension scripts dynamically
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
     script.src = src;
     script.onload = resolve;
     script.onerror = () => {
        console.error(`[Config] Failed to load: ${src}`);
        reject(new Error(`Failed to load ${src}`));
      };
     document.head.appendChild(script);
    });
  }

  // Load CSS stylesheets
  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = () => {
        console.error(`[Config] Failed to load stylesheet: ${href}`);
        reject(new Error(`Failed to load ${href}`));
      };
     document.head.appendChild(link);
    });
  }

  // Initialize extensions based on config
  async function initializeExtensions() {
    console.log('[Config] Initializing extensions...');

    try {
      // Load theme first if enabled
      if (CONFIG.theme.enabled) {
        await loadStylesheet('extensions/themes/light-theme.css');
        await loadScript('extensions/themes/theme-switcher.js');
        console.log('[Config] ✅ Theme extension loaded');
      }

      // Load feature modules
      const loadPromises = [];

      if (CONFIG.exportLogs.enabled) {
        loadPromises.push(
          loadScript('extensions/features/export-logs.js')
            .then(() => console.log('[Config] ✅ Export logs loaded'))
        );
      }

      if (CONFIG.notifications.enabled) {
        loadPromises.push(
          loadScript('extensions/features/notifications.js')
            .then(() => console.log('[Config] ✅ Notifications loaded'))
        );
      }

      if (CONFIG.trafficGraphs.enabled) {
        loadPromises.push(
          loadScript('extensions/features/traffic-graphs.js')
            .then(() => console.log('[Config] ✅ Traffic graphs loaded'))
        );
      }

      await Promise.all(loadPromises);
      console.log('[Config] 🎉 All enabled extensions initialized');

    } catch (error) {
      console.error('[Config] Initialization error:', error);
    }
  }

  // Get extension status
  function getExtensionStatus() {
    return {
      theme: {
        enabled: CONFIG.theme.enabled,
        current: window.ThemeSwitcher?.getTheme() || CONFIG.theme.default
      },
     exportLogs: {
        enabled: CONFIG.exportLogs.enabled,
        available: !!window.ExportLogs
      },
      notifications: {
        enabled: CONFIG.notifications.enabled,
        active: window.Notifications?.isEnabled() || false
      },
      trafficGraphs: {
        enabled: CONFIG.trafficGraphs.enabled,
        active: !!window.TrafficGraphs
      }
    };
  }

  // Enable/disable specific extension
  function configureExtension(name, enabled) {
    if (CONFIG[name]) {
      CONFIG[name].enabled = enabled;
      console.log(`[Config] ${name} ${enabled ? 'enabled' : 'disabled'}`);
      
      // Save to localStorage
      localStorage.setItem(`ext_${name}_enabled`, enabled);
    } else {
      console.warn(`[Config] Unknown extension: ${name}`);
    }
  }

  // Load saved configurations
  function loadSavedConfig() {
    Object.keys(CONFIG).forEach(key => {
      const saved = localStorage.getItem(`ext_${key}_enabled`);
      if (saved !== null) {
        CONFIG[key].enabled = saved === 'true';
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', () => {
      loadSavedConfig();
      initializeExtensions();
    });
  } else {
    loadSavedConfig();
    initializeExtensions();
  }

  // Expose API
  window.ExtensionsConfig = {
    config: CONFIG,
    getStatus: getExtensionStatus,
    configure: configureExtension,
    reload: initializeExtensions
  };

})();
