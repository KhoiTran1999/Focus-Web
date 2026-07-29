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
  const mockWindow = {
    addEventListener: () => {},
    document: {
      addEventListener: () => {},
      createElement: () => ({
        style: {},
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
        // Return dummy elements with necessary APIs
        const element = {
          addEventListener: () => {},
          classList: { add: () => {}, remove: () => {} },
          style: {},
          setAttribute: () => {},
          appendChild: () => {},
          querySelectorAll: () => [],
          cloneNode: function() { return Object.assign({}, this); }
        };
        element.parentNode = {
          replaceChild: (newChild, oldChild) => {}
        };
        return element;
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
      }
    },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
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
    alert: () => {}
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

    // Test progress circle interaction math
    console.log('Running test for progress circle interaction math...');
    const handleProgressInteraction = context.handleProgressInteraction;
    if (typeof handleProgressInteraction !== 'function') {
      throw new Error('handleProgressInteraction is not a function in context!');
    }

    // Set configuration
    vm.runInContext('focusMinutes = 45; currentMode = "focus";', context);

    // 1. Drag to 12 o'clock (0% done, 100% time left)
    handleProgressInteraction({ clientX: 200, clientY: 50 });
    let interactedTime = vm.runInContext('timeLeft', context);
    if (interactedTime !== 2700) {
      throw new Error(`Expected 2700s at 12 o'clock, got ${interactedTime}`);
    }

    // 2. Drag to 3 o'clock (25% done, 75% time left)
    handleProgressInteraction({ clientX: 350, clientY: 200 });
    interactedTime = vm.runInContext('timeLeft', context);
    if (interactedTime !== 2025) {
      throw new Error(`Expected 2025s at 3 o'clock, got ${interactedTime}`);
    }

    // 3. Drag to 6 o'clock (50% done, 50% time left)
    handleProgressInteraction({ clientX: 200, clientY: 350 });
    interactedTime = vm.runInContext('timeLeft', context);
    if (interactedTime !== 1350) {
      throw new Error(`Expected 1350s at 6 o'clock, got ${interactedTime}`);
    }

    // 4. Drag to 9 o'clock (75% done, 25% time left)
    handleProgressInteraction({ clientX: 50, clientY: 200 });
    interactedTime = vm.runInContext('timeLeft', context);
    if (interactedTime !== 675) {
      throw new Error(`Expected 675s at 9 o'clock, got ${interactedTime}`);
    }

    console.log('✅ Success: Progress circle interaction math test passed.');
  } catch (err) {
    console.error('❌ Sanity check failed!');
    console.error(err);
    process.exit(1);
  }
}

runSanityCheck();
