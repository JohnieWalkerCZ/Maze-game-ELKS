import * as radio from "simpleradio";
import * as gpio from "gpio";
const BUTTON_PREVIOUS = 18;
const BUTTON_ENTER = 16;
const BUTTON_NEXT = 42;
const LED_GREEN = 17;
const LED_YELLOW = 15;
const LED_RED = 45;
const LED_BLUE = 46;
const radioGroup = 9;
radio.begin(radioGroup);
gpio.pinMode(BUTTON_PREVIOUS, gpio.PinMode.INPUT);
gpio.pinMode(BUTTON_ENTER, gpio.PinMode.INPUT);
gpio.pinMode(BUTTON_NEXT, gpio.PinMode.INPUT);
gpio.pinMode(LED_GREEN, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_YELLOW, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_RED, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_BLUE, gpio.PinMode.OUTPUT);
gpio.write(LED_GREEN, 1);
var index = 0;
let selectionColors = { 0: 'up', 1: 'left', 2: 'down', 3: 'right' };
let selectionLeds = { 0: LED_GREEN, 1: LED_YELLOW, 2: LED_RED, 3: LED_BLUE };
gpio.on("falling", BUTTON_PREVIOUS, () => {
    if (index > 0) {
        gpio.write(selectionLeds[index], 0);
        index -= 1;
        gpio.write(selectionLeds[index], 1);
    }
    else if (index == 0) {
        gpio.write(selectionLeds[index], 0);
        index = 3;
        gpio.write(selectionLeds[index], 1);
    }
});
gpio.on("falling", BUTTON_ENTER, () => {
    submitSelection(index);
});
gpio.on("falling", BUTTON_NEXT, () => {
    if (index < 3) {
        gpio.write(selectionLeds[index], 0);
        index += 1;
        gpio.write(selectionLeds[index], 1);
    }
    else if (index == 3) {
        gpio.write(selectionLeds[index], 0);
        index = 0;
        gpio.write(selectionLeds[index], 1);
    }
});
function submitSelection(index) {
    console.log(index);
    console.log(selectionColors[index]);
    //radio.sendString(selectionColors[index]);
    radio.sendKeyValue(radio.address(), index);
}
radio.on('keyvalue', (key, value) => {
    //pokud value neni tvoje hlas, tak odesli nahradni
    if (radio.address() == key) {
        console.log('Jsem to ja');
        if (value != index) {
            console.log('Spatny hlas');
            radio.sendString(selectionColors[index]);
        }
        else {
            console.log('Overeno');
        }
    }
    console.log(radio.address());
    console.log(key + ' sent ' + value);
});
//Joystick
import * as adc from "adc";
const JOYSTICK_X_PIN = 6;
const JOYSTICK_Y_PIN = 4;
const JOYSTICK_SUBMIT_PIN = 38;
adc.configure(JOYSTICK_X_PIN);
adc.configure(JOYSTICK_Y_PIN);
gpio.pinMode(JOYSTICK_SUBMIT_PIN, gpio.PinMode.INPUT_PULLDOWN);
var joystick_x;
var joystick_y;
var direction_strengths = [0, 0, 0, 0];
var strongest_i;
var strongest_value;
var strongest_unique;
setInterval(() => {
    joystick_x = adc.read(JOYSTICK_X_PIN);
    joystick_y = adc.read(JOYSTICK_Y_PIN);
    direction_strengths[0] = 256 - joystick_y; // Strength up -- if positive, may be selected; if negative, joystick in dead zone
    direction_strengths[1] = 256 - joystick_x; // Left
    direction_strengths[2] = joystick_y - 768; // Down
    direction_strengths[3] = joystick_x - 768; // Right
    strongest_i = 0;
    strongest_value = -1024;
    strongest_unique = false;
    for (let i = 0; i < 4; i++) {
        if (direction_strengths[i] > strongest_value) {
            strongest_value = direction_strengths[i];
            strongest_i = i;
            strongest_unique = true;
        }
        else if (direction_strengths[i] == strongest_value) {
            strongest_unique = false;
        }
    }
    if ((strongest_value > 0) && strongest_unique)
        if (strongest_i != index) {
            gpio.write(selectionLeds[index], 0);
            index = strongest_i;
            gpio.write(selectionLeds[index], 1);
        }
}, 50);
gpio.on("rising", JOYSTICK_SUBMIT_PIN, () => {
    submitSelection(index);
    //console.log("submitted");
});
