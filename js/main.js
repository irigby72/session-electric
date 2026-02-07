document.addEventListener('DOMContentLoaded', function() {
  // Always build UI first — never let MIDI block rendering
  PatternButtons.init();
  Sliders.init();
  Transport.init();

  // Upper keyboard: C5 (72) to C7 (96) = 25 keys
  new Keyboard('upper-keyboard', 72, 25);
  // Lower keyboard: C3 (48) to C5 (72) = 25 keys
  new Keyboard('lower-keyboard', 48, 25);

  // Connect MIDI asynchronously
  connectMIDI();
});

async function connectMIDI() {
  var status = document.getElementById('connection-status');

  // Web MIDI Browser may inject MIDI API slightly after page load
  var attempts = 0;
  while (!navigator.requestMIDIAccess && attempts < 10) {
    attempts++;
    status.textContent = 'Waiting for MIDI... (' + attempts + ')';
    await new Promise(function(r) { setTimeout(r, 500); });
  }

  if (!navigator.requestMIDIAccess) {
    status.textContent = 'MIDI not available';
    return;
  }

  var ok = await MIDI.init();
  if (!ok) {
    status.textContent = 'MIDI not available';
  }
}
