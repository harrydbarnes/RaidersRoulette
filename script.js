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

            if (category === 'map') {
                await Promise.all([
                    animateResult(element, category),
                    animateResult(resultElements.mapCondition, 'mapCondition')
                ]);
            } else {
                await animateResult(element, category);
            }

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
    const trophies = [
        { name: "Many Tales to Tell", rarity: "Platinum", description: "Collect all trophies" },
        { name: "Scavenger", rarity: "Silver", description: "Search 50 loot containers" },
        { name: "Well-Traveled", rarity: "Bronze", description: "Safely return from Dam Battlegrounds, Buried City and Spaceport" },
        { name: "Escape Artist", rarity: "Gold", description: "Safely return to Speranza 100 times" },
        { name: "Rite of Passage", rarity: "Bronze", description: "Safely return to Speranza for the first time" },
        { name: "Into Thin Air", rarity: "Bronze", description: "Safely return to Speranza through a Raider Hatch" },
        { name: "Behind Closed Doors", rarity: "Bronze", description: "Visit a locked room on Dam Battlegrounds, Buried City or Spaceport" },
        { name: "The Big Haul", rarity: "Bronze", description: "Return to Speranza with 50,000 worth of loot" },
        { name: "The Long Haul", rarity: "Bronze", description: "Reach a total lifetime loot value of 1,000,000" },
        { name: "Expert Weaponsmith", rarity: "Bronze", description: "Upgrade a weapon to Tier IV" },
        { name: "Well-Armed", rarity: "Bronze", description: "Have two weapons of Tier II or higher equipped in a round" },
        { name: "Back from the Brink", rarity: "Bronze", description: "Revive a squadmate ten times" },
        { name: "Legend of Speranza", rarity: "Gold", description: "Reach level 75" },
        { name: "Dedicated to the Craft", rarity: "Silver", description: "Have five stations upgraded to level 3 or higher" },
        { name: "Self-Sufficient", rarity: "Bronze", description: "Install a station in your Workshop" },
        { name: "In Your Element", rarity: "Bronze", description: "Reach level 10" },
        { name: "Getting Serious", rarity: "Bronze", description: "Upgrade a Workshop station to level 2" },
        { name: "Same Song, Same Verse", rarity: "Bronze", description: "Set off two car alarms in a single round" },
        { name: "In the Nick of Time", rarity: "Bronze", description: "Safely return to Speranza with less than 5 seconds left in the round" },
        { name: "Not Over Till It’s Over", rarity: "Bronze", description: "Safely return to Speranza while drowned" },
        { name: "Practice Makes Perfect", rarity: "Bronze", description: "Visit the Practice Range" },
        { name: "Bells and Whistles", rarity: "Bronze", description: "Have 4 weapon mods on a single weapon" },
        { name: "Long Shot", rarity: "Bronze", description: "Hit a target over 250 meters away" },
        { name: "No Going Back", rarity: "Bronze", description: "(Hidden) Be topside when a safe window closes" },
        { name: "Just Dropping In", rarity: "Bronze", description: "(Hidden) Get hit by a Supply Drop" },
        { name: "Most Durable Pants in Speranza", rarity: "Bronze", description: "Slide 80 meters without stopping" },
        { name: "See You Never", rarity: "Bronze", description: "(Hidden) Return safely to Speranza while leaving a squadmate behind" },
        { name: "Today You, Tomorrow Me", rarity: "Bronze", description: "Revive an encountered Raider with a Defibrillator" },
        { name: "Top of the World", rarity: "Bronze", description: "(Hidden) Reach the top of the Launch Towers in Spaceport" },
        { name: "For Science!", rarity: "Bronze", description: "Get gas, stun, and burn statuses at the same time" },
        { name: "Shots Fired", rarity: "Bronze", description: "Deal 1000 damage to ARC enemies" },
        { name: "Racking Them Up", rarity: "Bronze", description: "Destroy 50 ARC enemies" },
        { name: "Trail of Destruction", rarity: "Silver", description: "Destroy 100 ARC enemies" },
        { name: "Death From Above", rarity: "Silver", description: "(Hidden) Deal 50 damage to any enemy while atop a Rocketeer" },
        { name: "Three Birds, One Stone", rarity: "Bronze", description: "Destroy 3 ARC enemies with a single Wolfpack grenade" },
        { name: "Bringing Down the Big Guns", rarity: "Bronze", description: "Destroy a Rocketeer" },
        { name: "Into the Breach", rarity: "Bronze", description: "Destroy a Bastion" },
        { name: "A Tale for the Ages", rarity: "Gold", description: "Destroy the Queen" },
        { name: "Blindsided", rarity: "Silver", description: "Destroy a Sentinel with a Raider Tool" },
        { name: "Snitches get Stitched", rarity: "Bronze", description: "Destroy a Snitch with a Stitcher" },
        { name: "Comparative Study", rarity: "Bronze", description: "Use 4 different weapons to deal damage in the Practice Range" },
        { name: "Hook, Line, and Sinker", rarity: "Bronze", description: "Use a Lure Grenade to make a drone attack another drone" },
        { name: "Mechanical Failure", rarity: "Bronze", description: "Shoot a thruster off a Wasp" },
        { name: "Unyielding", rarity: "Bronze", description: "Knock out 10 Raiders" },
        { name: "A Vendetta Is Born", rarity: "Bronze", description: "(Hidden) Get downed and knocked out while inside a return point" },
        { name: "Horseshoes and Hand Grenades", rarity: "Bronze", description: "Down an encountered Raider with a grenade" },
        { name: "Crossed the Threshold", rarity: "Bronze", description: "Knock out a Raider" },
        { name: "Up Close and Personal", rarity: "Bronze", description: "Knock out a Raider with a Raider Tool" },
        { name: "The Friends We Made Along The Way", rarity: "Bronze", description: "Return to Speranza together with an encountered Raider" },
        { name: "Enemy of My Enemy", rarity: "Bronze", description: "(Hidden) Get an encountered Raider downed by ARC enemies summoned with a Snitch Scanner" },
        { name: "Heart of Gold", rarity: "Bronze", description: "Be thanked 10 times in direct response to something you did" }
    ];

    // State
    let trackedTrophies = new Set(JSON.parse(localStorage.getItem(TRACKED_TROPHIES_STORAGE_KEY) || '[]'));
    let trophySortMethod = 'name';

    // Rarity values for sorting
    const rarityOrder = { 'Platinum': 0, 'Gold': 1, 'Silver': 2, 'Bronze': 3 };

    function renderTrophies() {
        trophyList.replaceChildren();

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

        sortedTrophies.forEach(trophy => {
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
            trophyList.appendChild(li);
        });
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
