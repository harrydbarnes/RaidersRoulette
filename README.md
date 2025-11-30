# Arc Raiders Roulette

A simple web application to randomize loadouts and strategies for the game Arc Raiders.

## Features

- **Squad Size Selection**: Choose between Solo, Duo, or Trio modes.
- **Randomizer**: Generates a random Map, Loot strategy, Playstyle, and Code Word.
- **Voice Feedback**: Uses Text-to-Speech (TTS) to announce the start of a roll with an enthusiastic male voice.
- **Share**: Easily copy the generated loadout to your clipboard to share with your squad.

## Getting Started

### Prerequisites

You need a modern web browser to run this application.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory.

### Usage

1.  Open `index.html` in your web browser.
    *   Alternatively, run a local server:
        ```bash
        python3 -m http.server 8000
        ```
        Then visit `http://localhost:8000`.
2.  Select your squad size.
3.  Click **ROLL** to generate a strategy.
4.  Click the **Share** button (bottom right) to copy the strategy to your clipboard.

## Customization

-   **Voices**: The app attempts to select a male English (US) voice.
-   **Options**: You can modify the randomization options in `script.js`.
