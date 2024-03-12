"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProceedingCodeLine = exports.ConstantLine = void 0;
var ConstantLine = /** @class */ (function () {
    function ConstantLine(column, _length, speed) {
        if (_length === void 0) { _length = 10; }
        if (speed === void 0) { speed = 1; }
        this._symbols = [];
        this._lastTimeStamp = 0;
        this.finished = false;
        this._column = column;
        this._maxLength = _length;
        this._currentRow = -1;
        this._updateInterval = 1000 / speed;
        this.initializeSymbols();
    }
    ConstantLine.prototype.initializeSymbols = function () {
        for (var i = 0; i < this._maxLength; i++) {
            this._symbols.push(getRandomSymbol());
        }
    };
    ConstantLine.prototype.update = function (ctx, timeStamp) {
        if (this.finished ||
            timeStamp - this._lastTimeStamp < this._updateInterval) {
            return;
        }
        this._currentRow++;
        if (this._currentRow > setup.rows + this._maxLength) {
            this.finished = true;
            return;
        }
        this._lastTimeStamp = timeStamp;
    };
    ConstantLine.prototype.draw = function (ctx) {
        for (var i = 0; i < this._symbols.length; i++) {
            var symbol = this._symbols[i];
            var posY = this._currentRow - this._symbols.length + i;
            var opacity = i / this._symbols.length;
            i == this._symbols.length - 1
                ? drawLeadingSymbol(ctx, symbol, this._column, posY, opacity)
                : drawSymbol(ctx, symbol, this._column, posY, opacity);
        }
    };
    return ConstantLine;
}());
exports.ConstantLine = ConstantLine;
var ProceedingCodeLine = /** @class */ (function () {
    function ProceedingCodeLine(column, _length, speed, startRow) {
        if (_length === void 0) { _length = 10; }
        if (speed === void 0) { speed = 1; }
        if (startRow === void 0) { startRow = -1; }
        this._symbols = [];
        this._lastTimeStamp = 0;
        this.finished = false;
        this._column = column;
        this._maxLength = _length;
        this._currentRow = startRow == -1 ? -_length : startRow;
        this._updateInterval = 1000 / speed;
    }
    ProceedingCodeLine.prototype.update = function (ctx, timeStamp) {
        if (this.finished ||
            timeStamp - this._lastTimeStamp < this._updateInterval) {
            return;
        }
        var symbol = getRandomSymbol();
        this._symbols.push(symbol);
        if (this._symbols.length > this._maxLength) {
            this._symbols.shift();
        }
        this._currentRow++;
        if (this._currentRow > setup.rows + this._maxLength) {
            this.finished = true;
            return;
        }
        for (var i = 0; i < replacementFactor; i++) {
            this.replaceRandomChar();
        }
        this._lastTimeStamp = timeStamp;
    };
    ProceedingCodeLine.prototype.draw = function (ctx) {
        for (var i = 0; i < this._symbols.length; i++) {
            var symbol = this._symbols[i];
            var posY = this._currentRow - this._symbols.length + i;
            var opacity = i / this._symbols.length;
            i == this._symbols.length - 1
                ? drawLeadingSymbol(ctx, symbol, this._column, posY, opacity)
                : drawSymbol(ctx, symbol, this._column, posY, opacity);
        }
    };
    ProceedingCodeLine.prototype.replaceRandomChar = function () {
        var index = Math.floor(Math.random() * this._symbols.length);
        this._symbols[index] = getRandomSymbol();
    };
    return ProceedingCodeLine;
}());
exports.ProceedingCodeLine = ProceedingCodeLine;
var getRandomSymbol = function () {
    var sets = [latinSet, numbersSet, katakanaSet];
    var randomSet = sets[Math.floor(Math.random() * sets.length)];
    var randomIndex = Math.floor(Math.random() * randomSet.length);
    return randomSet[randomIndex];
};
