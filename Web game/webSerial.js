function serialInit(usbVendorId, button, callbackFunction) {

    button.addEventListener("click", () => {
        navigator.serial
            .requestPort({ filters: [{ usbVendorId }] })
            .then(async (port) => {
                await port.open({ baudRate: 921600 });
                while (port.readable) {
                    const reader = port.readable.getReader();
                    try {
                        while (true) {
                            const { value, done } = await reader.read();
                            if (done) {
                                console.log('Ended');
                                // |reader| has been canceled.
                                break;
                            }
                            callbackFunction(value);
                            // Do something with |value|...
                        }
                    } catch (error) {
                        // Handle |error|...
                    } finally {
                        reader.releaseLock();
                    }
                }

            })
            .catch((e) => {
                // The user didn't select a port.
            });
    });
}

function readStringFromSerial(value) {
    const START_CHAR = '#';
    const END_CHAR = '&';

    const START_CHAR_ASCII = START_CHAR.charCodeAt(0);
    const END_CHAR_ASCII = END_CHAR.charCodeAt(0);

    let length = value.byteLength;
    let outputBytes = [];
    let previousNum = null;

    for (let i = 0; i < length; i++) {
        if (previousNum == START_CHAR_ASCII) {
            if (value[i] == END_CHAR_ASCII) {
                break;
            }
            outputBytes.push(value[i]);
            //console.log('outputBytes: ' + outputBytes);
        } else {
            previousNum = value[i];
        }
    }

    //console.log(String.fromCharCode(...outputBytes));
    let decodedString = String.fromCharCode(...outputBytes);
    return decodedString;
}