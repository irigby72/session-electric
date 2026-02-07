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

async function connectMIDI() {
  const status = document.getElementById('connection-status');

  // Web MIDI Browser may inject MIDI API slightly after page load — retry if needed
  let attempts = 0;
  while (!navigator.requestMIDIAccess && attempts < 5) {
    attempts++;
    status.textContent = 'Waiting for MIDI...';
    await new Promise(r => setTimeout(r, 500));
  }

  const ok = await MIDI.init();
  if (!ok) {
    status.textContent = 'MIDI not available';
  }
}
