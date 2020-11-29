"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.writeFile = exports.escapeForHtml = exports.readFileAndConvertToHtml = exports.readFile = exports.readdirSync = exports.stringify = exports.logError = exports.logWarning = exports.logInfo = void 0;
var dom = require("./domAdapter");
var fs = require("fs");
var fs_1 = require("fs");
function logInfo(message) {
    log('Info: ' + message, 'grey');
}
exports.logInfo = logInfo;
function logWarning(message) {
    log('WARNING: ' + message, 'orange');
}
exports.logWarning = logWarning;
function logError(message) {
    log('ERROR: ' + message, 'red');
    throw new Error(message);
}
exports.logError = logError;
function log(message, color) {
    return __awaiter(this, void 0, void 0, function () {
        var division;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(message);
                    division = '<div style="color:' + color + '">' + escapeForHtml(message) + '</div>';
                    return [4 /*yield*/, dom.addContentTo('log', division)];
                case 1:
                    _a.sent();
                    dom.scrollToBottom('log');
                    return [2 /*return*/];
            }
        });
    });
}
function stringify(object) {
    var stringifiedObject = object + ': ';
    for (var key in object) {
        //if(typeof rect[key] !== 'function') {
        stringifiedObject += key + '=' + object[key] + '; ';
        //}
    }
    return stringifiedObject;
}
exports.stringify = stringify;
function readdirSync(path) {
    return fs.readdirSync(path, { withFileTypes: true });
}
exports.readdirSync = readdirSync;
function readFile(path) {
    return fs_1.promises.readFile(path, 'utf-8');
}
exports.readFile = readFile;
function readFileAndConvertToHtml(path, callback) {
    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) {
            logError('util::readFile, ' + path + ', ' + err.message);
        }
        else {
            callback(escapeForHtml(data));
        }
    });
}
exports.readFileAndConvertToHtml = readFileAndConvertToHtml;
function escapeForHtml(text) {
    var content = '';
    for (var i = 0; i < text.length; i++) {
        // TODO this is maybe very inefficient
        content += escapeCharForHtml(text[i]);
    }
    return content;
}
exports.escapeForHtml = escapeForHtml;
function escapeCharForHtml(c) {
    switch (c) {
        case '\\':
            return '&#92;';
        case '\n':
            return '<br/>';
        case '\'':
            return '&#39;';
        case '"':
            return '&quot;';
        case '<':
            return '&lt;';
        case '>':
            return '&gt;';
        case '&':
            return '&amp';
        default:
            return c;
    }
}
function writeFile(path, data) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, fs_1.promises.writeFile(path, data)];
        });
    });
}
exports.writeFile = writeFile;
//# sourceMappingURL=util.js.map