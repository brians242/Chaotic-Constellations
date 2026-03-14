// Pins for LEDs
int goldPin = 11;   
int rosePin = 10;   
int frostPin = 9;   

// Pin for Button
const int buttonPin = 2;
int lastButtonState = LOW;

void setup() {
  Serial.begin(9600);
  
  pinMode(goldPin, OUTPUT);
  pinMode(rosePin, OUTPUT);
  pinMode(frostPin, OUTPUT);
  // Using INPUT_PULLUP is safer if you don't have an external resistor
  pinMode(buttonPin, INPUT_PULLUP); 
}

void loop() {
  // --- PART 1: RECEIVE FROM P5.JS ---
  if (Serial.available() > 0) {
    // Look for the start of the LED command
    if (Serial.find("L:")) {
      int goldVal = Serial.parseInt();
      int roseVal = Serial.parseInt();
      int frostVal = Serial.parseInt();

      analogWrite(goldPin, goldVal); 
      analogWrite(rosePin, roseVal);
      analogWrite(frostPin, frostVal);
    }
  }

  // --- PART 2: SEND TO P5.JS ---
  // If using INPUT_PULLUP, the button is LOW when pressed
  int currentButtonState = digitalRead(buttonPin);
  
  // Logic for a standard button (HIGH when pressed):
  if (currentButtonState == HIGH && lastButtonState == LOW) {
    Serial.println("RELEASE"); 
    // We don't reset LEDs here anymore; we let p5.js send the [0,0,0] 
    // command back so the software and hardware stay in sync.
    delay(200); // Debounce
  }
  
  lastButtonState = currentButtonState;
}