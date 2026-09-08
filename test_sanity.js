const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runSanityCheck() {
  const htmlPath = path.join(__dirname, 'index.html');
  console.log(`Loading ${htmlPath}...`);

  if (!fs.existsSync(htmlPath)) {
    throw new Error('index.html does not exist!');
  }

  const content = fs.readFileSync(htmlPath, 'utf8');

  // Extract script block using a robust regex
  const scriptRegex = /<script>([\s\S]*?)<\/script>/;
  const match = content.match(scriptRegex);

  if (!match) {
    throw new Error('No <script> block found in index.html!');
  }

  const jsCode = match[1];
  console.log('Found script block. Length:', jsCode.length, 'characters.');

  // Create mock DOM environment
  const storage = {};
  const elementCache = {};
  const mockWindow = {
    addEventListener: () => {},
    document: {
      addEventListener: () => {},
      createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        addEventListener: () => {},
      }),
      querySelectorAll: () => [],
      querySelector: (selector) => {
        const el = mockWindow.document.getElementById(selector);
        el.getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 200 });
        return el;
      },
      body: {
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {}
        }
      },
      getElementById: (id) => {
        if (!elementCache[id]) {
          elementCache[id] = {
            addEventListener: () => {},
            classList: { add: () => {}, remove: () => {} },
            style: {},
            setAttribute: () => {},
            appendChild: () => {},
            querySelectorAll: () => [],
            cloneNode: function() { return Object.assign({}, this); },
            close: () => {},
            showModal: () => {}
          };
          elementCache[id].parentNode = {
            replaceChild: (newChild, oldChild) => {}
          };
        }
        return elementCache[id];
      }
    },
    localStorage: {
      getItem: (key) => storage[key] || null,
      setItem: (key, val) => { storage[key] = String(val); },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    },
    navigator: {
      wakeLock: {
        request: async () => ({ addEventListener: () => {} })
      },
      serviceWorker: {
        register: async () => ({}),
        ready: Promise.resolve({
          showNotification: async (title, opts) => {
            mockWindow.lastServiceWorkerNotification = { title, opts };
          },
          getNotifications: async () => []
        })
      },
      vibrate: () => true
    },
    Notification: Object.assign(function(title, opts) {
      mockWindow.lastWebNotification = { title, opts };
      return { close: () => {} };
    }, {
      permission: "granted",
      requestPermission: async () => "granted"
    }),
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: (cb, ms) => {
      if (typeof cb === 'function' && (!ms || ms <= 1000)) cb();
      return Math.floor(Math.random() * 10000) + 1;
    },
    clearTimeout: () => {},
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); return 1; },
    cancelAnimationFrame: () => {},
    console: {
      log: console.log,
      error: console.error,
      warn: console.warn
    },
    Date: Date,
    Math: Math,
    String: String,
    Array: Array,
    Object: Object,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat,
    confirm: () => true,
    alert: () => {},
    Audio: function(src) {
      return {
        src,
        currentTime: 0,
        play: async () => {}
      };
    }
  };

  mockWindow.window = mockWindow;

  console.log('Compiling and running script inside VM sandbox...');
  const context = vm.createContext(mockWindow);

  try {
    const script = new vm.Script(jsCode, { filename: 'index.html#script' });
    script.runInContext(context);
    console.log('✅ Sanity check passed! JavaScript compiles and runs without immediate syntax or initialization errors.');

    // Test that Change Exercise logic doesn't pick the same index twice consecutively
    console.log('Running test for initHiitSequence (Change Exercise uniqueness)...');
    const initHiitSequence = context.initHiitSequence;
    if (typeof initHiitSequence !== 'function') {
      throw new Error('initHiitSequence is not a function in context!');
    }

    const getActiveHiitIndex = () => vm.runInContext('activeHiitIndex', context);
    const getHiitWorkoutsLength = () => vm.runInContext('hiitWorkouts.length', context);

    // Initial call
    initHiitSequence();
    let prevIndex = getActiveHiitIndex();
    const len = getHiitWorkoutsLength();
    if (prevIndex < 0 || prevIndex >= len) {
      throw new Error(`Initial activeHiitIndex is invalid: ${prevIndex}`);
    }

    // Call 100 times, checking that consecutive indexes are never identical
    for (let i = 0; i < 100; i++) {
      initHiitSequence();
      const newIndex = getActiveHiitIndex();
      if (newIndex === prevIndex) {
        throw new Error(`Duplicate consecutive index detected: ${newIndex} at iteration ${i}`);
      }
      prevIndex = newIndex;
    }
    console.log('✅ Success: Workout rotation test passed.');

    // Test timer state persistence
    console.log('Running test for timer state persistence...');
    const saveTimerState = context.saveTimerState;
    const restoreTimerState = context.restoreTimerState;
    if (typeof saveTimerState !== 'function' || typeof restoreTimerState !== 'function') {
      throw new Error('saveTimerState or restoreTimerState is not a function in context!');
    }

    // Modify timer variables in context
    vm.runInContext('timeLeft = 1234; currentMode = "focus"; timerStatus = "paused";', context);
    saveTimerState();

    // Verify localStorage has the key
    const savedStateStr = storage['focus_station_timer_state'];
    if (!savedStateStr) {
      throw new Error('Timer state was not saved to localStorage!');
    }
    const savedState = JSON.parse(savedStateStr);
    if (savedState.timeLeft !== 1234 || savedState.currentMode !== 'focus' || savedState.timerStatus !== 'paused') {
      throw new Error('Saved timer state values are incorrect!');
    }

    // Reset variables in context and restore
    vm.runInContext('timeLeft = 0; currentMode = "break"; timerStatus = "idle";', context);
    const restored = restoreTimerState();
    if (!restored) {
      throw new Error('restoreTimerState returned false!');
    }
    const restoredTimeLeft = vm.runInContext('timeLeft', context);
    const restoredMode = vm.runInContext('currentMode', context);
    const restoredStatus = vm.runInContext('timerStatus', context);
    if (restoredTimeLeft !== 1234 || restoredMode !== 'focus' || restoredStatus !== 'paused') {
      throw new Error(`Restored values are incorrect: timeLeft=${restoredTimeLeft}, mode=${restoredMode}, status=${restoredStatus}`);
    }
    console.log('✅ Success: Timer state persistence test passed.');

    // Test timer edit submit logic
    console.log('Running test for timer edit submit...');
    const handleEditTimerSubmit = context.handleEditTimerSubmit;
    if (typeof handleEditTimerSubmit !== 'function') {
      throw new Error('handleEditTimerSubmit is not a function in context!');
    }

    // Set configuration
    vm.runInContext('focusMinutes = 45; currentMode = "focus"; timeLeft = 2700;', context);

    // Mock form inputs values
    const minInput = mockWindow.document.getElementById('editTimerMinutes');
    const secInput = mockWindow.document.getElementById('editTimerSeconds');
    minInput.value = 25;
    secInput.value = 30;

    // Call submit handler (with mock event preventDefault)
    handleEditTimerSubmit({ preventDefault: () => {} });

    // Verify timeLeft in context was updated correctly (25m 30s = 1530s)
    const newTimeLeft = vm.runInContext('timeLeft', context);
    if (newTimeLeft !== 1530) {
      throw new Error(`Expected timeLeft to be 1530, got ${newTimeLeft}`);
    }
    console.log('✅ Success: Timer edit submit test passed.');

    // Test sound effects toggle and persistence
    console.log('Running test for sound toggle and persistence...');
    const toggleSound = context.toggleSound;
    if (typeof toggleSound !== 'function') {
      throw new Error('toggleSound is not a function in context!');
    }
    toggleSound(false);
    let soundState = vm.runInContext('soundEnabled', context);
    if (soundState !== false || storage['soundEnabled'] !== 'false') {
      throw new Error('Sound state failed to disable or persist!');
    }
    toggleSound(true);
    soundState = vm.runInContext('soundEnabled', context);
    if (soundState !== true || storage['soundEnabled'] !== 'true') {
      throw new Error('Sound state failed to enable or persist!');
    }
    console.log('✅ Success: Sound toggle test passed.');

    // Test Pomodoro cycle count and Long Break transition
    console.log('Running test for Pomodoro cycle progression...');
    vm.runInContext('currentCycleCount = 3; cyclesBeforeLongBreak = 4; isLongBreak = false; currentMode = "focus"; totalFocusSecondsElapsedThisSession = 1500;', context);
    const handlePhaseComplete = context.handlePhaseComplete;
    if (typeof handlePhaseComplete !== 'function') {
      throw new Error('handlePhaseComplete is not a function in context!');
    }
    handlePhaseComplete();
    const isLongBreakVal = vm.runInContext('isLongBreak', context);
    const cycleCountVal = vm.runInContext('currentCycleCount', context);
    const currentModeVal = vm.runInContext('currentMode', context);
    if (!isLongBreakVal || cycleCountVal !== 0 || currentModeVal !== 'break') {
      throw new Error(`Pomodoro Long Break transition failed: isLongBreak=${isLongBreakVal}, cycleCount=${cycleCountVal}, mode=${currentModeVal}`);
    }
    console.log('✅ Success: Pomodoro Long Break cycle test passed.');

    // Test Breathing Audio cues and box breathing transitions
    console.log('Running test for Box Breathing audio cues and phase transitions...');
    const playedSounds = [];
    vm.runInContext(`
      const origPlaySound = playSound;
      playSound = function(type) {
        playedSoundsArray.push(type);
        return origPlaySound(type);
      };
    `, Object.assign(context, { playedSoundsArray: playedSounds }));

    const playBreathingCue = context.playBreathingCue;
    if (typeof playBreathingCue !== 'function') {
      throw new Error('playBreathingCue is not a function in context!');
    }

    // Direct cue mapping tests
    playedSounds.length = 0;
    playBreathingCue(0);
    if (playedSounds[playedSounds.length - 1] !== 'breathe-inhale') {
      throw new Error(`Expected breathe-inhale for phase 0, got ${playedSounds[playedSounds.length - 1]}`);
    }

    playBreathingCue(1);
    if (playedSounds[playedSounds.length - 1] !== 'breathe-hold') {
      throw new Error(`Expected breathe-hold for phase 1, got ${playedSounds[playedSounds.length - 1]}`);
    }

    playBreathingCue(2);
    if (playedSounds[playedSounds.length - 1] !== 'breathe-exhale') {
      throw new Error(`Expected breathe-exhale for phase 2, got ${playedSounds[playedSounds.length - 1]}`);
    }

    playBreathingCue(3);
    if (playedSounds[playedSounds.length - 1] !== 'breathe-hold-empty') {
      throw new Error(`Expected breathe-hold-empty for phase 3, got ${playedSounds[playedSounds.length - 1]}`);
    }

    // Test startBoxBreathing triggers initial inhale audio cue
    playedSounds.length = 0;
    const startBoxBreathing = context.startBoxBreathing;
    startBoxBreathing();
    if (playedSounds[0] !== 'breathe-inhale') {
      throw new Error(`Expected breathe-inhale on startBoxBreathing, got ${playedSounds[0]}`);
    }

    // Simulate 4 seconds countdown in tickBoxBreathing to advance phase to 1 (Hold)
    playedSounds.length = 0;
    const tickBoxBreathing = context.tickBoxBreathing;
    for (let s = 0; s < 4; s++) {
      tickBoxBreathing();
    }
    const phaseIndexAfter4s = vm.runInContext('boxBreathingPhaseIndex', context);
    if (phaseIndexAfter4s !== 1) {
      throw new Error(`Expected phase 1 after 4s, got ${phaseIndexAfter4s}`);
    }
    if (playedSounds[playedSounds.length - 1] !== 'breathe-hold') {
      throw new Error(`Expected breathe-hold sound after phase transition to 1, got ${playedSounds[playedSounds.length - 1]}`);
    }

    // Test completion sound
    playedSounds.length = 0;
    const endBoxBreathing = context.endBoxBreathing;
    endBoxBreathing(true);
    if (!playedSounds.includes('complete')) {
      throw new Error('Expected complete sound on endBoxBreathing(true)');
    }
    console.log('✅ Success: Box Breathing audio cues and phase transitions test passed.');

    // Test Random Mindfulness Bell (Chuong chanh niem)
    console.log('Running test for Random Mindfulness Bell...');
    const scheduleMindfulnessBell = context.scheduleMindfulnessBell;
    const triggerMindfulnessBell = context.triggerMindfulnessBell;
    if (typeof scheduleMindfulnessBell !== 'function' || typeof triggerMindfulnessBell !== 'function') {
      throw new Error('scheduleMindfulnessBell or triggerMindfulnessBell is not defined!');
    }

    // 1. Web open scheduling (runs regardless of mode or timer status)
    vm.runInContext('enableMindfulnessBell = true; currentMode = "focus"; timerStatus = "idle"; isDebugMode = false;', context);
    scheduleMindfulnessBell();
    let nextTime = vm.runInContext('mindfulnessBellNextTime', context);
    let timeoutId = vm.runInContext('mindfulnessBellTimeout', context);
    if (!timeoutId || !nextTime || nextTime < Date.now() + 14 * 60 * 1000 || nextTime > Date.now() + 46 * 60 * 1000) {
      throw new Error(`Invalid web open mindfulness bell schedule: nextTime=${nextTime}`);
    }

    // 2. Break mode (still schedules, independent of timer mode)
    vm.runInContext('currentMode = "break"; isLongBreak = false;', context);
    scheduleMindfulnessBell();
    nextTime = vm.runInContext('mindfulnessBellNextTime', context);
    if (!nextTime) {
      throw new Error('Mindfulness bell should schedule during break mode as well');
    }

    // 3. Debug mode scheduling (15s - 45s)
    vm.runInContext('isDebugMode = true;', context);
    scheduleMindfulnessBell();
    nextTime = vm.runInContext('mindfulnessBellNextTime', context);
    if (!nextTime || nextTime < Date.now() + 14 * 1000 || nextTime > Date.now() + 46 * 1000) {
      throw new Error(`Invalid debug mode mindfulness bell target: nextTime=${nextTime}`);
    }

    // 4. Disabled setting (should cancel and NOT schedule)
    vm.runInContext('enableMindfulnessBell = false;', context);
    scheduleMindfulnessBell();
    nextTime = vm.runInContext('mindfulnessBellNextTime', context);
    timeoutId = vm.runInContext('mindfulnessBellTimeout', context);
    if (nextTime !== null || timeoutId !== null) {
      throw new Error('Mindfulness bell should not schedule when enableMindfulnessBell = false');
    }

    // 5. Custom interval scheduling (e.g. 5m to 10m)
    vm.runInContext('enableMindfulnessBell = true; isDebugMode = false; mindfulnessMinMinutes = 5; mindfulnessMaxMinutes = 10;', context);
    scheduleMindfulnessBell();
    nextTime = vm.runInContext('mindfulnessBellNextTime', context);
    if (!nextTime || nextTime < Date.now() + 4.9 * 60 * 1000 || nextTime > Date.now() + 10.1 * 60 * 1000) {
      throw new Error(`Invalid custom interval mindfulness bell schedule: nextTime=${nextTime}`);
    }

    // 6. Monte Carlo distribution test (1000 samples within exact [5m, 10m] bounds)
    for (let i = 0; i < 1000; i++) {
      scheduleMindfulnessBell();
      const t = vm.runInContext('mindfulnessBellNextTime', context);
      const delay = t - Date.now();
      if (delay < 5 * 60 * 1000 || delay > 10 * 60 * 1000) {
        throw new Error(`Out of bounds mindfulness bell delay: ${delay}ms at sample ${i}`);
      }
    }

    // 7. Visibility / sleep wake catch-up test
    let catchUpTriggered = false;
    context.triggerMindfulnessBell = () => { catchUpTriggered = true; };
    vm.runInContext('mindfulnessBellNextTime = Date.now() - 1000;', context);
    mockWindow.document.visibilityState = 'visible';
    const handleVisibilityChange = context.handleVisibilityChange;
    if (typeof handleVisibilityChange === 'function') {
      handleVisibilityChange();
      if (!catchUpTriggered) throw new Error('handleVisibilityChange failed to catch up elapsed mindfulness bell');
    }
    context.triggerMindfulnessBell = triggerMindfulnessBell; // restore
    console.log('✅ Success: Random Mindfulness Bell tests passed.');

    console.log('Running test for background mindfulness bell notifications, prominent modal & manual dismissal...');
    const flashTabTitle = context.flashTabTitle;
    if (typeof flashTabTitle !== 'function') {
      throw new Error('flashTabTitle function is not defined!');
    }

    flashTabTitle('🔔 Test Alert');
    const alertInterval = vm.runInContext('alertTitleInterval', context);
    if (!alertInterval) {
      throw new Error('flashTabTitle did not initiate alertTitleInterval');
    }

    // Verify translations do not contain "30s" or "30 giây"
    const translations = vm.runInContext('translations', context);
    for (const [lang, dict] of Object.entries(translations)) {
      if (dict.mindfulnessBellToastTitle && (dict.mindfulnessBellToastTitle.includes('30s') || dict.mindfulnessBellToastTitle.includes('30 giây'))) {
        throw new Error(`Translations for ${lang} contain "30s" in mindfulnessBellToastTitle`);
      }
      if (dict.mindfulnessBellToastDesc && (dict.mindfulnessBellToastDesc.includes('30s') || dict.mindfulnessBellToastDesc.includes('30 giây'))) {
        throw new Error(`Translations for ${lang} contain "30s" in mindfulnessBellToastDesc`);
      }
      if (dict.mindfulnessBellTabAlert && (dict.mindfulnessBellTabAlert.includes('30s') || dict.mindfulnessBellTabAlert.includes('30 giây'))) {
        throw new Error(`Translations for ${lang} contain "30s" in mindfulnessBellTabAlert`);
      }
    }

    // Call triggerMindfulnessBell with notifications enabled
    vm.runInContext('enableNotifications = true;', context);
    triggerMindfulnessBell(false);

    // Verify modal was displayed and requires manual dismissal
    const modalEl = mockWindow.document.getElementById('mindfulnessModal');
    if (modalEl && modalEl.hidden !== false) {
      throw new Error('mindfulnessModal was not made visible after triggerMindfulnessBell');
    }

    const dismissMindfulnessModal = context.dismissMindfulnessModal;
    if (typeof dismissMindfulnessModal !== 'function') {
      throw new Error('dismissMindfulnessModal function is not defined');
    }
    dismissMindfulnessModal();
    console.log('✅ Success: Background mindfulness bell notifications, prominent modal & manual dismissal passed.');

    // Verify Mobile Responsive & Non-Squishing CSS Rules
    console.log('Running test for mobile responsive & icon non-squish CSS rules...');
    const requiredRules = [
      /\.btn-icon\s*\{[^}]*flex-shrink:\s*0/i,
      /\.btn-icon\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/i,
      /\.indicator-icon\s*\{[^}]*flex-shrink:\s*0/i,
      /\.sound-toggle-btn\s*\{[^}]*flex-shrink:\s*0/i,
      /\.brand-logo\s*\{[^}]*flex-shrink:\s*0/i,
      /\.cycle-badge\s*\{[^}]*flex-shrink:\s*0/i,
      /\.wakelock-badge\s*\{[^}]*flex-shrink:\s*0/i,
      /@media\s*\(max-width:\s*440px\)/i,
      /@media\s*\(min-width:\s*768px\)/i,
      /@media\s*\(min-width:\s*1024px\)/i,
      /:focus-visible/i,
      /@media\s*\(max-height:\s*680px\)\s*and\s*\(orientation:\s*portrait\)/i,
      /#btnStatsShortcut\s*\{[^}]*display:\s*none/i,
      /#btnStartPause\s*\{[^}]*flex-shrink:\s*0/i
    ];
    for (const rule of requiredRules) {
      if (!rule.test(content)) {
        throw new Error(`Mobile responsiveness check failed: missing CSS pattern ${rule}`);
      }
    }
    console.log('✅ Success: Mobile responsive & icon non-squish CSS rules verified.');

    // Verify removal of top orange border
    if (/\.break-mode-active\s+header\s*\{[^}]*border-bottom-color:\s*rgba\(217/i.test(content)) {
      throw new Error('Break mode header still contains orange border-bottom-color!');
    }
    if (/\.alert-toast\s*\{[^}]*border:\s*1px\s+solid\s+var\(--status-warning\)/i.test(content)) {
      throw new Error('Alert toast still has orange status-warning border!');
    }
    console.log('✅ Success: Top orange border removal verified.');

    // Verify minimalist UI elements: quick-check-panel hidden, phase-label hidden, btnResetTimer is icon button
    if (!/\.quick-check-panel\s*\{[^}]*display:\s*none/i.test(content)) {
      throw new Error('quick-check-panel is not hidden via display: none!');
    }
    if (!/\.phase-label\s*\{[^}]*display:\s*none/i.test(content)) {
      throw new Error('phase-label is not hidden via display: none!');
    }
    if (!/<button[^>]*class="[^"]*btn-icon[^"]*"[^>]*id="btnResetTimer"[^>]*>/i.test(content) && !/<button[^>]*id="btnResetTimer"[^>]*class="[^"]*btn-icon[^"]*"[^>]*>/i.test(content)) {
      throw new Error('btnResetTimer does not have btn-icon class!');
    }
    if (!/\.brand-logo\s*\{[^}]*display:\s*none/i.test(content)) {
      throw new Error('brand-logo is not hidden via display: none!');
    }
    console.log('✅ Success: Minimalist layout assertions verified (hidden posture/hydration, hidden phase label, icon reset button, hidden brand icon).');

    // Verify refined aesthetics for Header and Pomodoro Timer
    if (!/header\s*\{[^}]*justify-content:\s*center/i.test(content)) {
      throw new Error('Header is not centered via justify-content: center!');
    }
    if (!/\.progress-bar-circle\s*\{[^}]*stroke-width:\s*7/i.test(content)) {
      throw new Error('Pomodoro timer progress bar does not have refined stroke-width of 7!');
    }
    if (!/<button[^>]*class="[^"]*btn-edit-timer[^"]*"[^>]*id="btnEditTimer"/i.test(content) && !/<button[^>]*id="btnEditTimer"[^>]*class="[^"]*btn-edit-timer[^"]*"/i.test(content)) {
      throw new Error('btnEditTimer does not have btn-edit-timer class!');
    }
    if (!/\.growth-wrapper\s*\{[^}]*display:\s*none/i.test(content)) {
      throw new Error('growth-wrapper icon is not hidden via display: none!');
    }
    console.log('✅ Success: Refined Header and Pomodoro timer aesthetic assertions verified.');

    // Verify UI/UX upgrades:
    // 1. AMOLED auto-dimming & shortcut-hint hidden in AMOLED, scrollbar suppression
    if (!/body\.amoled-mode\.amoled-idle/i.test(content)) {
      throw new Error('Missing body.amoled-mode.amoled-idle CSS rule!');
    }
    if (!/body\.amoled-mode\s+[^}]*#shortcutHintDisplay/i.test(content)) {
      throw new Error('shortcutHintDisplay is not hidden in amoled-mode!');
    }
    if (!/body\.amoled-mode\s*\{[^}]*overflow:\s*hidden/i.test(content) || !/scrollbar-width:\s*none/i.test(content)) {
      throw new Error('Missing overflow: hidden or scrollbar-width: none in amoled-mode!');
    }

    // 2. Quick preset chips in editTimerDialog
    if (!content.includes('class="dialog-chips-row"') || !content.includes('data-preset="25"')) {
      throw new Error('Quick timer preset chips are missing in editTimerDialog!');
    }

    // 3. Hold-to-reset CSS
    if (!content.includes('#btnResetTimer.holding-reset')) {
      throw new Error('Missing #btnResetTimer.holding-reset CSS rule!');
    }

    // 4. Box breathing continuous easing
    if (!/\.breathing-circle-inner\s*\{[^}]*cubic-bezier/i.test(content)) {
      throw new Error('Missing cubic-bezier transition on .breathing-circle-inner!');
    }

    // 5. Stats local date parsing & semantic focus color
    if (!content.includes('var(--color-focus, #3987e5)')) {
      throw new Error('Stats bar chart does not use isolated var(--color-focus, #3987e5)!');
    }
    if (!content.includes('new Date(y, m - 1, d)')) {
      throw new Error('Stats chart does not parse local date components (y, m - 1, d)!');
    }
    console.log('✅ Success: Comprehensive UI/UX upgrade assertions verified.');

    // 6. Test Pomodoro Settings & Progress Modal
    console.log('Running test for Pomodoro Settings & Progress Dialog...');
    if (!content.includes('id="pomodoroDialog"') || !content.includes('id="cycleBadge"')) {
      throw new Error('pomodoroDialog or cycleBadge is missing in index.html!');
    }
    if (!content.includes('id="btnResetCycle"') || !content.includes('id="btnResetTimerFromPomodoro"')) {
      throw new Error('btnResetCycle or btnResetTimerFromPomodoro is missing in index.html!');
    }
    if (!content.includes('pomodoro-chips-row') || !content.includes('cycle-chip')) {
      throw new Error('pomodoro-chips-row or cycle-chip styling is missing in index.html!');
    }
    if (!content.includes('pomodoro-card') || !content.includes('pomodoro-status-pill') || !content.includes('pomodoro-preset-chip') || !content.includes('id="btnTopClosePomodoro"')) {
      throw new Error('Pomodoro modal UI/UX ergonomic card elements (pomodoro-card, status-pill, preset-chip, btnTopClosePomodoro) are missing in index.html!');
    }

    const openPomodoroDialog = context.openPomodoroDialog;
    const handlePomodoroSubmit = context.handlePomodoroSubmit;
    const renderPomodoroCycleChips = context.renderPomodoroCycleChips;

    if (typeof openPomodoroDialog !== 'function' || typeof handlePomodoroSubmit !== 'function' || typeof renderPomodoroCycleChips !== 'function') {
      throw new Error('Pomodoro modal functions (openPomodoroDialog, handlePomodoroSubmit, renderPomodoroCycleChips) are not defined in context!');
    }

    // Test opening and populating
    vm.runInContext('focusMinutes = 50; breakMinutes = 10; longBreakMinutes = 20; cyclesBeforeLongBreak = 5; currentCycleCount = 2; isLongBreak = false;', context);
    openPomodoroDialog();

    const pFocusIn = mockWindow.document.getElementById('pomodoroFocusInput');
    const pBreakIn = mockWindow.document.getElementById('pomodoroBreakInput');
    const pLongIn = mockWindow.document.getElementById('pomodoroLongBreakInput');
    const pCyclesIn = mockWindow.document.getElementById('pomodoroCyclesInput');

    if (pFocusIn.value !== 50 || pBreakIn.value !== 10 || pLongIn.value !== 20 || pCyclesIn.value !== 5) {
      throw new Error(`openPomodoroDialog failed to populate form fields: ${pFocusIn.value}, ${pBreakIn.value}, ${pLongIn.value}, ${pCyclesIn.value}`);
    }
    const tempCycle = vm.runInContext('tempCycleCount', context);
    const tempLB = vm.runInContext('tempIsLongBreak', context);
    if (tempCycle !== 2 || tempLB !== false) {
      throw new Error(`openPomodoroDialog failed to initialize temp state: tempCycleCount=${tempCycle}, tempIsLongBreak=${tempLB}`);
    }

    // Test modifying settings and progress via submit
    pFocusIn.value = 35;
    pBreakIn.value = 7;
    pLongIn.value = 25;
    pCyclesIn.value = 4;
    vm.runInContext('tempCycleCount = 3; tempIsLongBreak = false;', context);

    handlePomodoroSubmit({ preventDefault: () => {} });

    if (vm.runInContext('focusMinutes', context) !== 35 ||
        vm.runInContext('breakMinutes', context) !== 7 ||
        vm.runInContext('longBreakMinutes', context) !== 25 ||
        vm.runInContext('cyclesBeforeLongBreak', context) !== 4 ||
        vm.runInContext('currentCycleCount', context) !== 3 ||
        vm.runInContext('isLongBreak', context) !== false) {
      throw new Error('handlePomodoroSubmit failed to update context variables correctly!');
    }

    if (storage['focusMinutes'] !== '35' ||
        storage['breakMinutes'] !== '7' ||
        storage['longBreakMinutes'] !== '25' ||
        storage['cyclesBeforeLongBreak'] !== '4') {
      throw new Error('handlePomodoroSubmit failed to persist values to localStorage!');
    }

    // Test Long Break selection and Reset Cycle
    vm.runInContext('tempIsLongBreak = true; tempCycleCount = 1;', context);
    handlePomodoroSubmit({ preventDefault: () => {} });
    if (!vm.runInContext('isLongBreak', context)) {
      throw new Error('Setting Long Break in Pomodoro dialog failed!');
    }

    // Reset cycle
    vm.runInContext('tempCycleCount = 0; tempIsLongBreak = false;', context);
    handlePomodoroSubmit({ preventDefault: () => {} });
    if (vm.runInContext('currentCycleCount', context) !== 0 || vm.runInContext('isLongBreak', context) !== false) {
      throw new Error('Reset Cycle failed to restore cycle to 0!');
    }

    console.log('✅ Success: Pomodoro Settings & Progress Modal tests passed.');

    // Test Hide Timer Digits Feature (Option ẩn bộ đếm thời gian)
    console.log('Running test for Hide Timer Digits option & UI...');
    if (!content.includes('id="checkboxHideTimerDigits"') || !content.includes('id="pomodoroHideTimerDigits"')) {
      throw new Error('checkboxHideTimerDigits or pomodoroHideTimerDigits switch is missing in index.html!');
    }
    if (!content.includes('.progress-container.hide-timer-digits')) {
      throw new Error('CSS rule .progress-container.hide-timer-digits is missing in index.html!');
    }
    const updateHideTimerDigitsUI = context.updateHideTimerDigitsUI;
    if (typeof updateHideTimerDigitsUI !== 'function') {
      throw new Error('updateHideTimerDigitsUI is not defined in context!');
    }

    // Verify translations exist
    const tr = vm.runInContext('translations', context);
    if (!tr.en.hideTimerDigits || !tr.vi.hideTimerDigits) {
      throw new Error('Translations missing for hideTimerDigits in en or vi!');
    }

    // Test enabling hideTimerDigits
    const progressEl = mockWindow.document.getElementById('progressContainer');
    let addedClasses = [];
    let removedClasses = [];
    progressEl.classList = {
      add: (...cls) => addedClasses.push(...cls),
      remove: (...cls) => removedClasses.push(...cls),
      contains: (cls) => addedClasses.includes(cls)
    };

    vm.runInContext('hideTimerDigits = true;', context);
    updateHideTimerDigitsUI();
    if (!addedClasses.includes('hide-timer-digits')) {
      throw new Error('updateHideTimerDigitsUI did not add hide-timer-digits class to progressContainer!');
    }

    // Test saving settings with hideTimerDigits
    const saveSettings = context.saveSettings;
    const chkHide = mockWindow.document.getElementById('checkboxHideTimerDigits');
    chkHide.checked = true;
    saveSettings(false);
    if (storage['hideTimerDigits'] !== 'true') {
      throw new Error('saveSettings failed to persist hideTimerDigits=true to localStorage!');
    }

    // Test disabling hideTimerDigits
    chkHide.checked = false;
    saveSettings(false);
    if (storage['hideTimerDigits'] !== 'false') {
      throw new Error('saveSettings failed to persist hideTimerDigits=false to localStorage!');
    }
    if (!removedClasses.includes('hide-timer-digits')) {
      throw new Error('updateHideTimerDigitsUI did not remove hide-timer-digits class when disabled!');
    }
    console.log('✅ Success: Hide Timer Digits option & UI tests passed.');
  } catch (err) {
    console.error('❌ Sanity check failed!');
    console.error(err);
    process.exit(1);
  }
}

runSanityCheck();
