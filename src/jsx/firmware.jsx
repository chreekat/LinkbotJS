"use strict";

var config = require('./config.jsx');
var Version = require('./version.jsx');

var CHECK_INTERVAL = 60000; // Every minute.

// Split a filename into its stem and extension, if present. The extension's
// dot is retained to distinguish no extension from an empty extension.
// Examples:
// 'a.b.c' -> { stem: 'a.b', extension: '.c' }
// 'a.'    -> { stem: 'a',   extension: '.' }
// 'a'     -> { stem: 'a',   extension: null }
function splitFilename (a) {
    var i = a.lastIndexOf('.');
    return i > 0
           ? { stem: a.slice(0, i), extension: a.slice(i) }
           : { stem: a.slice(0),    extension: null };
}

// Generate a list of file stems which prefix both .hex and .eeprom files. For
// example, ['a', 'b.hex', 'c.eeprom', 'd.hex', 'd.eeprom'] would yield ['d'],
// because it is the only file stem which begins both the name of a .hex and a
// .eeprom file.
function firmwareFileStems (firmwareFiles) {
    // First, take a roll call of all .eeprom and .hex files. Do so with a map
    // of file stems to bitsets, where bit zero records the presence of a
    // stem.hex file and bit one records the presence of a stem.eeprom file.
    var fws = {};
    firmwareFiles.map(splitFilename)
                 .forEach(function (file) {
        if (!file.stem in fws) {
            fws[file.stem] = 0;
        }
        fws[file.stem] |= Number(file.extension === '.hex');
        fws[file.stem] |= Number(file.extension === '.eeprom') << 1;
    });

    // Firmware which are valid are those which have both a .hex file and a
    // .eeprom file.
    var stems = [];
    for (var stem in fws) {
        if (fws.hasOwnProperty(stem)) {
            // fws[stem] will be 1<<0 | 1<<1 == 3 if both a .hex and .eeprom
            // were found.
            if (fws[stem] == 3) {
                stems.push(stem);
            }
        }
    }

    return stems;
}

// Array of Versions, each representing a complete pair of firmware files.
function localVersionList () {
    // Strings with a 'v' prefix lose their prefix. Strings without a 'v'
    // prefix become null.
    var dropV = function (s) { return /^v/.test(s) ? s.slice(1) : null; };
    return firmwareFileStems(asyncBaroboBridge.listFirmwareFiles())
        .map(dropV)
        .map(Version.fromString)
        .filter(Boolean);
}

// True if we have a given version in stock on the hard drive.
function localVersionExists (v) {
    return localVersionList().some(function (x) { return x.eq(v); });
}

function latestVersion () {
    var lv = localVersionList().reduce(Version.max);
    var lrfv = Version.fromString(config.get('latestRemoteFirmwareVersion'));
    // If the remote firmware repository considers lrfv the latest version, and
    // we have it in stock, it overrides any other version we have in stock.
    if (localVersionExists(lrfv)) {
        lv = lrfv;
    }
    return lv;
}

function startUpdater () {
    var version = latestVersion();
    var hexFile = 'v' + version + '.hex';
    var eepromFile = 'v' + version + '.eeprom';
    asyncBaroboBridge.firmwareUpdate(version, hexFile, eepromFile);
}

function responseHandler(e) {
    var json = JSON.parse(this.responseText);
    var version = asyncBaroboBridge.linkbotLabsVersion();
    if (version) {
        var firmwareArray = json['linkbotlabs-firmware'][version.major + '.' + version.minor + '.'  +version.patch];
        if (!config.set('latestRemoteFirmwareVersion', firmwareArray[0])) {
            console.warn('Unable to set latestRemoteFirmwareVersion in config');
        }
        console.log('Firmware: ' + firmwareArray[0]);
        console.log('Hex MD5: ' + json['firmware-md5sums'][firmwareArray[0]]['hex']);
        console.log('Eeprom MD5: ' + json['firmware-md5sums'][firmwareArray[0]]['eeprom']);
        var v = new Version(firmwareArray[0].split('.'));
        // Only download if we don't already have this version.
        if (!localVersionExists(v)) {
            asyncBaroboBridge.saveFirmwareFile({
                url: 'http://' + location.host + '/firmware/v' + firmwareArray[0] + '.hex',
                md5sum: json['firmware-md5sums'][firmwareArray[0]]['hex']
            });
            asyncBaroboBridge.saveFirmwareFile({
                url: 'http://' + location.host + '/firmware/v' + firmwareArray[0] + '.eeprom',
                md5sum: json['firmware-md5sums'][firmwareArray[0]]['eeprom']
            });
        }
        scheduleFirmwareUpdateCheck(CHECK_INTERVAL);
    }
}

function errorResponseHandler(e) {
    // re-try request after 10 seconds.
    console.warn('Error occurred attempting to download the firmware.');
    scheduleFirmwareUpdateCheck(10000);
}

function scheduleFirmwareUpdateCheck(delay) {
    console.log('Scheduling firmware check in ' + delay + 'ms');
    if (!config.set('nextCheck', Date.now() + delay)) {
        console.warn('Unable to set nextCheck in configuration');
    }
    setTimeout(checkForFirmwareUpdate, delay);
}

function checkForFirmwareUpdate() {
    var request = new XMLHttpRequest();
    request.addEventListener("load", responseHandler);
    request.addEventListener("error", errorResponseHandler);
    request.open('GET', '/firmware/metadata.json');
    request.send();
}

// Clamp x to the range a <= x <= b
function clamp (x, a, b) {
    return Math.min(Math.max(x, a), b);
}

// Schedule a firmware update check immediately on page load
var nextCheck = config.get('nextCheck');
if (typeof nextCheck === 'undefined') {
    nextCheck = Date.now();
}

// Clamp the delay so drastic changes in the user's system clock
// don't screw things up
var delay = clamp(nextCheck - Date.now(), 0, CHECK_INTERVAL);
scheduleFirmwareUpdateCheck(delay);


module.exports.latestVersion = latestVersion;
module.exports.startUpdater = startUpdater;