# CLAUDE.md - Project Instructions for Claude Code


## Overview
- This is a project to create a web application that will run on an iPad and be utilized as a MIDI controller for Native Instrument's Session Guitarist Electric Sunburst
- The iPad will be connected to a MacBook Pro via a USB cable and should send its MIDI to the Session Guitarist Electric Sunburst software, which will be running in Apple Logic. 
- The iPad application will have two 25 key keyboards as its primary MIDI input method.
- At the top of the application will be 12 buttons that will control a number of other MIDI outputs. 
- On the left side of the app there will two sliders that should produce output for MIDI such as would be done by a pitch bend wheel and a mod wheel. 
- At the top left of the app will be a few buttons that trigger common control functions in Logic .
- The design of the app should be based on a rough sketch that will be provided during our session.

## Tech Stack and File Structure
- I will let Claude Code guide me on this
- This app to run off of GitHub pages, so structure should match

## Browser and Outputs
- The application we create should run in the Web MIDI browser on the iPad 
- The app should output MIDI to control the Session Guitarist Electric Sunburst running in Logic on my MacBook 
- Secondary browser target would be Chrome on the Mac for testing

## Tech Stack (decided)
- Vanilla JS, no frameworks — single-page app
- Files: `index.html`, `css/styles.css`, `js/midi.js`, `js/keyboard.js`, `js/controls.js`, `js/main.js`

## Current Status — All 5 stages implemented, needs testing
- **Stage 1 (Scaffold + MIDI):** Done. Web MIDI API with sysex, output selector dropdown, connection status indicator.
- **Stage 2 (Keyboards):** Done. Two 25-key keyboards — upper C4-C6 (MIDI 60-84), lower C2-C4 (MIDI 36-60). Velocity-sensitive: bottom of key = 127, top = 1. Multi-touch support.
- **Stage 3 (12 Pattern Buttons):** Done. 4x3 grid, MIDI notes C1-B1 (24-35). Pink buttons (C-G, 24-31) are toggle/exclusive (only one active at a time, highlighted when on). Yellow (G#/A/Bb, 32-34) and green (B, 35) are momentary.
- **Stage 4 (Sliders):** Done. Pitch bend (top, springs back to center, 14-bit). Mod wheel (bottom, stays in place, CC#1).
- **Stage 5 (Transport):** Done. 7 buttons sending MMC SysEx — rewind, forward, stop, play, pause, record (red), loop (CC#117 toggle). Logic needs "Listen to MMC input" enabled in Project Settings > Synchronization.

## Design
- Sunburst gradient background (gold center → orange/red → dark brown edges) inspired by Electric Sunburst Deluxe
- Record button is red
- UI sketch reference: `/Users/ianrigby/Desktop/IMG_0754.jpeg`
- Color reference: `/Users/ianrigby/Desktop/Screenshot 2026-02-01 at 10.28.18 AM.png`

## Next Steps
- User testing of all stages on iPad (Web MIDI Browser) and Chrome on Mac
- Deploy to GitHub Pages
- Potential adjustments based on testing feedback (layout sizing, MIDI mappings, etc.)

## Development and Testing
- We will develop the app in stages and will do testing with each stage
- The stages will include: Basic interface, keyboard design and outputs, 12 buttons design and outputs, pitch bend and mod wheel design and outputs, Logic controls buttons design and outputs