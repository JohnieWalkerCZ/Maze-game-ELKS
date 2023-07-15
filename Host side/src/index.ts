import * as radio from "simpleradio";
import * as gpio from "gpio";
import * as serial from './libs/simpleserial.js';

const LED_GREEN = 17;
const LED_YELLOW = 15;
const LED_RED = 45;
const LED_BLUE = 46;

const TIME_TO_SEND_MOVE = 2000;
const TIME_TO_UPDATE_VOTES = 100;

const radioGroup = 9;
radio.begin(radioGroup);

gpio.pinMode(LED_GREEN, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_YELLOW, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_RED, gpio.PinMode.OUTPUT);
gpio.pinMode(LED_BLUE, gpio.PinMode.OUTPUT);

let possibleVotes: string[] = ['up', 'left', 'down', 'right'];
let selectionColors = { 0: 'up', 1: 'left', 2: 'down', 3: 'right' };

//'playerAddress' : 'vote'
let playerVotes = {}

async function blinkLed(pin: number) {
    gpio.write(pin, 1);
    await sleep(100);
    gpio.write(pin, 0);
}

radio.on('keyvalue', (key, value, info) => {
    if (possibleVotes.includes(selectionColors[value])) {
        let vote = selectionColors[value];

        switch (vote) {
            case 'up':
                blinkLed(LED_GREEN);
                break;
            case 'left':
                blinkLed(LED_YELLOW);
                break;
            case 'down':
                blinkLed(LED_RED);
                break;
            case 'right':
                blinkLed(LED_BLUE);
                break;
        };

        if (playerVotes[key] != vote) {
            playerVotes[key] = vote;
            radio.sendKeyValue(info.address, selectionColors[vote]);
        } else {

        }
    } else {

    }
});

function countVotes(votes) {

    var upVotes = 0;
    var leftVotes = 0;
    var downVotes = 0;
    var rightVotes = 0;

    for (let vote in votes) {
        switch (votes[vote]) {
            case 'up':
                upVotes++;
                break;
            case 'left':
                leftVotes++;
                break;
            case 'down':
                downVotes++;
                break;
            case 'right':
                rightVotes++;
                break;
        };
    }

    let biggestKey = 'no vote';
    if (upVotes > 0 || leftVotes > 0 || downVotes > 0 || rightVotes > 0) {
        biggestKey = getBiggestKey({ 'up': upVotes, 'left': leftVotes, 'down': downVotes, 'right': rightVotes });
    }

    return [biggestKey, { 0: upVotes, 1: leftVotes, 2: downVotes, 3: rightVotes }];
}

function getBiggestKey(obj) {
    return Object.keys(obj).reduce(function (a, b) { return obj[a] > obj[b] ? a : b })
}

serial.sendStringToSerial('TEST');


setInterval(() => {
    let winner = countVotes(playerVotes)[0];
    if (winner) {
        serial.sendStringToSerial(winner);
    }
}, TIME_TO_SEND_MOVE);

setInterval(() => {
    let votes = countVotes(playerVotes)[1];
    serial.sendStringToSerial(JSON.stringify(votes));
}, TIME_TO_UPDATE_VOTES);