#include <EEPROMWearLevel.h>

// Pin connected to the reed contact (also conveniently doubles as connected to the LED, making it an activity indicator)
const int inputPin = 13; 
int lastState = LOW; 
int currentState;

#define EEPROM_LAYOUT_VERSION 0
#define EEPROM_VAR_COUNT 1
#define IMPULSE_COUNT_EEPROM_IDX 0

unsigned long impulseCount = 0;


void setup() {
  Serial.begin(9600);
  while (!Serial)
    ;

  EEPROMwl.begin(EEPROM_LAYOUT_VERSION, EEPROM_VAR_COUNT);

  Serial.println("Reading impulseCount from EEPROM..");
  EEPROMwl.get(IMPULSE_COUNT_EEPROM_IDX, impulseCount);
  Serial.print(F("impulseCount: "));
  Serial.println(impulseCount);

  pinMode(inputPin, INPUT_PULLUP);
  lastState = digitalRead(inputPin);
}

void loop() {
  currentState = digitalRead(inputPin);

  if (currentState != lastState) {
    lastState = currentState;

    if (currentState == HIGH) {
      impulseCount++;

      Serial.print(F("impulseCount: "));
      Serial.println(impulseCount);

      if (impulseCount % 10 == 0) {
        EEPROMwl.put(IMPULSE_COUNT_EEPROM_IDX, impulseCount);

        Serial.println("Persisted impulseCount to EEPROM");
      }
    }
  }

  delay(50);
}
