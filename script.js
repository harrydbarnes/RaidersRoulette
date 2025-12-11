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

    // TTS Setup
    let voices = [];
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

        const ttsText = getRandomElement(TTS_PHRASES);
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
        mapCondition: ['w/Condition', ' - Normal'],
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

        const textToCopy = `Hey, Raider - want to team up? We are heading to ${map} ${mapCondition}, ${lootText} and ${styleText}. Code word for this run is ${codeWord}.`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyFeedback(true);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showCopyFeedback(false);
        });
    });

    // --- Trophy Feature ---
    const trophyBtn = document.getElementById('trophy-btn');
    const trophyModal = document.getElementById('trophy-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const trophySortSelect = document.getElementById('trophy-sort');
    const trophyList = document.getElementById('trophy-list');
    const TRACKED_TROPHIES_STORAGE_KEY = 'arc_raiders_tracked_trophies';

    // Trophy Data
    let trophies = [];

    // State
    let trackedTrophies = new Set(JSON.parse(localStorage.getItem(TRACKED_TROPHIES_STORAGE_KEY) || '[]'));

    // Fetch trophies
    fetch('trophies.json')
        .then(response => response.json())
        .then(data => {
            trophies = data;
        })
        .catch(err => console.error('Error loading trophies:', err));
    let trophySortMethod = 'name';

    // Rarity values for sorting
    const rarityOrder = { 'Platinum': 0, 'Gold': 1, 'Silver': 2, 'Bronze': 3 };

    function renderTrophies() {
        const sortedTrophies = [...trophies].sort((a, b) => {
            // Put tracked items first
            const trackedSort = trackedTrophies.has(b.name) - trackedTrophies.has(a.name);
            if (trackedSort !== 0) return trackedSort;

            // Then sort by selected method
            if (trophySortMethod === 'rarity') {
                const raritySort = rarityOrder[a.rarity] - rarityOrder[b.rarity];
                if (raritySort !== 0) return raritySort;
            }

            // Fallback to name sort
            return a.name.localeCompare(b.name);
        });

        const trophyElements = sortedTrophies.map(trophy => {
            const li = document.createElement('li');
            li.className = `trophy-item ${trophy.rarity.toLowerCase()}`;
            if (trackedTrophies.has(trophy.name)) {
                li.classList.add('tracked');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'trophy-checkbox';
            checkbox.checked = trackedTrophies.has(trophy.name);
            checkbox.addEventListener('change', () => {
                toggleTrackTrophy(trophy.name);
            });

            const info = document.createElement('div');
            info.className = 'trophy-info';

            const name = document.createElement('span');
            name.className = 'trophy-name';
            name.textContent = trophy.name;

            const desc = document.createElement('span');
            desc.className = 'trophy-desc';
            desc.textContent = trophy.description;

            const rarity = document.createElement('span');
            rarity.className = 'trophy-rarity';
            rarity.textContent = trophy.rarity;

            info.appendChild(name);
            info.appendChild(desc);
            info.appendChild(rarity);

            li.appendChild(checkbox);
            li.appendChild(info);
            return li;
        });

        trophyList.replaceChildren(...trophyElements);
    }

    function toggleTrackTrophy(name) {
        if (trackedTrophies.has(name)) {
            trackedTrophies.delete(name);
        } else {
            trackedTrophies.add(name);
        }
        localStorage.setItem(TRACKED_TROPHIES_STORAGE_KEY, JSON.stringify([...trackedTrophies]));
        renderTrophies();
    }

    trophyBtn.addEventListener('click', () => {
        renderTrophies();
        trophyModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        trophyModal.classList.add('hidden');
    });

    // Close modal when clicking outside content
    trophyModal.addEventListener('click', (e) => {
        if (e.target === trophyModal) {
            trophyModal.classList.add('hidden');
        }
    });

    trophySortSelect.addEventListener('change', (e) => {
        trophySortMethod = e.target.value;
        renderTrophies();
    });

    // Set initial state
    selectSquad('solo');
});
