/*
  =============================================
  MINDSPACE — script.js
  =============================================
  HOW THIS FILE IS ORGANIZED:

  1. DATA & CONSTANTS         — emoji maps, tips array, encouragement messages
  2. UTILITY FUNCTIONS        — helper functions used everywhere
  3. LOCAL STORAGE MODULE     — save, load, clear mood entries
  4. MOOD CHECK-IN MODULE     — handle mood button clicks, log entries
  5. VISUALIZATION MODULE     — render timeline + log list from stored data
  6. STRESS TIPS MODULE       — random tip generator + render all tips
  7. UI HELPERS               — navbar, date display
  8. INITIALIZATION           — run everything on page load

  ======================================
  TEACHING NOTE: What is JavaScript's role here?
  ======================================
  HTML  = STRUCTURE  (the skeleton — headings, paragraphs, buttons)
  CSS   = STYLE      (the appearance — colors, fonts, layout)
  JS    = BEHAVIOUR  (the logic — what happens when buttons are clicked,
                      how data is saved, how content is generated dynamically)

  JavaScript "talks to" HTML by using the DOM (Document Object Model).
  The DOM is the browser's in-memory representation of your HTML.
  We use document.getElementById() and document.querySelector()
  to find elements and then change them.
  =============================================
*/


/* =============================================
   1. DATA & CONSTANTS
   We define all our data at the top so it's
   easy to edit without hunting through code.
============================================= */

/*
  TEACHING: const vs let vs var
  - const: value cannot be reassigned. Use for data you don't overwrite.
  - let:   value CAN be reassigned. Use for counters, flags, etc.
  - var:   old style, has scope issues — avoid in modern JS.
*/

// Emoji map: maps a mood string to its emoji character
const MOOD_EMOJIS = {
  happy:    '😊',
  neutral:  '😐',
  sad:      '😔',
  stressed: '😣',
  tired:    '😴'
};

// Stress tips array: each element is an object with an icon and text
const STRESS_TIPS = [
  { icon: '🌬️', text: 'Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s.' },
  { icon: '🚶', text: 'Take a 10-minute walk outside. Movement resets your mental state.' },
  { icon: '💧', text: 'Drink a full glass of water. Dehydration worsens anxiety and fatigue.' },
  { icon: '✍️', text: 'Write down exactly what you\'re feeling. Getting it out of your head helps.' },
  { icon: '📵', text: 'Step away from all screens for 5 minutes. Your brain needs blank space.' },
  { icon: '🍅', text: 'Use the Pomodoro technique: work 25 min, rest 5. Repeat 4 times.' },
  { icon: '🧘', text: 'Close your eyes and notice 5 things you can feel physically right now.' },
  { icon: '🎵', text: 'Put on one calming song and do nothing else while it plays.' },
  { icon: '🌿', text: 'Go outside and look at something green for 2 minutes. Really look at it.' },
  { icon: '🛏️', text: 'If you\'re tired, rest is productive. A 20-minute nap improves focus.' },
  { icon: '📞', text: 'Text someone you trust. You don\'t have to share everything — just connect.' },
  { icon: '🎨', text: 'Doodle or sketch something for 5 minutes. No skill required.' }
];

/*
  Encouragement messages: conditional on mood.
  TEACHING: Objects can store different values for different "keys".
  We use the mood string as the key to look up the right message.
*/
const ENCOURAGEMENT_MESSAGES = {
  sad: {
    message: "It's okay to feel sad. Be kind to yourself today. 💙",
    type: 'warning'
  },
  stressed: {
    message: "Stress is a signal, not a verdict. Try a short break or breathing exercise. 🌬️",
    type: 'warning'
  },
  tired: {
    message: "Rest is not laziness — it's recovery. Give yourself permission to pause. 🌙",
    type: 'warning'
  },
  happy: {
    message: "Glad you're feeling good today! Keep that energy going. 🌟",
    type: 'positive'
  },
  neutral: {
    message: "A calm, steady day is a good day. You're doing well. 👍",
    type: 'positive'
  }
};

// Local Storage key — a constant string so we never mistype it elsewhere
const STORAGE_KEY = 'mindspace_mood_entries';


/* =============================================
   2. UTILITY FUNCTIONS
   Small, reusable helper functions.
============================================= */

