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
  const mockWindow = {
    addEventListener: () => {},
    document: {
      addEventListener: () => {},
      createElement: () => ({
        style: {},
        addEventListener: () => {},
      }),
      getElementById: (id) => {
        // Return dummy elements with necessary APIs
        return {
          addEventListener: () => {},
          classList: { add: () => {}, remove: () => {} },
          style: {},
          setAttribute: () => {},
          appendChild: () => {},
          querySelectorAll: () => []
        };
      }
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      clear: () => {}
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
  } catch (err) {
    console.error('❌ Sanity check failed!');
    console.error(err);
    process.exit(1);
  }
}

runSanityCheck();
