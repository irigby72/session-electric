class Keyboard {
  // noteNames maps semitone offset to {name, isBlack}
  static NOTES = [
    { name: 'C', black: false },
    { name: 'C#', black: true },
    { name: 'D', black: false },
    { name: 'D#', black: true },
    { name: 'E', black: false },
    { name: 'F', black: false },
    { name: 'F#', black: true },
    { name: 'G', black: false },
    { name: 'G#', black: true },
    { name: 'A', black: false },
    { name: 'Bb', black: true },
    { name: 'B', black: false },
  ];

  constructor(containerId, startMidi, numKeys) {
    this.container = document.getElementById(containerId);
    this.startMidi = startMidi; // e.g. 36 for C2
    this.numKeys = numKeys;
    this.activeTouches = new Map(); // touchId -> midiNote
    this.build();
    this.bindEvents();
  }

  build() {
    this.container.innerHTML = '';
    this.keys = [];
    this.whiteKeys = [];
    this.blackKeys = [];

    for (let i = 0; i < this.numKeys; i++) {
      const midi = this.startMidi + i;
      const noteInfo = Keyboard.NOTES[midi % 12];
      const key = document.createElement('div');
      key.className = noteInfo.black ? 'key black-key' : 'key white-key';
      key.dataset.midi = midi;

      if (noteInfo.black) {
        this.blackKeys.push({ el: key, midi, index: i });
      } else {
        this.whiteKeys.push({ el: key, midi, index: i });
      }
      this.keys.push(key);
    }

    // Position white keys evenly
    const whiteCount = this.whiteKeys.length;
    const pct = 100 / whiteCount;
    this.whiteKeys.forEach((wk, wi) => {
      wk.el.style.left = (wi * pct) + '%';
      wk.el.style.width = pct + '%';
      this.container.appendChild(wk.el);
    });

    // Position black keys between white keys
    this.blackKeys.forEach((bk) => {
      // Find which white key index this black key sits after
      const whitesBefore = this.keys.slice(0, bk.index).filter(
        (_, ki) => !Keyboard.NOTES[(this.startMidi + ki) % 12].black
      ).length;
      bk.el.style.left = (whitesBefore * pct - pct * 0.3) + '%';
      bk.el.style.width = (pct * 0.6) + '%';
      this.container.appendChild(bk.el);
    });
  }

  bindEvents() {
    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handleTouchStart(touch);
      }
    }, { passive: false });

    this.container.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handleTouchEnd(touch);
      }
    }, { passive: false });

    this.container.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        this.handleTouchEnd(touch);
      }
    }, { passive: false });

    // Mouse support for desktop testing
    this.container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const key = this.getKeyAt(e.clientX, e.clientY);
      if (!key) return;
      const midi = parseInt(key.dataset.midi);
      const velocity = this.calcVelocity(e.clientY, key);
      this.activeTouches.set('mouse', midi);
      key.classList.add('active');
      MIDI.noteOn(midi, velocity);

      const mouseUp = () => {
        const note = this.activeTouches.get('mouse');
        if (note !== undefined) {
          MIDI.noteOff(note);
          this.activeTouches.delete('mouse');
          this.keys.forEach(k => {
            if (parseInt(k.dataset.midi) === note) k.classList.remove('active');
          });
        }
        window.removeEventListener('mouseup', mouseUp);
      };
      window.addEventListener('mouseup', mouseUp);
    });
  }

  handleTouchStart(touch) {
    const key = this.getKeyAt(touch.clientX, touch.clientY);
    if (!key) return;
    const midi = parseInt(key.dataset.midi);
    const velocity = this.calcVelocity(touch.clientY, key);
    this.activeTouches.set(touch.identifier, midi);
    key.classList.add('active');
    MIDI.noteOn(midi, velocity);
  }

  handleTouchEnd(touch) {
    const midi = this.activeTouches.get(touch.identifier);
    if (midi !== undefined) {
      MIDI.noteOff(midi);
      this.activeTouches.delete(touch.identifier);
      this.keys.forEach(k => {
        if (parseInt(k.dataset.midi) === midi) k.classList.remove('active');
      });
    }
  }

  getKeyAt(x, y) {
    // Check black keys first (they're on top)
    for (const bk of this.blackKeys) {
      const rect = bk.el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return bk.el;
      }
    }
    for (const wk of this.whiteKeys) {
      const rect = wk.el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return wk.el;
      }
    }
    return null;
  }

  calcVelocity(clientY, keyEl) {
    const rect = keyEl.getBoundingClientRect();
    // top of key = low velocity (1), bottom = high velocity (127)
    const ratio = (clientY - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(1 + clamped * 126);
  }
}
