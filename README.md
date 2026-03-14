# Starlight Collector *

An interactive installation where digital collection meets physical feedback. Using **p5.js** and **Arduino**, you gather floating "stars" on your screen that physically illuminate colored LEDs. When you've gathered enough, you can "release" them, triggering a physics-based scatter animation on screen and resetting your physical lights.

p5.js link: https://editor.p5js.org/briansu242/sketches/0YpYW_Nwy

---

## How it works

The project is a bridge between a virtual environment and physical hardware:

- **`sketch.js`** runs a p5.js animation where stars float upward. It tracks your mouse to "catch" stars and sends brightness values to the Arduino based on how many you've collected.
- **`arduino_sketch.ino`** listens for those brightness values to light up three LEDs (Gold, Rose, and Frost). It also monitors a physical push-button; when pressed, it tells the browser to trigger the "Release" phase.

---

## Setup

### Hardware Wiring

Tinkercad design: https://www.tinkercad.com/things/9KllqzHOBYw-3-led-button-with-p5js?sharecode=iBwLngYCx_VlYXaZ4FTLFNeyS1jL2C52Gc0Eq085uVY

Connect your components to the Arduino as follows:
- **LEDs**: Connect the anodes (long legs) to Pins **11 (Gold)**, **10 (Rose)**, and **9 (Frost)** using 220Ω resistors.
- **Button**: Connect a push-button to **Pin 2**. 
- **Common Ground**: Ensure all LED cathodes and the button circuit return to the Arduino **GND** pin.

### Running it

1.  **Upload the Arduino code**: Open the `.ino` file in the Arduino IDE and upload it to your board.
2.  **Start the Web Interface**: Open `index.html` in your browser. For the best experience with the Web Serial API, use **Chrome** or **Edge**. 
    * *Note: Using the **Live Server extension in VSCode** is highly recommended to avoid local file permission issues and ensure the Web Serial API functions correctly.*
3.  **Connect**: Click the **"Connect Arduino"** button at the top of the page and select your Arduino's serial port from the browser popup.
4.  **Interact**: Once connected, **click the screen** to ensure the browser is focused and ready to play.

---

## Playing

**Collecting**: Hover your mouse over the floating stars. You can only collect stars that match your current **Active Mode** (Gold, Rose, or Frost). You can switch modes using the buttons at the top of the screen. As you catch stars, the corresponding LED on your Arduino will grow brighter.

**Releasing**: Once you have collected at least one star, the **"Release ✦"** button will appear. You can click this button or press the **physical button** on your Arduino. This will:
- Trigger the **Scatter Phase**, where all collected stars burst from the center and bounce off the floor.
- Send a signal to the Arduino to turn off all physical LEDs.

**Resetting**: After the stars have scattered, click **"Start Over ↺"** to return to the dark sky and begin collecting again.

---

## Code walkthrough

### sketch.js

**Phase Management** — The script toggles between `'collect'` and `'scatter'`. This determines whether the background is dark (night sky) or light (daybreak) and which class of stars is being rendered.

**Serial Communication** — Uses the Web Serial API for low-latency hardware interaction. 
- **`sendSerial()`** formats data as `L:G,R,F\n`, allowing the Arduino to easily parse three separate brightness values from a single line.
- **`LineBreakTransformer`** ensures the browser reads full lines of text from the Arduino, preventing the "RELEASE" command from being cut into fragments.

**`class Floater`** — Defines the behavior of rising stars. It uses `dist(mouseX, mouseY, ...)` to check if the user has successfully "caught" a star while in the matching color mode.

**`class ScatterStar`** — Uses a simple physics engine. Every frame, a gravity constant is added to the star's vertical velocity. When a star hits the bottom of the canvas, its velocity is inverted and scaled (`* -0.55`) to create a realistic bounce.

---

### arduino_sketch.ino

**`Serial.find("L:")`** — A specialized function that "listens" through the incoming serial noise. It ignores all data until it sees the specific "L:" prefix, then immediately reads the three following integers to update the LED PWM values.

**State Change Detection** — The script tracks `lastButtonState`. This ensures that even if you hold the button down, the Arduino only sends the "RELEASE" command to the browser **once** at the moment the circuit is first closed.

---

## Tweaking

- **`MAX_VAL`** (default `100`) — Change this to adjust how many stars you need to catch to reach maximum LED brightness.
- **`floaters.push(new Floater())`** — Change the loop count in `setup()` to increase or decrease the density of the star field.
- **Gravity** (`0.25`) — Located in the `ScatterStar` class; increase this value for a "heavier" feel during the release phase.

---

## Troubleshooting

**The "Connect" button doesn't do anything**
The Web Serial API requires a secure context. Ensure you are running through `localhost` (via Live Server) or a secure `https` connection.

**LEDs stay off**
Check your wiring. Ensure the LEDs are oriented correctly (long leg to the signal pin) and that the Ground (GND) is shared between all components.

**Button triggers twice or feels "jittery"**
Check the `delay(200)` in the Arduino code. This "debounces" the physical switch. You can increase this value if your button is physically loose or prone to electrical noise.

---

## Credits

- **p5.js** — Visuals and interaction framework.
- **Web Serial API** — Browser-to-Hardware communication.
- **Google Fonts** — "Cinzel" typeface for the celestial aesthetic.
- **Gemini (Google AI)** — Architecture for the Serial communication bridge and UI optimization.
