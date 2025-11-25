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
    const TTS_TEXT = "Hey Raider, want to team up?";
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

        // Check if we have already played the intro this session
        if (sessionStorage.getItem('hasPlayedIntro')) {
            return;
        }

        // Cancel any currently playing speech to avoid overlap
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(TTS_TEXT);

        // Mark as played
        // We set it here so subsequent calls in this session will skip
        sessionStorage.setItem('hasPlayedIntro', 'true');

        // Attempt to find an enthusiastic American male voice
        // Note: 'en-US' is standard. Gender detection is tricky across browsers/OS.
        // We look for common names or just prioritize en-US.
        // Fallback to browser default if no 'en-US' voice is found (instead of voices[0] which might be wrong language)
        const usVoices = voices.filter(v => v.lang === 'en-US');
        const voice = usVoices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English')) || usVoices[0];

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

        await animateResult(resultElements.map, 'map');
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
            if (isRolling) return;

            // Hide toast to prevent copying unstable state
            copyButton.classList.add('hidden');

            // Speak when reroll starts
            speakIntro();

            const category = button.dataset.category;
            const element = resultElements[category];
            await animateResult(element, category);

            // Only show toast if no other dice are currently rolling
            // This prevents the toast from appearing prematurely if multiple rerolls were clicked
            if (document.querySelectorAll('.rolling').length === 0) {
                showCopyToast();
            }
        });
    });

    copyButton.addEventListener('click', () => {
        const map = resultElements.map.textContent;
        const loot = resultElements.loot.textContent;
        const style = resultElements.style.textContent;
        const codeWord = resultElements.codeWord.textContent;

        if ([map, loot, style, codeWord].some(result => result === '🎲')) {
            // Don't copy if not all results are available
             return;
        }

        const lootText = loot === 'No Loot' ? 'for No Loot' : `for a ${loot}`;

        const styleText = styleTextPhrases[style] || `we will ${style}`;

        const textToCopy = `Hey, Raider - want to team up? We are heading to ${map}, ${lootText} and ${styleText}. Code word for this run is ${codeWord}.`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            showCopyFeedback(true);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showCopyFeedback(false);
        });
    });

    // Set initial state
    selectSquad('solo');
});
