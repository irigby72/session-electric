const MIDI = {
  output: null,
  access: null,
  sysexEnabled: false,

  async init() {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported');
      return false;
    }

    // Try with sysex first (Web MIDI Browser prefers this)
    try {
      this.access = await this.requestWithTimeout({ sysex: true }, 3000);
      this.sysexEnabled = true;
    } catch (err) {
      console.warn('SysEx request failed, trying without:', err);
      // Fallback to non-sysex
      try {
        this.access = await this.requestWithTimeout({ sysex: false }, 3000);
      } catch (err2) {
        console.error('MIDI access denied:', err2);
        return false;
      }
    }
    this.access.onstatechange = () => this.populateOutputs();
    this.populateOutputs();
    return true;
  },

  requestWithTimeout(options, ms) {
    return Promise.race([
      navigator.requestMIDIAccess(options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MIDI request timed out')), ms)
      )
    ]);
  },

  populateOutputs() {
    const select = document.getElementById('midi-output-select');
    const currentValue = select.value;
    // Keep the placeholder option
    select.length = 1;

    for (const output of this.access.outputs.values()) {
      const opt = document.createElement('option');
      opt.value = output.id;
      opt.textContent = output.name;
      select.appendChild(opt);
    }

    // Restore selection or auto-select first
    if (currentValue && [...this.access.outputs.keys()].includes(currentValue)) {
      select.value = currentValue;
    } else if (this.access.outputs.size === 1) {
      select.selectedIndex = 1;
    }
    this.selectOutput(select.value);

    select.onchange = () => this.selectOutput(select.value);
  },

  selectOutput(id) {
    const status = document.getElementById('connection-status');
    if (id && this.access.outputs.has(id)) {
      this.output = this.access.outputs.get(id);
      status.textContent = this.sysexEnabled ? 'Connected' : 'Connected (no SysEx)';
      status.className = 'connected';
    } else {
      this.output = null;
      status.textContent = 'Disconnected';
      status.className = '';
    }
  },

  send(data) {
    if (this.output) {
      this.output.send(data);
    }
  },

  noteOn(note, velocity = 100, channel = 0) {
    this.send([0x90 | channel, note, velocity]);
  },

  noteOff(note, channel = 0) {
    this.send([0x80 | channel, note, 0]);
  },

  cc(controller, value, channel = 0) {
    this.send([0xB0 | channel, controller, value]);
  },

  pitchBend(value, channel = 0) {
    // value: 0-16383, center = 8192
    const lsb = value & 0x7F;
    const msb = (value >> 7) & 0x7F;
    this.send([0xE0 | channel, lsb, msb]);
  },

  sysex(data) {
    if (!this.sysexEnabled) return;
    this.send(data);
  }
};
