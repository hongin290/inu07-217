// Arduino Uno: D9 -> 220–330 ohm resistor -> LED anode (+).
// LED cathode (-) -> GND. Incoming protocol: "0\n" through "255\n".
const byte LED_PIN = 9;
char buffer[4];
byte length = 0;
bool invalid = false;
unsigned long lastReceived = 0;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  analogWrite(LED_PIN, 0);
  Serial.begin(9600);
}

void loop() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    lastReceived = millis();
    if (c == '\n') {
      if (!invalid && length > 0) {
        buffer[length] = '\0';
        int value = atoi(buffer);
        if (value <= 255) analogWrite(LED_PIN, value);
      }
      length = 0;
      invalid = false;
    } else if (c != '\r') {
      if (c >= '0' && c <= '9' && length < 3) buffer[length++] = c;
      else invalid = true;
    }
  }
  // Discard incomplete messages; preserve the most recent valid brightness.
  if ((length > 0 || invalid) && millis() - lastReceived > 1000) {
    length = 0;
    invalid = false;
  }
}