/*
  formatDate(dateString)
  Converts an ISO date string like "2025-06-05T14:23:00.000Z"
  into a readable format like "June 5 at 2:23 PM".
  
  TEACHING: JavaScript Date object
  new Date() gives you the current date/time.
  new Date(string) parses a date string.
  .toLocaleDateString() and .toLocaleTimeString() format it for display.
*/
function formatDate(dateString) {
  const date = new Date(dateString);
  const dateOptions = { month: 'long', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit' };
  // toLocaleDateString uses the user's locale automatically — nice!
  return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
}

/*
  getTodayString()
  Returns today's date in "June 5" format, used in the nav date display.
*/
function getTodayString() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/*
  capitalize(str)
  Capitalizes the first letter of a string.
  "stressed" → "Stressed"
*/
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/* =============================================
   3. LOCAL STORAGE MODULE
   =============================================
   TEACHING: What is Local Storage?
   
   Your browser provides a small (5MB) storage area
   called localStorage that websites can use to save data.
   
   Think of it like a tiny database built into the browser:
   - Data PERSISTS after you close the tab or refresh
   - It's KEY-VALUE storage: you save data under a name (key)
   - Data is stored as STRINGS — so we use JSON.stringify() to
     convert JavaScript objects/arrays to strings before saving,
     and JSON.parse() to convert them back when reading.
   
   API:
     localStorage.setItem('key', value)    — save
     localStorage.getItem('key')           — read (returns null if not found)
     localStorage.removeItem('key')        — delete
   
   Why use it here instead of a real database?
   Because for a beginner project, we don't need a server!
   localStorage keeps data in the user's own browser — simple & free.
============================================= */

/*
  loadEntries()
  Retrieves the mood entries array from localStorage.
  Returns an empty array [] if nothing is saved yet.
*/
function loadEntries() {
  const stored = localStorage.getItem(STORAGE_KEY);
  /*
    TEACHING: The OR operator (||) as a default value.
    If localStorage.getItem returns null (nothing saved),
    we parse '[]' which gives us an empty array.
    This way, loadEntries() ALWAYS returns an array — never null.
  */
  return stored ? JSON.parse(stored) : [];
}

/*
  saveEntries(entries)
  Saves the entries array to localStorage as a JSON string.
  
  TEACHING: JSON (JavaScript Object Notation)
  JSON.stringify([{mood:'happy', date:'...'}])
  → '[{"mood":"happy","date":"..."}]'  (a plain string)
  
  JSON.parse('[{"mood":"happy","date":"..."}]')
  → [{mood:'happy', date:'...'}]  (back to a JS array)
*/
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/*
  addEntry(mood, label)
  Creates a new entry object, prepends it to the array, saves it.
  We prepend (unshift) so the most recent entry appears first.
*/
function addEntry(mood, label) {
  const entries = loadEntries();

  /*
    TEACHING: Object literal syntax
    {
      mood: mood,      — the mood string e.g. "stressed"
      label: label,    — display label e.g. "Stressed"
      date: new Date().toISOString()  — ISO 8601 timestamp e.g. "2025-06-05T14:23:00.000Z"
    }
    
    We store the ISO string so we can reconstruct a Date object later.
  */
  const newEntry = {
    mood: mood,
    label: label,
    date: new Date().toISOString()
  };

  entries.unshift(newEntry); // Add to FRONT of array (most recent first)
  saveEntries(entries);
  return entries;
}

/*
  clearEntries()
  Removes all mood data from localStorage.
*/
function clearEntries() {
  localStorage.removeItem(STORAGE_KEY);
}


/* =============================================
   4. MOOD CHECK-IN MODULE
   Handles what happens when a user clicks a mood button.
============================================= */

/*
  handleMoodSelection(mood, label)
  Called when a mood button is clicked.
  
  TEACHING: This function demonstrates the FLOW of user interaction:
  1. Save data (addEntry)
  2. Update the UI (renderHistory, showEncouragement)
  3. Give visual feedback (selected state)
*/
function handleMoodSelection(mood, label) {
  // 1. Save the new entry to localStorage
  addEntry(mood, label);

  // 2. Re-render the mood history UI to show the new entry
  renderHistory();

  // 3. Show encouragement message based on mood
  showEncouragement(mood);

  // 4. Visual feedback: briefly highlight the selected button
  const allButtons = document.querySelectorAll('.mood-btn');
  /*
    querySelectorAll returns a NodeList (like an array) of ALL elements
    that match the selector. We loop through them with forEach.
  */
  allButtons.forEach(btn => btn.classList.remove('selected'));

  const clickedBtn = document.querySelector(`[data-mood="${mood}"]`);
  /*
    Template literals (backtick strings) let us embed variables:
    `[data-mood="${mood}"]` becomes e.g. `[data-mood="stressed"]`
    This is a CSS attribute selector — finds the button with that attribute.
  */
  if (clickedBtn) {
    clickedBtn.classList.add('selected');
    /*
      classList.add / remove / toggle — manipulates CSS classes on an element.
      Adding 'selected' makes the CSS rule .mood-btn.selected apply.
    */

    // Remove the "selected" visual after 2 seconds — a nice touch
    setTimeout(() => clickedBtn.classList.remove('selected'), 2000);
    /*
      setTimeout(function, delay) — runs a function after `delay` milliseconds.
      Arrow function syntax: () => { ... } is shorthand for function() { ... }
    */
  }
}

/*
  showEncouragement(mood)
  Shows a supportive message when the mood warrants it.
  
  TEACHING: Conditional Logic (if/else)
  We check which mood was selected and show the appropriate message.
  This is the core of "AI-style" responses — it's really just
  clever use of if/else and object lookups!
*/
function showEncouragement(mood) {
  const box = document.getElementById('encouragementBox');
  const msgData = ENCOURAGEMENT_MESSAGES[mood]; // Object lookup by key

  if (!msgData) {
    // No message defined for this mood — clear the box
    box.textContent = '';
    box.className = 'encouragement-box';
    return;
  }

  // Set the message text
  box.textContent = msgData.message;

  // Reset classes and apply the right style type
  box.className = 'encouragement-box';
  if (msgData.type === 'positive') {
    box.classList.add('positive');
  }
}


/* =============================================
   5. VISUALIZATION MODULE
   Renders the mood timeline (emoji dots) and the
   text-based mood log list from stored entries.
============================================= */

/*
  renderHistory()
  The main render function — reads localStorage and rebuilds the UI.
  
  TEACHING: The "render" pattern
  In web development, "render" means "take data and turn it into HTML".
  We CLEAR the existing UI and REDRAW it from scratch using current data.
  This is simple and reliable for beginner projects.
*/
function renderHistory() {
  const entries = loadEntries();
  const timeline = document.getElementById('moodTimeline');
  const logList  = document.getElementById('moodLog');
  const empty    = document.getElementById('emptyState');

  // Clear existing content before re-rendering
  timeline.innerHTML = '';
  logList.innerHTML  = '';

  if (entries.length === 0) {
    // No entries yet — show the empty state message
    empty.style.display = 'block';
    return;
  }

  // Hide empty state
  empty.style.display = 'none';

  // Show only the last 14 entries in the timeline (avoid overflow)
  const recentEntries = entries.slice(0, 14);

  // TEACHING: forEach loop — iterates over each item in an array
  recentEntries.forEach(entry => {
    // --- Build a timeline dot ---
    const dot = document.createElement('div');
    /*
      createElement(tagName) creates a new HTML element in memory.
      It doesn't appear on screen until we append it to the DOM.
    */
    dot.className = 'timeline-dot';
    dot.setAttribute('data-mood', entry.mood);
    dot.textContent = MOOD_EMOJIS[entry.mood];
    dot.title = `${capitalize(entry.mood)} — ${formatDate(entry.date)}`;
    /*
      .title attribute creates a native browser tooltip on hover.
      Useful for accessibility and extra info without cluttering UI.
    */
    timeline.appendChild(dot);
  });

  // Build the full text log (all entries)
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'mood-log-item';
    /*
      innerHTML lets us insert HTML as a string.
      We use template literals to build the HTML dynamically.
      Note: Only use innerHTML with data you trust! For user-typed input,
      always sanitize first to prevent XSS (Cross Site Scripting) attacks.
      Here our data comes from our own controlled inputs, so it's safe.
    */
    li.innerHTML = `
      <span class="mood-log-date">${formatDate(entry.date)}</span>
      <span class="mood-log-mood">${MOOD_EMOJIS[entry.mood]} ${capitalize(entry.label)}</span>
    `;
    logList.appendChild(li);
  });
}


