import mouseClickSound from "/sounds/mouse_click.mp3";

export async function playClickSound() {
  try {
    // Create audio element if it doesn't exist
    const sound = new Audio(mouseClickSound);
    sound.preload = "auto";
    sound.volume = 0.5; // Set volume to 50%

    // Reset audio to beginning and play
    sound.currentTime = 0;
    await sound.play();
  } catch (error) {
    console.warn("Error setting up click sound:", error);
  }
}
