document.addEventListener('DOMContentLoaded', function() {
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

// Temporary debug log visible on iPad
function debugLog(msg) {
  var el = document.getElementById('debug-log');
  if (!el) {
    el = document.createElement('div');
    el.id = 'debug-log';
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,0.85);color:#0f0;font:12px monospace;padding:8px;max-height:30vh;overflow-y:auto;z-index:9999;white-space:pre-wrap;';
    document.body.appendChild(el);
  }
  el.textContent += msg + '\n';
  el.scrollTop = el.scrollHeight;
}

async function connectMIDI() {
  var status = document.getElementById('connection-status');

  debugLog('requestMIDIAccess exists: ' + !!navigator.requestMIDIAccess);

  // Web MIDI Browser may inject MIDI API slightly after page load
  var attempts = 0;
  while (!navigator.requestMIDIAccess && attempts < 10) {
    attempts++;
    status.textContent = 'Waiting for MIDI... (' + attempts + ')';
    await new Promise(function(r) { setTimeout(r, 500); });
  }

  if (!navigator.requestMIDIAccess) {
    debugLog('MIDI API never appeared');
    status.textContent = 'MIDI not available';
    return;
  }

  var ok = await MIDI.init();
  debugLog('MIDI.init() returned: ' + ok);
  debugLog('sysexEnabled: ' + MIDI.sysexEnabled);
  debugLog('_outputs count: ' + MIDI._outputs.length);
  for (var i = 0; i < MIDI._outputs.length; i++) {
    debugLog('  output: id=' + MIDI._outputs[i].id + ' name=' + MIDI._outputs[i].output.name);
  }

  if (!ok) {
    status.textContent = 'MIDI not available';
  }
}
