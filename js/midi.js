const MIDI = {
  output: null,
  access: null,
  sysexEnabled: false,
  // Cache outputs as a plain array for cross-browser compatibility
  _outputs: [],

  async init() {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported');
      return false;
    }

    // Try with sysex first (Web MIDI Browser prefers this)
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: true });
      this.sysexEnabled = true;
    } catch (err) {
      console.warn('SysEx request failed, trying without:', err);
      try {
        this.access = await navigator.requestMIDIAccess({ sysex: false });
      } catch (err2) {
        console.error('MIDI access denied:', err2);
        return false;
      }
    }
    this.access.onstatechange = () => this.populateOutputs();
    this.populateOutputs();
    return true;
  },

  // Extract outputs into a plain array, handling non-standard MIDIOutputMap
  getOutputs() {
    var outputs = this.access.outputs;
    var result = [];

    // Standard Map: has forEach
    if (typeof outputs.forEach === 'function') {
      outputs.forEach(function(output, id) {
        result.push({ id: id, output: output });
      });
      return result;
    }

    // Plain object fallback
    var keys = Object.keys(outputs);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var val = outputs[key];
      // Skip non-MIDIOutput properties like 'size'
      if (val && typeof val === 'object' && val.name) {
        result.push({ id: key, output: val });
      }
    }
    return result;
  },

  populateOutputs() {
    var select = document.getElementById('midi-output-select');
    var currentValue = select.value;
    // Keep the placeholder option
    select.length = 1;

    this._outputs = this.getOutputs();

    for (var i = 0; i < this._outputs.length; i++) {
      var item = this._outputs[i];
      var opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.output.name;
      select.appendChild(opt);
    }

    // Restore selection or auto-select first
    var found = false;
    for (var j = 0; j < this._outputs.length; j++) {
      if (this._outputs[j].id === currentValue) { found = true; break; }
    }
    if (found) {
      select.value = currentValue;
    } else if (this._outputs.length === 1) {
      select.selectedIndex = 1;
    }
    this.selectOutput(select.value);

    select.onchange = () => this.selectOutput(select.value);
  },

  selectOutput(id) {
    var status = document.getElementById('connection-status');
    this.output = null;

    if (id) {
      for (var i = 0; i < this._outputs.length; i++) {
        if (this._outputs[i].id === id) {
          this.output = this._outputs[i].output;
          break;
        }
      }
    }

    if (this.output) {
      status.textContent = this.sysexEnabled ? 'Connected' : 'Connected (no SysEx)';
      status.className = 'connected';
    } else {
      status.textContent = 'Disconnected';
      status.className = '';
    }
  },

  send(data) {
    if (this.output) {
      this.output.send(data);
    }
  },

  noteOn(note, velocity, channel) {
    velocity = velocity || 100;
    channel = channel || 0;
    this.send([0x90 | channel, note, velocity]);
  },

  noteOff(note, channel) {
    channel = channel || 0;
    this.send([0x80 | channel, note, 0]);
  },

  cc(controller, value, channel) {
    channel = channel || 0;
    this.send([0xB0 | channel, controller, value]);
  },

  pitchBend(value, channel) {
    channel = channel || 0;
    // value: 0-16383, center = 8192
    var lsb = value & 0x7F;
    var msb = (value >> 7) & 0x7F;
    this.send([0xE0 | channel, lsb, msb]);
  },

  sysex(data) {
    if (!this.sysexEnabled) return;
    this.send(data);
  }
};