/* =============================================
   6. STRESS TIPS MODULE
   Picks a random tip from the array and displays it.
   Also renders ALL tips as passive cards below.
============================================= */

/*
  getRandomTip()
  Returns a random tip object from the STRESS_TIPS array.
  
  TEACHING: JavaScript Randomization
  Math.random() returns a floating point number: 0.0000... to 0.9999...
  Multiplying by array.length scales it to the array's size.
  Math.floor() rounds DOWN to get a whole number (0 to length-1).
  
  Example with 12 tips:
  Math.random()           → 0.7342
  0.7342 * 12             → 8.8104
  Math.floor(8.8104)      → 8        ← a valid array index!
*/
function getRandomTip() {
  const randomIndex = Math.floor(Math.random() * STRESS_TIPS.length);
  return STRESS_TIPS[randomIndex];
}

/*
  showRandomTip()
  Updates the tip display card with a freshly chosen random tip.
*/
function showRandomTip() {
  const tip = getRandomTip();
  const display = document.getElementById('tipDisplay');

  // Create the tip element
  const tipEl = document.createElement('p');
  tipEl.className = 'tip-text';
  tipEl.textContent = `${tip.icon} ${tip.text}`;

  // Clear old tip and add new one (the CSS animation will play)
  display.innerHTML = '';
  display.appendChild(tipEl);
}

