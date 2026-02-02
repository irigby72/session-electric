const PatternButtons = {
  // Currently active pink button MIDI note (null if none)
  activePink: null,
  activePinkEl: null,

  buttons: [
    { name: 'C',  midi: 24, group: 'pink' },
    { name: 'C#', midi: 25, group: 'pink' },
    { name: 'D',  midi: 26, group: 'pink' },
    { name: 'D#', midi: 27, group: 'pink' },
    { name: 'E',  midi: 28, group: 'pink' },
    { name: 'F',  midi: 29, group: 'pink' },
    { name: 'F#', midi: 30, group: 'pink' },
    { name: 'G',  midi: 31, group: 'pink' },
    { name: 'G#', midi: 32, group: 'yellow' },
    { name: 'A',  midi: 33, group: 'yellow' },
    { name: 'Bb', midi: 34, group: 'yellow' },
    { name: 'B',  midi: 35, group: 'green' },
  ],

  init() {
    const container = document.getElementById('pattern-buttons');
    container.innerHTML = '';

    this.buttons.forEach((btn) => {
      const el = document.createElement('button');
      el.className = `pattern-btn pattern-${btn.group}`;
      el.textContent = btn.name;
      el.dataset.midi = btn.midi;
      el.dataset.group = btn.group;

      if (btn.group === 'pink') {
        // Toggle with exclusive behavior
        el.addEventListener('touchstart', (e) => { e.preventDefault(); this.togglePink(el, btn.midi); }, { passive: false });
        el.addEventListener('mousedown', (e) => { e.preventDefault(); this.togglePink(el, btn.midi); });
      } else {
        // Momentary
        el.addEventListener('touchstart', (e) => { e.preventDefault(); this.momentaryOn(el, btn.midi); }, { passive: false });
        el.addEventListener('touchend', (e) => { e.preventDefault(); this.momentaryOff(el, btn.midi); }, { passive: false });
        el.addEventListener('touchcancel', (e) => { e.preventDefault(); this.momentaryOff(el, btn.midi); }, { passive: false });
        el.addEventListener('mousedown', (e) => { e.preventDefault(); this.momentaryOn(el, btn.midi); });
        el.addEventListener('mouseup', (e) => { this.momentaryOff(el, btn.midi); });
        el.addEventListener('mouseleave', (e) => { this.momentaryOff(el, btn.midi); });
      }

      container.appendChild(el);
    });
  },

  togglePink(el, midi) {
    if (this.activePink === midi) {
      // Deactivate current
      MIDI.noteOff(midi);
      el.classList.remove('active');
      this.activePink = null;
      this.activePinkEl = null;
    } else {
      // Deactivate previous if any
      if (this.activePink !== null) {
        MIDI.noteOff(this.activePink);
        if (this.activePinkEl) this.activePinkEl.classList.remove('active');
      }
      // Activate new
      MIDI.noteOn(midi, 100);
      el.classList.add('active');
      this.activePink = midi;
      this.activePinkEl = el;
    }
  },

  momentaryOn(el, midi) {
    el.classList.add('active');
    MIDI.noteOn(midi, 100);
  },

  momentaryOff(el, midi) {
    el.classList.remove('active');
    MIDI.noteOff(midi);
  },
};

