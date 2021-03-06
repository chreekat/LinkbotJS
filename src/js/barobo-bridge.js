/**
 * This class exists for testing outside of Barobo browser.
 */
var asyncBaroboBridge = (function(main) {
    "use strict";
    if (main.asyncBaroboBridge && main.asyncBaroboBridge !== null) {
        return main.asyncBaroboBridge;
    } else {
        var _i, _j, _len, _len1, obj, signals, methods, k;
        methods = ['listFirmwareFiles', 'connectRobot', 'disconnectRobot',
            'getAccelerometer', 'getFormFactor', 'getJointAngles', 'getJointSpeeds', 'getJointStates',
            'getLedColor', 'getVersions', 'resetEncoderRevs', 'setBuzzerFrequency', 'setJointSpeeds',
            'setJointStates', 'setLedColor', 'move', 'moveContinuous', 'moveTo', 'drive', 'driveTo',
            'motorPower', 'stop', 'enableButtonEvents', 'enableEncoderEvents', 'enableJointEvents',
            'enableAccelerometerEvents', 'firmwareUpdate', 'sendRobotPing'];
        signals = ['requestComplete', 'dongleEvent', 'acquire', 'relinquish', 'buttonEvent', 'encoderEvent', 'jointEvent', 'accelerometerEvent',
            'robotEvent', 'connectionTerminated'];
        obj = {
            mock: true
        };
        /*
        var randomInt = function(min,max) {
            return Math.floor(Math.random()*(max-min+1)+min);
        };
        var colorMap = {};
         */
        var emptyFunction = function() { };
        for (_i = 0, _len = methods.length; _i < _len; _i++) {
            k = methods[_i];
            obj[k] = emptyFunction;
        }
        for (_j = 0, _len1 = signals.length; _j < _len1; _j++) {
            k = signals[_j];
            obj[k] = {
                connect: emptyFunction,
                disconnect: emptyFunction
            };
        }
        obj.enumerationConstants = function() {
            return {
                Button: { A: 1, B: 2, POWER: 0},
                ButtonState: { DOWN:1, UP: 0},
                FormFactor: {I:0, L: 1, T: 2},
                JointState: {FAIL: 3, HOLD: 1, MOVING: 2, STOP: 0}
            };
        };
        obj.listFirmwareFiles = function() {
            return ["v4.4.6.eeprom", "v4.4.6.hex"];
        };
        obj.configuration = {};
        /*
        obj.getLEDColor = function(id) {
            if (!colorMap[id]) {
                colorMap[id] = {red:randomInt(0,255), green:randomInt(0,255), blue:randomInt(0,255)};
            }
            return colorMap[id];
        };
        obj.setLEDColor = function(id, r, g, b) {
            colorMap[id] = {red:r, green:g, blue:b};
        };
        */
        return obj;
    }
})(this);