/*
  renderAllTips()
  Displays ALL tips as a grid of small cards below the generator.
  This gives users a browse-able reference without needing to click.
*/
function renderAllTips() {
  const grid = document.getElementById('allTipsGrid');
  grid.innerHTML = ''; // Clear first

  STRESS_TIPS.forEach((tip, index) => {
    /*
      forEach callback receives (element, index) — the current item
      and its position (0, 1, 2...) in the array.
    */
    const card = document.createElement('div');
    card.className = 'tip-card-item';
    card.innerHTML = `
      <div class="tip-num">${tip.icon}</div>
      <p>${tip.text}</p>
    `;
    grid.appendChild(card);
  });
}


/* =============================================
   7. UI HELPERS
   Small functions for navbar scroll effect,
   date display, and mobile nav toggle.
============================================= */

/*
  initDateDisplay()
  Fills the date display div with today's date.
*/
function initDateDisplay() {
  const el = document.getElementById('dateDisplay');
  if (el) el.textContent = getTodayString();
}

/*
  initNavbar()
  Adds scroll-based shadow to navbar and mobile toggle behavior.
*/
function initNavbar() {
  const navbar  = document.querySelector('.navbar');
  const toggle  = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');

  // TEACHING: Event Listeners
  // addEventListener(eventType, callback) — runs callback when event fires.
  // 'scroll' fires continuously as user scrolls the page.
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile hamburger toggle
  if (toggle) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      /*
        classList.toggle('open') adds 'open' if it's absent,
        removes it if it's present. Perfect for toggles!
      */
    });
  }

  // Close mobile nav when a link is clicked
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }
}

/*
  initMoodButtons()
  Attaches click listeners to all mood buttons.
  
  TEACHING: Event Delegation vs Direct Binding
  We could add a listener to each button individually,
  but it's cleaner to loop through querySelectorAll and
  attach to each one. For dynamic content, you'd use
  event delegation (attaching to the parent), but here
  the buttons are static, so direct binding works fine.
*/
function initMoodButtons() {
  const buttons = document.querySelectorAll('.mood-btn');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      /*
        dataset lets us read data-* attributes as properties.
        <button data-mood="stressed" data-label="Stressed">
        button.dataset.mood  → "stressed"
        button.dataset.label → "Stressed"
      */
      const mood  = button.dataset.mood;
      const label = button.dataset.label;
      handleMoodSelection(mood, label);
    });
  });
}

/*
  initTipButton()
  Attaches click listener to the "Give Me a Stress Tip" button.
*/
function initTipButton() {
  const btn = document.getElementById('tipBtn');
  if (btn) {
    btn.addEventListener('click', showRandomTip);
  }
}

/*
  initClearButton()
  Attaches click listener to the "Clear History" button.
  Shows a confirmation dialog before deleting — good UX!
*/
function initClearButton() {
  const btn = document.getElementById('clearHistoryBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      /*
        window.confirm() is a built-in browser dialog that returns
        true (OK) or false (Cancel). Simple but effective for
        destructive actions like clearing data.
      */
      const confirmed = window.confirm('Are you sure you want to clear your mood history? This cannot be undone.');
      if (confirmed) {
        clearEntries();
        renderHistory();
        document.getElementById('encouragementBox').textContent = '';
      }
    });
  }
}


/* =============================================
   8. INITIALIZATION
   =============================================
   TEACHING: DOMContentLoaded
   
   This is the most important event for any web app.
   It fires when the HTML document has fully loaded and
   all elements are available to JavaScript.
   
   If we ran our code BEFORE this event, calls like
   document.getElementById('moodGrid') would return null
   because the element wouldn't exist yet.
   
   Since our <script> tag is at the BOTTOM of <body>,
   the DOM is already ready, but wrapping in DOMContentLoaded
   is still considered best practice — it's a safety net.
============================================= */
document.addEventListener('DOMContentLoaded', () => {

  console.log('🌿 MindSpace loaded. JS is running!');
  /*
    console.log() outputs to the browser's DevTools console.
    Press F12 → Console tab to see these messages.
    Very useful for debugging!
  */

  // --- Run all initializers in order ---

  initNavbar();       // Set up navbar scroll + mobile toggle
  initDateDisplay();  // Show today's date in the check-in section

  initMoodButtons();  // Attach click handlers to emoji buttons
  initClearButton();  // Attach handler to clear history button
  renderHistory();    // Load and display saved entries from localStorage

  initTipButton();    // Attach handler to stress tip button
  renderAllTips();    // Display all tips as passive cards

  /*
    TEACHING: Why call renderHistory() on load?
    
    localStorage persists between sessions.
    So when the page loads, we immediately render any
    previously saved entries — that's the whole point!
    The user sees their history without doing anything.
  */

  console.log('✅ All modules initialized. Entries in storage:', loadEntries().length);
});