const Sliders = {
  lastSendTime: 0,

  init() {
    this.buildSlider('pitch-bend-container', 'PITCH', true);
    this.buildSlider('mod-wheel-container', 'MOD', false);
  },

  buildSlider(containerId, label, springBack) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const track = document.createElement('div');
    track.className = 'slider-track';

    const fill = document.createElement('div');
    fill.className = 'slider-fill';

    const thumb = document.createElement('div');
    thumb.className = 'slider-thumb';

    const lbl = document.createElement('div');
    lbl.className = 'slider-label';
    lbl.textContent = label;

    track.appendChild(fill);
    track.appendChild(thumb);
    container.appendChild(lbl);
    container.appendChild(track);

    // Initial position
    const initial = springBack ? 0.5 : 1.0; // 0=top, 1=bottom; pitch center, mod bottom
    this.setThumbPosition(thumb, fill, initial, springBack);

    // Send initial state
    if (!springBack) {
      // Mod wheel starts at 0 (bottom position = value 0)
      MIDI.cc(1, 0);
    }

    let activeTouch = null;

    const onMove = (clientY) => {
      const rect = track.getBoundingClientRect();
      let ratio = (clientY - rect.top) / rect.height;
      ratio = Math.max(0, Math.min(1, ratio));
      this.setThumbPosition(thumb, fill, ratio, springBack);
      this.sendValue(ratio, springBack);
    };

    // Touch events
    track.addEventListener('touchstart', (e) => {
      e.preventDefault();
      activeTouch = e.changedTouches[0].identifier;
      onMove(e.changedTouches[0].clientY);
    }, { passive: false });

    track.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) onMove(t.clientY);
      }
    }, { passive: false });

    const onTouchEnd = (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          activeTouch = null;
          if (springBack) {
            this.setThumbPosition(thumb, fill, 0.5, true);
            MIDI.pitchBend(8192);
          }
        }
      }
    };
    track.addEventListener('touchend', onTouchEnd, { passive: false });
    track.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // Mouse events for desktop testing
    let mouseDown = false;
    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      mouseDown = true;
      onMove(e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (mouseDown) onMove(e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (mouseDown) {
        mouseDown = false;
        if (springBack) {
          this.setThumbPosition(thumb, fill, 0.5, true);
          MIDI.pitchBend(8192);
        }
      }
    });
  },

  setThumbPosition(thumb, fill, ratio, isPitch) {
    // ratio: 0 = top, 1 = bottom
    const pct = ratio * 100;
    thumb.style.top = pct + '%';
    if (isPitch) {
      // Fill from center (50%) toward current position
      const center = 50;
      if (pct < center) {
        fill.style.top = pct + '%';
        fill.style.height = (center - pct) + '%';
      } else {
        fill.style.top = center + '%';
        fill.style.height = (pct - center) + '%';
      }
    } else {
      // Fill from bottom up to current position
      fill.style.top = pct + '%';
      fill.style.height = (100 - pct) + '%';
    }
  },

  sendValue(ratio, isPitch) {
    // Throttle to ~15ms
    const now = performance.now();
    if (now - this.lastSendTime < 15) return;
    this.lastSendTime = now;

    if (isPitch) {
      // ratio 0 (top) = 16383, ratio 1 (bottom) = 0
      const value = Math.round((1 - ratio) * 16383);
      MIDI.pitchBend(value);
    } else {
      // ratio 0 (top) = 127, ratio 1 (bottom) = 0
      const value = Math.round((1 - ratio) * 127);
      MIDI.cc(1, value);
    }
  },
};

const Transport = {
  buttons: [
    { name: '⏪', cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x05, 0xF7], label: 'Rewind' },
    { name: '⏩', cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x04, 0xF7], label: 'Forward' },
    { name: '⏹', cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x01, 0xF7], label: 'Stop' },
    { name: '▶',  cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x02, 0xF7], label: 'Play' },
    { name: '⏸', cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x09, 0xF7], label: 'Pause' },
    { name: '⏺', cmd: [0xF0, 0x7F, 0x7F, 0x06, 0x06, 0xF7], label: 'Record' },
    { name: '🔁', cmd: null, label: 'Loop', cc: 117 },
  ],

  loopState: false,

  init() {
    const container = document.getElementById('transport-controls');
    container.innerHTML = '';

    this.buttons.forEach((btn) => {
      const el = document.createElement('button');
      el.className = 'transport-btn' + (btn.label === 'Record' ? ' transport-record' : '');
      el.textContent = btn.name;
      el.title = btn.label;

      const fire = (e) => {
        e.preventDefault();
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 150);

        if (btn.cmd) {
          MIDI.sysex(btn.cmd);
        } else if (btn.cc !== undefined) {
          this.loopState = !this.loopState;
          MIDI.cc(btn.cc, this.loopState ? 127 : 0);
          el.classList.toggle('loop-active', this.loopState);
        }
      };

      el.addEventListener('touchstart', fire, { passive: false });
      el.addEventListener('mousedown', fire);
      container.appendChild(el);
    });
  },
};
