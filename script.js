document.addEventListener('DOMContentLoaded', () => {
    const soloButton = document.getElementById('solo');
    const duoButton = document.getElementById('duo');
    const trioButton = document.getElementById('trio');
    const rollButton = document.getElementById('roll');
    const rerollButtons = document.querySelectorAll('.reroll-btn');
    // Updated selector for the new toast element
    const copyButton = document.getElementById('copy-toast');
    const copyIcon = copyButton.querySelector('.icon');
    const copyText = copyButton.querySelector('.text');

    const resultElements = {
        map: document.getElementById('map-result'),
        mapCondition: document.getElementById('map-condition-result'),
        loot: document.getElementById('loot-result'),
        style: document.getElementById('style-result'),
        codeWord: document.getElementById('code-word-result'),
    };

    let squadSize = 'solo'; // Default squad size
    let isRolling = false;
    let copyFeedbackTimeout;
    const originalCopyIcon = copyIcon.textContent;
    const originalCopyText = copyText.textContent;

    // Constants
    const COPY_FEEDBACK_DURATION_MS = 2000;
    const TTS_PHRASES = [
        "Hey Raider, want to team up?",
        "Don't shoot!",
        "Awh hunny, did you lose your loot again?",
        "Are you feeling lucky, punk?",
        "Raider, I’ve got room in my squad if you’re breathing and vaguely competent.",
        "Patch up quick, there’s trouble humming on the horizon.",
        "Contact up high, keep your head down unless you don’t mind losing it.",
        "Supplies are thin. Take what you can, share if you feel sentimental.",
        "Scanner’s lighting up. Might be salvage, might be death. Only one way to know.",
        "If you’re heading into the valley, stick close. The drones love a lonely target.",
        "You shoot straight, you stay alive. Fancy footwork’s optional.",
        "Want to expedite and chill together?"
    ];
    const TTS_PITCH = 1.1;
    const TTS_RATE = 1.1;

    // Frost Effect Dates
    const MONTH_DECEMBER = 11;
    const MONTH_JANUARY = 0;
    const FROST_END_DAY = 12; // January 11th is the last day, so strictly less than 12
    const MAX_ICE_CRACKS = 15;

    // TTS Setup
    let voices = [];
    let availableTtsPhrases = [];
    let lastSpokenPhrase = null;

    function loadVoices() {
        voices = window.speechSynthesis.getVoices();
    }

    if (window.speechSynthesis) {
        loadVoices();
        // Use addEventListener for better compatibility and clean code
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    }

    function speakIntro() {
        if (!window.speechSynthesis) return;

        // Cancel any currently playing speech to avoid overlap
        window.speechSynthesis.cancel();

        // Refresh phrases if empty and shuffle them
        if (availableTtsPhrases.length === 0) {
            const newPhrases = [...TTS_PHRASES];

            // Fisher-Yates shuffle for an efficient and uniform shuffle.
            for (let i = newPhrases.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newPhrases[i], newPhrases[j]] = [newPhrases[j], newPhrases[i]];
            }

            // Avoid immediate repetition. If the next phrase to be popped is the same
            // as the last one spoken, swap it with another random element.
            if (newPhrases.length > 1 && newPhrases[newPhrases.length - 1] === lastSpokenPhrase) {
                const lastIndex = newPhrases.length - 1;
                // Swap with a random element that isn't the last one
                const swapIndex = Math.floor(Math.random() * lastIndex);
                [newPhrases[lastIndex], newPhrases[swapIndex]] = [newPhrases[swapIndex], newPhrases[lastIndex]];
            }

            availableTtsPhrases = newPhrases;
        }

        // Get the next phrase from the end of the shuffled list.
        const ttsText = availableTtsPhrases.pop();
        lastSpokenPhrase = ttsText;

        const utterance = new SpeechSynthesisUtterance(ttsText);

        // Attempt to find an enthusiastic American male voice
        // Note: 'en-US' is standard. Gender detection is tricky across browsers/OS.
        // We look for common names or just prioritize en-US.
        // Fallback to browser default if no 'en-US' voice is found (instead of voices[0] which might be wrong language)
        const usVoices = voices.filter(v => v.lang === 'en-US');
        // Exclude generic 'Google US English' as it is often female
        const voice = usVoices.find(v => v.name.includes('Male') || v.name.includes('David') || (v.name.includes('Google US English') && v.name.includes('Male'))) || usVoices[0];

        if (voice) {
            utterance.voice = voice;
        }

        // Adjust pitch and rate to sound more "enthusiastic"
        utterance.pitch = TTS_PITCH;
        utterance.rate = TTS_RATE;

        window.speechSynthesis.speak(utterance);
    }

    function showCopyToast() {
        copyButton.classList.remove('hidden');
    }

    function showCopyFeedback(success) {
        clearTimeout(copyFeedbackTimeout);

        if (success) {
            copyIcon.textContent = '✅';
            copyText.textContent = 'Copied!';
        } else {
            copyIcon.textContent = '❌';
            copyText.textContent = 'Error';
        }

        copyFeedbackTimeout = setTimeout(() => {
            copyIcon.textContent = originalCopyIcon;
            copyText.textContent = originalCopyText;
        }, COPY_FEEDBACK_DURATION_MS);
    }

    const options = {
        map: ['Dam Battlegrounds', 'Buried City', 'Spaceport', 'The Blue Gate', 'Stella Montis'],
        mapCondition: ['w/Condition', '- Normal'],
        loot: ['Loot Goblin', 'Standard Run', 'No Loot'],
        style: {
            solo: ['Lone Wolf', 'Buddy Up', 'Decepticon', 'Kill on Sight'],
            duo: ['Lone Wolves', 'Buddy Up', 'Decepticon', 'Kill on Sight'],
            trio: ['Lone Wolves', 'Buddy Up', 'Decepticon', 'Kill on Sight']
        },
        codeWord: ['Spicy Meatball', 'Flapjack', 'Penguin', 'Pepperoni', 'Glitter', 'Banana Protocol', 'Check the Fridge', 'The Wrong Trousers', 'My Guy', 'Left', 'Right', 'Dead Ahead', 'Look Up', 'Look Down']
    };

    const styleTextPhrases = {
        'Lone Wolf': 'we will go Lone Wolf',
        'Lone Wolves': 'we will be Lone Wolves',
        'Decepticon': 'we will play Decepticon',
    };

    // Set initial dice emoji
    Object.values(resultElements).forEach(el => el.textContent = '🎲');

    function selectSquad(size) {
        squadSize = size;
        soloButton.classList.remove('selected');
        duoButton.classList.remove('selected');
        trioButton.classList.remove('selected');

        if (size === 'solo') soloButton.classList.add('selected');
        else if (size === 'duo') duoButton.classList.add('selected');
        else if (size === 'trio') trioButton.classList.add('selected');
    }

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getOptionsForCategory(category) {
        return category === 'style' ? options.style[squadSize] : options[category];
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function animateResult(element, category) {
        const rerollBtn = document.querySelector(`.reroll-btn[data-category="${category}"]`);
        if (rerollBtn) {
            rerollBtn.classList.add('rolling');
        }

        const optionList = getOptionsForCategory(category);
        const finalResult = getRandomElement(optionList);
        let fastCycleCount = 0;

        // Fast cycle
        const fastInterval = setInterval(() => {
            element.textContent = getRandomElement(optionList);
            fastCycleCount++;
        }, 50);

        await sleep(1000); // Faster fast cycle
        clearInterval(fastInterval);

        // Slow cycle
        for (let i = 0; i < 3; i++) { // Fewer slow steps
            element.textContent = getRandomElement(optionList);
            await sleep(150 + i * 50); // Faster slow cycle
        }
        
        element.textContent = finalResult;

        if (rerollBtn) {
            rerollBtn.classList.remove('rolling');
        }
    }

    async function rollAll() {
        if (isRolling) return;
        isRolling = true;
        rollButton.disabled = true;

        // Hide toast while rolling new set
        copyButton.classList.add('hidden');

        // Speak when dice start rolling
        speakIntro();

        // Animate map and map condition concurrently
        await Promise.all([
            animateResult(resultElements.map, 'map'),
            animateResult(resultElements.mapCondition, 'mapCondition')
        ]);

        await animateResult(resultElements.loot, 'loot');
        await animateResult(resultElements.style, 'style');
        await animateResult(resultElements.codeWord, 'codeWord');
        
        isRolling = false;
        rollButton.disabled = false;

        // Show toast and speak after all rolls complete
        showCopyToast();
    }

    soloButton.addEventListener('click', () => selectSquad('solo'));
    duoButton.addEventListener('click', () => selectSquad('duo'));
    trioButton.addEventListener('click', () => selectSquad('trio'));
    rollButton.addEventListener('click', rollAll);

    rerollButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (isRolling || button.classList.contains('rolling')) return;

            // Disable main roll button to prevent conflicts
            rollButton.disabled = true;

            // Hide toast to prevent copying unstable state
            copyButton.classList.add('hidden');

            // Speak when reroll starts
            speakIntro();

            const category = button.dataset.category;
            const element = resultElements[category];

            const animations = [animateResult(element, category)];
            if (category === 'map') {
                animations.push(animateResult(resultElements.mapCondition, 'mapCondition'));
            }
            await Promise.all(animations);

            // Only show toast if no other dice are currently rolling
            // This prevents the toast from appearing prematurely if multiple rerolls were clicked
            if (document.querySelectorAll('.rolling').length === 0) {
                rollButton.disabled = false;
                showCopyToast();
            }
        });
    });

    copyButton.addEventListener('click', () => {
        const map = resultElements.map.textContent;
        const mapCondition = resultElements.mapCondition.textContent;
        const loot = resultElements.loot.textContent;
        const style = resultElements.style.textContent;
        const codeWord = resultElements.codeWord.textContent;

        if ([map, mapCondition, loot, style, codeWord].some(result => result === '🎲')) {
            // Don't copy if not all results are available
             return;
        }

        const lootText = loot === 'No Loot' ? 'for No Loot' : `for a ${loot}`;

        const styleText = styleTextPhrases[style] || `we will ${style}`;

        const mapConditionText = mapCondition === '- Normal' ? '' : ` ${mapCondition}`;
        const textToCopy = `Hey, Raider - want to team up? We are heading to ${map}${mapConditionText}, ${lootText} and ${styleText}. Code word for this run is ${codeWord}.`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyFeedback(true);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showCopyFeedback(false);
        });
    });

    // --- Trophy Feature ---
    class TrophyManager {
        static TRACKED_TROPHIES_STORAGE_KEY = 'arc_raiders_tracked_trophies';

        constructor() {
            this.trophyBtn = document.getElementById('trophy-btn');
            this.trophyModal = document.getElementById('trophy-modal');
            this.closeModalBtn = document.getElementById('close-modal');
            this.trophySortSelect = document.getElementById('trophy-sort');
            this.trophyList = document.getElementById('trophy-list');

            this.validateElements();

            this.trophies = [];
            this.trackedTrophies = new Set();
            this.trophySortMethod = 'name';
            this.rarityOrder = { 'Platinum': 0, 'Gold': 1, 'Silver': 2, 'Bronze': 3 };

            this.init();
        }

        validateElements() {
            const elements = {
                trophyBtn: this.trophyBtn,
                trophyModal: this.trophyModal,
                closeModalBtn: this.closeModalBtn,
                trophySortSelect: this.trophySortSelect,
                trophyList: this.trophyList
            };

            for (const [name, element] of Object.entries(elements)) {
                if (!element) {
                    console.error(`TrophyManager: Required DOM element '${name}' is missing.`);
                }
            }
        }

        init() {
            if (!this.trophyBtn || !this.trophyModal || !this.closeModalBtn || !this.trophySortSelect || !this.trophyList) {
                // validateElements already logs which elements are missing.
                return; // Abort to prevent runtime errors.
            }

            this.handleKeydown = this.handleKeydown.bind(this);
            this.loadTrackedTrophies();
            this.setupEventListeners();
        }

        loadTrackedTrophies() {
            try {
                const stored = localStorage.getItem(TrophyManager.TRACKED_TROPHIES_STORAGE_KEY);
                this.trackedTrophies = new Set(JSON.parse(stored || '[]'));
            } catch (e) {
                console.error('Failed to parse tracked trophies from localStorage:', e);
                this.trackedTrophies = new Set();
            }
        }

        setupEventListeners() {
            this.trophyBtn.addEventListener('click', () => {
                this.openModal();
            });

            this.closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });

            this.trophyModal.addEventListener('click', (e) => {
                if (e.target === this.trophyModal) {
                    this.closeModal();
                }
            });

            this.trophySortSelect.addEventListener('change', (e) => {
                this.trophySortMethod = e.target.value;
                this.renderTrophies();
            });

            // Event Delegation for Checkboxes
            this.trophyList.addEventListener('change', (e) => {
                if (e.target.matches('.trophy-checkbox')) {
                    const trophyName = e.target.dataset.name;
                    if (trophyName) {
                        this.toggleTrackTrophy(trophyName);
                    }
                }
            });
        }

        openModal() {
            this.trophyModal.classList.remove('hidden');
            document.addEventListener('keydown', this.handleKeydown);

            if (this.trophies.length === 0) {
                this.fetchTrophies();
            } else {
                this.renderTrophies();
            }

            // Trap focus
            const focusableElements = this.trophyModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length) {
                focusableElements[0].focus();
            }
        }

        closeModal() {
            this.trophyModal.classList.add('hidden');
            document.removeEventListener('keydown', this.handleKeydown);
            this.trophyBtn.focus();
        }

        handleKeydown(e) {
            if (e.key === 'Escape') {
                this.closeModal();
                return;
            }

            if (e.key === 'Tab') {
                const focusableElements = this.trophyModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        }

        async fetchTrophies() {
            const loadingLi = document.createElement('li');
            loadingLi.className = 'loading';
            loadingLi.textContent = 'Loading trophies...';
            this.trophyList.replaceChildren(loadingLi);

            try {
                const response = await fetch('trophies.json');
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error('Trophy data is not in the expected array format.');
                }
                this.trophies = data;
                this.renderTrophies();
            } catch (err) {
                console.error('Error loading trophies:', err);
                const errorLi = document.createElement('li');
                errorLi.className = 'error';
                errorLi.textContent = 'Failed to load trophies. Please try again later.';
                this.trophyList.replaceChildren(errorLi);
            }
        }

        renderTrophies() {
            if (this.trophies.length === 0) return;

            const sortedTrophies = [...this.trophies].sort((a, b) => {
                const trackedSort = this.trackedTrophies.has(b.name) - this.trackedTrophies.has(a.name);
                if (trackedSort !== 0) return trackedSort;

                if (this.trophySortMethod === 'rarity') {
                    const rarityA = this.rarityOrder[a.rarity] ?? Infinity;
                    const rarityB = this.rarityOrder[b.rarity] ?? Infinity;
                    const raritySort = rarityA - rarityB;
                    if (raritySort !== 0) return raritySort;
                }

                return a.name.localeCompare(b.name);
            });

            const trophyElements = sortedTrophies.map(trophy => {
                const li = document.createElement('li');
                const isTracked = this.trackedTrophies.has(trophy.name);

                li.className = `trophy-item ${(trophy.rarity || '').toLowerCase()}${isTracked ? ' tracked' : ''}`;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'trophy-checkbox';
                checkbox.dataset.name = trophy.name;
                checkbox.checked = isTracked;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'trophy-info';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'trophy-name';
                nameSpan.textContent = trophy.name;

                const descSpan = document.createElement('span');
                descSpan.className = 'trophy-desc';
                descSpan.textContent = trophy.description;

                const raritySpan = document.createElement('span');
                raritySpan.className = 'trophy-rarity';
                raritySpan.textContent = trophy.rarity;

                infoDiv.append(nameSpan, descSpan, raritySpan);
                li.append(checkbox, infoDiv);
                return li;
            });

            this.trophyList.replaceChildren(...trophyElements);
        }

        toggleTrackTrophy(name) {
            if (this.trackedTrophies.has(name)) {
                this.trackedTrophies.delete(name);
            } else {
                this.trackedTrophies.add(name);
            }
            localStorage.setItem(TrophyManager.TRACKED_TROPHIES_STORAGE_KEY, JSON.stringify([...this.trackedTrophies]));
            this.renderTrophies();
        }
    }

    new TrophyManager();

    // Set initial state
    selectSquad('solo');

    // Frost Effect Logic
    function handleSeasonalEffects() {
        const frostOverlay = document.getElementById('frost-overlay');
        if (frostOverlay) {
            const now = new Date();
            const month = now.getMonth();
            const day = now.getDate();

            // Active from December 1st through January 11th
            if (month === MONTH_DECEMBER || (month === MONTH_JANUARY && day < FROST_END_DAY)) {
                // Add active class after a short delay to ensure transition triggers on load
                setTimeout(() => {
                    frostOverlay.classList.add('active');
                }, 0);

                // Add cracking interaction
                document.addEventListener('click', (e) => {
                    createCrack(e.clientX, e.clientY);
                });
            }
        }
    }

    function createCrack(x, y) {
        const frostOverlay = document.getElementById('frost-overlay');
        if (!frostOverlay) return;

        const crack = document.createElement('div');
        crack.className = 'ice-crack';
        crack.style.left = `${x}px`;
        crack.style.top = `${y}px`;

        // Random rotation
        const rotation = Math.random() * 360;
        crack.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

        // Generate SVG crack
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 100 100");

        // Create 3-4 jagged lines from center
        const numLines = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numLines; i++) {
            const path = document.createElementNS(svgNS, "path");
            // Generate a jagged path from 50,50 to edge
            const angle = (i * (360 / numLines)) + (Math.random() * 40 - 20);
            const rad = angle * Math.PI / 180;
            const len = 30 + Math.random() * 20; // length 30-50

            // End point
            const ex = 50 + Math.cos(rad) * len;
            const ey = 50 + Math.sin(rad) * len;

            // Mid point for jag
            const midLen = len * (0.4 + Math.random() * 0.2);
            const midAngle = angle + (Math.random() * 60 - 30); // deviate
            const midRad = midAngle * Math.PI / 180;
            const mx = 50 + Math.cos(midRad) * midLen;
            const my = 50 + Math.sin(midRad) * midLen;

            path.setAttribute("d", `M50,50 L${mx},${my} L${ex},${ey}`);
            path.setAttribute("stroke", "rgba(255, 255, 255, 0.9)");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-linecap", "round");
            path.setAttribute("stroke-linejoin", "round");

            svg.appendChild(path);
        }

        crack.appendChild(svg);
        frostOverlay.appendChild(crack);

        // Limit number of cracks to prevent performance issues
        if (frostOverlay.children.length > MAX_ICE_CRACKS) {
            frostOverlay.removeChild(frostOverlay.children[0]);
        }
    }

    handleSeasonalEffects();
});
