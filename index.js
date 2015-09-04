(function () {
  //var MANIFEST_URL = 'app://ce999d25-aa2d-ab4f-b00a-4f0deebc64f8/manifest.webapp';
  var MANIFEST_URL = 'https://elin-moco.github.io/fxos-addon-sound-switch/manifest.webapp';

  // If injecting into an app that was already running at the time
  // the app was enabled, simply initialize it.
  if (document.documentElement) {
    initialize();
  }

  // Otherwise, we need to wait for the DOM to be ready before
  // starting initialization since add-ons are usually (always?)
  // injected *before* `document.documentElement` is defined.
  else {
    window.addEventListener('DOMContentLoaded', initialize);
  }

  function initialize() {

    // Just a small shortcut to repeat myself less
    var $$ = document.getElementById.bind(document);

    // Remove existing control, for when this addon is re-run.
    var existingContainerEl = $$('quick-sound');
    if (existingContainerEl) {
      existingContainerEl.parentNode.removeChild(existingContainerEl);
    }

    // Build the brightness control elements.
    var containerEl = document.createElement('li');
    containerEl.setAttribute('id', 'quick-sound');
    containerEl.setAttribute('data-time-inserted', Date.now());

    // Markup stolen and munged from gaia settings
    containerEl.innerHTML = '<a aria-label="SoundSwitch" href="#" id="quick-sound-switch" class="icon bb-button" data-icon="sound-max" data-enabled="true" role="button" data-l10n-id="soundButton" style="color: #008EAB;"></a>';

    // Inject the elements into the system app
    var quickSettings = $$('quick-settings').children[0];
    quickSettings.appendChild(containerEl);

    // Borrow some code from Gaia shared/js/settings_listener.js
    var _lock;
    function sl_getSettingsLock() {
      if (_lock && !_lock.closed) { return _lock; }
      var settings = window.navigator.mozSettings;
      return (_lock = settings.createLock());
    }

    var switchEl = $$('quick-sound-switch');
    function sync_sound_state(sound_state) {
      if (sound_state) {
        switchEl.setAttribute('data-icon', 'sound-max');
        switchEl.setAttribute('data-enabled', 'true');
        switchEl.setAttribute('style', 'color: #008EAB;');
      }
      else {
        switchEl.setAttribute('data-icon', 'sound-min');
        switchEl.setAttribute('data-enabled', 'false');
        switchEl.setAttribute('style', '');
      }
    }

    var oldContentVol = 10;
    var oldNotificationVol = 15;

    sl_getSettingsLock();
    var setting = _lock.get('audio.volume.content');
    setting.onsuccess = function() {
      var setting2 = _lock.get('audio.volume.notification');
      setting2.onsuccess = function() {
        var contentVol = setting.result['audio.volume.content'];
        var notificationVol = setting2.result['audio.volume.notification'];
        if (0 == contentVol && 0 == notificationVol) {
          sync_sound_state(false);
        }
        else {
          oldContentVol = contentVol;
          oldNotificationVol = notificationVol;
          sync_sound_state(true);
        }
      };
    };

    switchEl.addEventListener('click', function () {
      sl_getSettingsLock();
      setting = _lock.get('audio.volume.content');
      setting.onsuccess = function() {
        var setting2 = _lock.get('audio.volume.notification');
        setting2.onsuccess = function() {
          var contentVol = setting.result['audio.volume.content'];
          var notificationVol = setting2.result['audio.volume.notification'];
          if (0 == contentVol && 0 == notificationVol) {
            _lock.set({
              'audio.volume.content': oldContentVol,
              'audio.volume.notification': oldNotificationVol
            });
            sync_sound_state(true);
          }
          else {
            oldContentVol = contentVol;
            oldNotificationVol = notificationVol;
            _lock.set({
              'audio.volume.content': 0,
              'audio.volume.notification': 0
            });
            sync_sound_state(false);
          }
        };
      };
    });
  }

  function uninitialize() {
    var $$ = document.getElementById.bind(document);
    var existingContainerEl = $$('quick-sound');
    existingContainerEl.parentNode.removeChild(existingContainerEl);
  }

  navigator.mozApps.mgmt.onenabledstatechange = function(event) {
    var app = event.application;
    if (app.manifestURL === MANIFEST_URL && !app.enabled) {
      uninitialize();
    }
  };
}());

