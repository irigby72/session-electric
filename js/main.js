document.addEventListener('DOMContentLoaded', () => {
  // Always build UI first — never let MIDI block rendering
  PatternButtons.init();
  Sliders.init();
  Transport.init();

  // Upper keyboard: C4 (60) to C6 (84) = 25 keys
  new Keyboard('upper-keyboard', 60, 25);
  // Lower keyboard: C2 (36) to C4 (60) = 25 keys
  new Keyboard('lower-keyboard', 36, 25);

  // Connect MIDI asynchronously
  connectMIDI();
});

// Temporary debug log visible on iPad (no console access)
function debugLog(msg) {
  let el = document.getElementById('debug-log');
  if (!el) {
    el = document.createElement('div');
    el.id = 'debug-log';
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#0f0;font:12px monospace;padding:8px;max-height:30vh;overflow-y:auto;z-index:9999;';
    document.body.appendChild(el);
  }
  el.textContent += msg + '\n';
  el.scrollTop = el.scrollHeight;
}

async function connectMIDI() {
  const status = document.getElementById('connection-status');

  debugLog('requestMIDIAccess exists: ' + !!navigator.requestMIDIAccess);
  debugLog('typeof: ' + typeof navigator.requestMIDIAccess);

  // Web MIDI Browser may inject MIDI API slightly after page load — retry if needed
  let attempts = 0;
  while (!navigator.requestMIDIAccess && attempts < 10) {
    attempts++;
    status.textContent = 'Waiting for MIDI... (' + attempts + ')';
    debugLog('Waiting attempt ' + attempts + '...');
    await new Promise(r => setTimeout(r, 500));
  }

  if (!navigator.requestMIDIAccess) {
    debugLog('MIDI API never appeared after ' + attempts + ' attempts');
    status.textContent = 'MIDI not available';
    return;
  }

  debugLog('Trying requestMIDIAccess({sysex:true})...');
  try {
    const access = await navigator.requestMIDIAccess({ sysex: true });
    debugLog('sysex:true SUCCESS');
    debugLog('outputs.size: ' + access.outputs.size);
    for (const [id, out] of access.outputs) {
      debugLog('  output: id=' + id + ' name=' + out.name + ' state=' + out.state);
    }
    MIDI.access = access;
    MIDI.sysexEnabled = true;
    access.onstatechange = () => MIDI.populateOutputs();
    MIDI.populateOutputs();
    return;
  } catch (err) {
    debugLog('sysex:true FAILED: ' + err.message);
  }

  debugLog('Trying requestMIDIAccess({sysex:false})...');
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    debugLog('sysex:false SUCCESS');
    debugLog('outputs.size: ' + access.outputs.size);
    for (const [id, out] of access.outputs) {
      debugLog('  output: id=' + id + ' name=' + out.name + ' state=' + out.state);
    }
    MIDI.access = access;
    MIDI.sysexEnabled = false;
    access.onstatechange = () => MIDI.populateOutputs();
    MIDI.populateOutputs();
    return;
  } catch (err2) {
    debugLog('sysex:false FAILED: ' + err2.message);
  }

  debugLog('All MIDI attempts failed');
  status.textContent = 'MIDI not available';
}
