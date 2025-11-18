document.addEventListener('DOMContentLoaded', () => {
    const soloButton = document.getElementById('solo');
    const duoButton = document.getElementById('duo');
    const trioButton = document.getElementById('trio');
    const rollButton = document.getElementById('roll');

    const mapResult = document.getElementById('map-result');
    const lootResult = document.getElementById('loot-result');
    const styleResult = document.getElementById('style-result');
    const codeWordResult = document.getElementById('code-word-result');

    let squadSize = 'solo'; // Default squad size

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

    function selectSquad(size) {
        squadSize = size;
        soloButton.classList.remove('selected');
        duoButton.classList.remove('selected');
        trioButton.classList.remove('selected');

        if (size === 'solo') {
            soloButton.classList.add('selected');
        } else if (size === 'duo') {
            duoButton.classList.add('selected');
        } else if (size === 'trio') {
            trioButton.classList.add('selected');
        }
    }

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function rollDice() {
        mapResult.textContent = getRandomElement(options.map);
        lootResult.textContent = getRandomElement(options.loot);
        styleResult.textContent = getRandomElement(options.style[squadSize]);
        codeWordResult.textContent = getRandomElement(options.codeWord);
    }

    soloButton.addEventListener('click', () => selectSquad('solo'));
    duoButton.addEventListener('click', () => selectSquad('duo'));
    trioButton.addEventListener('click', () => selectSquad('trio'));
    rollButton.addEventListener('click', rollDice);

    // Set initial state
    selectSquad('solo');
});
