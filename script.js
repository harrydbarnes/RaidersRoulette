document.addEventListener('DOMContentLoaded', () => {
    const soloButton = document.getElementById('solo');
    const duoButton = document.getElementById('duo');
    const trioButton = document.getElementById('trio');
    const rollButton = document.getElementById('roll');
    const rerollButtons = document.querySelectorAll('.reroll-btn');
    const copyButton = document.getElementById('copy-btn');

    const resultElements = {
        map: document.getElementById('map-result'),
        loot: document.getElementById('loot-result'),
        style: document.getElementById('style-result'),
        codeWord: document.getElementById('code-word-result'),
    };

    let squadSize = 'solo'; // Default squad size
    let isRolling = false;

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

        await animateResult(resultElements.map, 'map');
        await animateResult(resultElements.loot, 'loot');
        await animateResult(resultElements.style, 'style');
        await animateResult(resultElements.codeWord, 'codeWord');
        
        isRolling = false;
        rollButton.disabled = false;
    }

    soloButton.addEventListener('click', () => selectSquad('solo'));
    duoButton.addEventListener('click', () => selectSquad('duo'));
    trioButton.addEventListener('click', () => selectSquad('trio'));
    rollButton.addEventListener('click', rollAll);

    rerollButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (isRolling) return;
            const category = button.dataset.category;
            const element = resultElements[category];
            await animateResult(element, category);
        });
    });

    copyButton.addEventListener('click', () => {
        const map = resultElements.map.textContent;
        const loot = resultElements.loot.textContent;
        const style = resultElements.style.textContent;
        const codeWord = resultElements.codeWord.textContent;

        if (map === '🎲' || loot === '🎲' || style === '🎲' || codeWord === '🎲') {
            // Don't copy if not all results are available
             return;
        }

        let lootText = `for a ${loot}`;
        if (loot === 'No Loot') {
            lootText = 'for No Loot';
        }

        let styleText = `we will ${style}`;
        if (style === 'Lone Wolf') {
            styleText = 'we will go Lone Wolf';
        } else if (style === 'Lone Wolves') {
            styleText = 'we will be Lone Wolves';
        } else if (style === 'Decepticon') {
            styleText = 'we will play Decepticon';
        }

        const textToCopy = `Hey, Raider - want to team up? We are heading to ${map}, ${lootText} and ${styleText}. Code word for this run is ${codeWord}.`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = '✅';
            setTimeout(() => {
                copyButton.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });

    // Set initial state
    selectSquad('solo');
});
