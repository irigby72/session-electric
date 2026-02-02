document.addEventListener('DOMContentLoaded', async () => {
  const ok = await MIDI.init();
  if (!ok) {
    document.getElementById('connection-status').textContent = 'MIDI not available';
  }

  PatternButtons.init();
  Sliders.init();
  Transport.init();

  // Upper keyboard: C4 (60) to C6 (84) = 25 keys
  new Keyboard('upper-keyboard', 60, 25);
  // Lower keyboard: C2 (36) to C4 (60) = 25 keys
  new Keyboard('lower-keyboard', 36, 25);
});
