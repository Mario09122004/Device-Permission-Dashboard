/**
 * Device Permission Dashboard - Client Application (app.js)
 * -------------------------------------------------------------
 * Educational client-side experiment for understanding browser permission lifecycles.
 * Policy: "Local educational experiment — no data is uploaded or recorded."
 * Zero retention, immediate track termination, coordinate blind.
 */

(() => {
  'use strict';

  // --- DOM Elements ---
  const btnCheckCamera = document.getElementById('btn-check-camera');
  const cameraStatusPill = document.getElementById('camera-status-pill');
  const cameraStatusText = document.getElementById('camera-status-text');
  const cameraResultMessage = document.getElementById('camera-result-message');
  const cameraResultDetails = document.getElementById('camera-result-details');
  const cameraTimestamp = document.getElementById('camera-timestamp');

  const btnRequestLocation = document.getElementById('btn-request-location');
  const locationStatusPill = document.getElementById('location-status-pill');
  const locationStatusText = document.getElementById('location-status-text');
  const locationOutcomeBadge = document.getElementById('location-outcome-badge');
  const locationResultMessage = document.getElementById('location-result-message');
  const locationResultDetails = document.getElementById('location-result-details');
  const locationTimestamp = document.getElementById('location-timestamp');

  const btnViewPrivacy = document.getElementById('btn-view-privacy');
  const btnResetInstructions = document.getElementById('btn-reset-instructions');
  const modalPrivacy = document.getElementById('modal-privacy');
  const modalReset = document.getElementById('modal-reset');
  const btnClosePrivacy = document.getElementById('btn-close-privacy');
  const btnAckPrivacy = document.getElementById('btn-ack-privacy');
  const btnCloseReset = document.getElementById('btn-close-reset');
  const btnAckReset = document.getElementById('btn-ack-reset');

  const auditLog = document.getElementById('audit-log');
  const btnClearLog = document.getElementById('btn-clear-log');

  // Diagnostic Simulation Buttons
  const btnSimNoCamera = document.getElementById('btn-sim-no-camera');
  const btnSimNoLocation = document.getElementById('btn-sim-no-location');
  const btnSimTimeout = document.getElementById('btn-sim-timeout');
  const btnSimUnsupported = document.getElementById('btn-sim-unsupported');
  const btnSimReset = document.getElementById('btn-sim-reset');

  // --- Helper: Format Time ---
  function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // --- Helper: Append Audit Log ---
  function logAudit(message, category = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${category}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${getTimestamp()}]`;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg';
    msgSpan.textContent = message;

    entry.appendChild(timeSpan);
    entry.appendChild(msgSpan);
    auditLog.appendChild(entry);
    auditLog.scrollTop = auditLog.scrollHeight;
  }

  // --- Camera Permission Logic ---
  // Requirement:
  // - Show native prompt only after user clicks.
  // - If allowed, stop all media tracks immediately; DO NOT take a picture or store video.
  // - Meaningful error / refusal messages; stays fully usable if denied.
  async function handleCheckCamera() {
    const timestampStr = getTimestamp();
    cameraTimestamp.textContent = timestampStr;

    logAudit('User initiated camera permission check. Requesting getUserMedia...', 'system');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraUIState('unavailable', 'API Unavailable', 
        'The MediaDevices API is not supported in this browser or security context.',
        'Technical note: navigator.mediaDevices.getUserMedia is undefined.'
      );
      logAudit('Camera check failed: MediaDevices API unavailable.', 'unavailable');
      return;
    }

    btnCheckCamera.disabled = true;
    cameraStatusText.textContent = 'Prompting...';

    try {
      // Trigger native browser prompt ONLY on this click
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      // Immediate stop: DO NOT capture, draw to canvas, or store video
      const tracks = stream.getTracks();
      const trackCount = tracks.length;
      tracks.forEach(track => {
        track.stop();
      });

      logAudit(`Camera permission GRANTED. Immediately terminated ${trackCount} active media track(s). Zero frames captured.`, 'granted');

      setCameraUIState('granted', 'Granted',
        'Camera permission was granted by the browser. All media tracks were immediately terminated in adherence to our zero-retention policy.',
        `Security verification: ${trackCount} video track(s) opened and closed instantly. No snapshot taken, no video recorded.`
      );
    } catch (err) {
      handleCameraError(err);
    } finally {
      btnCheckCamera.disabled = false;
    }
  }

  function handleCameraError(err) {
    let outcome = 'denied';
    let label = 'Denied';
    let userMsg = '';
    let techDetail = `Error name: ${err.name} | ${err.message || 'No additional message'}`;

    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        outcome = 'denied';
        label = 'Denied';
        userMsg = 'Camera access was denied or dismissed. You blocked access in the prompt or browser site settings.';
        logAudit('Camera permission DENIED: User or browser policy refused access (NotAllowedError).', 'denied');
        break;

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        outcome = 'unavailable';
        label = 'Unavailable';
        userMsg = 'No camera hardware found. Your device does not appear to have an operational video capture device.';
        logAudit('Camera check result: UNAVAILABLE (No camera hardware found).', 'unavailable');
        break;

      case 'NotReadableError':
      case 'TrackStartError':
        outcome = 'unavailable';
        label = 'Hardware In Use';
        userMsg = 'Camera hardware is busy. Another application or browser tab may already be locking the camera.';
        logAudit('Camera check result: UNAVAILABLE (Hardware locked by another process).', 'unavailable');
        break;

      case 'OverconstrainedError':
        outcome = 'unavailable';
        label = 'Overconstrained';
        userMsg = 'Requested camera resolution or constraints could not be satisfied by attached devices.';
        logAudit('Camera check result: UNAVAILABLE (Overconstrained).', 'unavailable');
        break;

      case 'SecurityError':
        outcome = 'denied';
        label = 'Security Error';
        userMsg = 'Camera access was restricted due to browser security policy or insecure origin.';
        logAudit('Camera check result: BLOCKED by security policy.', 'denied');
        break;

      default:
        outcome = 'denied';
        label = 'Refused / Error';
        userMsg = `Permission could not be obtained: ${err.message || err.name}`;
        logAudit(`Camera check error: ${err.name} - ${err.message}`, 'denied');
        break;
    }

    setCameraUIState(outcome, label, userMsg, techDetail);
  }

  function setCameraUIState(status, badgeText, message, details) {
    cameraStatusPill.className = `status-pill status-${status}`;
    cameraStatusText.textContent = badgeText;
    cameraResultMessage.textContent = message;

    if (details) {
      cameraResultDetails.textContent = details;
      cameraResultDetails.hidden = false;
    } else {
      cameraResultDetails.hidden = true;
    }
  }

  // --- Location Permission Logic ---
  // Requirement:
  // - Show only the result "Granted", "Denied" or "Unavailable".
  // - Do NOT display, log, save or transmit coordinates.
  // - Show native prompt after click.
  function handleRequestLocation() {
    const timestampStr = getTimestamp();
    locationTimestamp.textContent = timestampStr;

    logAudit('User initiated location permission request via navigator.geolocation...', 'system');

    if (!('geolocation' in navigator) || !navigator.geolocation) {
      setLocationOutcome('Unavailable', 'Geolocation API is not supported in this browser environment.', 'navigator.geolocation is undefined.');
      logAudit('Location request outcome: UNAVAILABLE (API missing).', 'unavailable');
      return;
    }

    btnRequestLocation.disabled = true;
    locationStatusText.textContent = 'Prompting...';
    locationOutcomeBadge.textContent = 'Prompting...';
    locationOutcomeBadge.className = 'location-outcome-badge';

    const geoOptions = {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // STRICT PRIVACY GUARANTEE:
        // Coordinates object is never read, logged, saved, or transmitted.
        btnRequestLocation.disabled = false;

        setLocationOutcome(
          'Granted',
          'Location permission was granted by the browser.',
          'Zero-Coordinate Policy: Numerical latitude, longitude, and accuracy were discarded immediately without reading or storing them.'
        );

        logAudit('Location permission outcome: GRANTED. (Zero-coordinate policy: coordinates were strictly not read, saved, or transmitted).', 'granted');
      },
      (geoError) => {
        btnRequestLocation.disabled = false;

        let outcome = 'Unavailable';
        let detail = '';

        if (geoError.code === geoError.PERMISSION_DENIED) {
          outcome = 'Denied';
          detail = 'Permission denied: User clicked "Block" / "Don\'t allow" or site policy forbids geolocation.';
          logAudit('Location permission outcome: DENIED (PERMISSION_DENIED).', 'denied');
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          outcome = 'Unavailable';
          detail = 'Position unavailable: Location sensors or network lookup could not resolve a fix.';
          logAudit('Location permission outcome: UNAVAILABLE (POSITION_UNAVAILABLE).', 'unavailable');
        } else if (geoError.code === geoError.TIMEOUT) {
          outcome = 'Unavailable';
          detail = 'Request timed out waiting for device location provider.';
          logAudit('Location permission outcome: UNAVAILABLE (TIMEOUT).', 'unavailable');
        } else {
          outcome = 'Unavailable';
          detail = `Location error code ${geoError.code}: ${geoError.message || 'Unknown failure'}`;
          logAudit(`Location permission outcome: UNAVAILABLE (${geoError.message}).`, 'unavailable');
        }

        setLocationOutcome(outcome, `Result: ${outcome}.`, detail);
      },
      geoOptions
    );
  }

  function setLocationOutcome(outcome, explanatoryMsg, details) {
    const validOutcomes = ['Granted', 'Denied', 'Unavailable'];
    const safeOutcome = validOutcomes.includes(outcome) ? outcome : 'Unavailable';

    locationOutcomeBadge.textContent = safeOutcome;
    locationOutcomeBadge.className = `location-outcome-badge outcome-${safeOutcome.toLowerCase()}`;

    locationStatusPill.className = `status-pill status-${safeOutcome.toLowerCase()}`;
    locationStatusText.textContent = safeOutcome;

    locationResultMessage.textContent = explanatoryMsg;

    if (details) {
      locationResultDetails.textContent = details;
      locationResultDetails.hidden = false;
    } else {
      locationResultDetails.hidden = true;
    }
  }

  // --- Modal Logic ---
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    const focusable = modalEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  btnViewPrivacy.addEventListener('click', () => {
    logAudit('Opened privacy guidance modal.', 'system');
    openModal(modalPrivacy);
  });

  btnClosePrivacy.addEventListener('click', () => closeModal(modalPrivacy));
  btnAckPrivacy.addEventListener('click', () => closeModal(modalPrivacy));

  btnResetInstructions.addEventListener('click', () => {
    logAudit('Opened browser permission reset instructions modal.', 'system');
    openModal(modalReset);
  });

  btnCloseReset.addEventListener('click', () => closeModal(modalReset));
  btnAckReset.addEventListener('click', () => closeModal(modalReset));

  [modalPrivacy, modalReset].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(modalPrivacy);
      closeModal(modalReset);
    }
  });

  // Browser Tabs inside Reset Modal
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const activePanel = document.getElementById(targetId);
      if (activePanel) {
        activePanel.classList.add('active');
        activePanel.removeAttribute('hidden');
      }
    });
  });

  // Clear Audit Log
  btnClearLog.addEventListener('click', () => {
    auditLog.innerHTML = '';
    logAudit('Educational experiment audit log cleared.', 'system');
  });

  // Primary action buttons
  btnCheckCamera.addEventListener('click', handleCheckCamera);
  btnRequestLocation.addEventListener('click', handleRequestLocation);

  // Diagnostic Simulation Handlers
  if (btnSimNoCamera) {
    btnSimNoCamera.addEventListener('click', () => {
      cameraTimestamp.textContent = getTimestamp();
      logAudit('[Diagnostic Simulation] Simulating missing camera hardware (NotFoundError)...', 'system');
      handleCameraError({
        name: 'NotFoundError',
        message: 'No video input devices found on this system.'
      });
    });
  }

  if (btnSimNoLocation) {
    btnSimNoLocation.addEventListener('click', () => {
      locationTimestamp.textContent = getTimestamp();
      logAudit('[Diagnostic Simulation] Simulating unavailable location provider (POSITION_UNAVAILABLE)...', 'system');
      setLocationOutcome(
        'Unavailable',
        'Result: Unavailable.',
        'Position unavailable: Location sensors or network lookup could not resolve a fix (Error Code 2: POSITION_UNAVAILABLE).'
      );
      logAudit('Location permission outcome: UNAVAILABLE (Simulated POSITION_UNAVAILABLE).', 'unavailable');
    });
  }

  if (btnSimTimeout) {
    btnSimTimeout.addEventListener('click', () => {
      locationTimestamp.textContent = getTimestamp();
      logAudit('[Diagnostic Simulation] Simulating location request timeout (TIMEOUT)...', 'system');
      setLocationOutcome(
        'Unavailable',
        'Result: Unavailable.',
        'Location request timed out waiting for device location provider (Error Code 3: TIMEOUT).'
      );
      logAudit('Location permission outcome: UNAVAILABLE (Simulated TIMEOUT).', 'unavailable');
    });
  }

  if (btnSimUnsupported) {
    btnSimUnsupported.addEventListener('click', () => {
      const nowStr = getTimestamp();
      cameraTimestamp.textContent = nowStr;
      locationTimestamp.textContent = nowStr;

      logAudit('[Diagnostic Simulation] Simulating unsupported browser APIs...', 'system');
      setCameraUIState(
        'unavailable',
        'API Unavailable',
        'The MediaDevices API is not supported in this browser or security context.',
        'Technical note: navigator.mediaDevices.getUserMedia is undefined.'
      );
      setLocationOutcome(
        'Unavailable',
        'Result: Unavailable.',
        'Geolocation API is not supported in this browser environment.'
      );
      logAudit('System check: Both Camera and Location APIs marked UNAVAILABLE.', 'unavailable');
    });
  }

  if (btnSimReset) {
    btnSimReset.addEventListener('click', () => {
      cameraTimestamp.textContent = '—';
      locationTimestamp.textContent = '—';

      setCameraUIState(
        'idle',
        'Not Requested',
        'Click the button above to test the browser camera permission prompt.',
        null
      );

      locationOutcomeBadge.textContent = 'Awaiting Check';
      locationOutcomeBadge.className = 'location-outcome-badge';
      locationStatusPill.className = 'status-pill status-idle';
      locationStatusText.textContent = 'Not Requested';
      locationResultMessage.textContent = 'Click the button above to trigger the native location prompt.';
      locationResultDetails.hidden = true;

      logAudit('Diagnostic reset: Cards restored to initial unrequested state.', 'system');
    });
  }

  // Pre-existing permission query check
  async function checkInitialPermissionStatus() {
    if ('permissions' in navigator && navigator.permissions.query) {
      try {
        const camStatus = await navigator.permissions.query({ name: 'camera' });
        if (camStatus.state === 'granted') {
          setCameraUIState('granted', 'Granted (Pre-set)', 
            'Camera permission is already granted in site settings. Click "Check camera permission" to run live test.', 
            'Query state: granted');
        } else if (camStatus.state === 'denied') {
          setCameraUIState('denied', 'Blocked (Pre-set)', 
            'Camera is blocked in browser site settings. Click button or reset permissions in site settings.', 
            'Query state: denied');
        }

        camStatus.onchange = () => {
          logAudit(`Browser camera permission state changed externally to: ${camStatus.state}`, 'system');
        };
      } catch (e) {
        // Ignored if query for camera unsupported
      }

      try {
        const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (geoStatus.state === 'granted') {
          setLocationOutcome('Granted', 'Location permission is already granted in site settings.', 'Query state: granted');
        } else if (geoStatus.state === 'denied') {
          setLocationOutcome('Denied', 'Location is currently blocked in browser site settings.', 'Query state: denied');
        }

        geoStatus.onchange = () => {
          logAudit(`Browser geolocation permission state changed externally to: ${geoStatus.state}`, 'system');
        };
      } catch (e) {
        // Ignored if query fails
      }
    }
  }

  checkInitialPermissionStatus();
  logAudit('Application initialized successfully on http://127.0.0.1:8000', 'security');
})();
