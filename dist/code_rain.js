"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var latinSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var numbersSet = "0123456789";
var katakanaSet = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
var fontSize = 12;
var fontScale = 1.1;
var tvEffectOffsetR = 0.1;
var tvEffectOffsetC = 0.05;
var blurFactor = 0.125;
var minSpeed = 1;
var maxSpeed = 50;
var concurrentLinesFactor = 3;
var lengthFactor = 1.2;
var replacementFactor = 2;
var pauseFactor = 0.6;
var constantLinesFactor = 0.15;
var gradientBackground = true;
var setup = {
    cWidth: 0,
    cHeight: 0,
    rows: 0,
    cols: 0,
    offsetX: 0,
    offsetY: 0,
    concurrentLines: 0,
};
var RainManager = /** @class */ (function () {
    function RainManager() {
        this._lines = [];
        for (var i = 0; i < setup.concurrentLines; i++) {
            this._lines.push(generateCodeLine());
        }
        console.log("RainManager: initialized: ".concat(this._lines.length, " lines"));
    }
    RainManager.prototype.updateInfo = function () {
        console.log("RainManager: updating info: starting with ".concat(this._lines.length, " lines"));
        var linesLeft = setup.concurrentLines - this._lines.length;
        console.log("RainManager: updating info: ".concat(linesLeft, " lines to generate"));
        var newLines = Array.from({ length: linesLeft }, function () {
            return generateCodeLine();
        });
        this._lines = __spreadArray(__spreadArray([], this._lines, true), newLines, true);
        console.log("RainManager: updating info: ended with ".concat(this._lines.length, " lines"));
    };
    RainManager.prototype.update = function (ctx, timeStamp) {
        // possible after resizing back to lower width
        if (this._lines.length > setup.concurrentLines) {
            this._lines = this._lines.filter(function (l) { return !l.finished; });
        }
        for (var i = 0; i < this._lines.length; i++) {
            if (this._lines[i].finished) {
                this._lines[i] = generateCodeLine();
                continue;
            }
            this._lines[i].update(ctx, timeStamp);
        }
    };
    RainManager.prototype.draw = function (ctx) {
        for (var i = 0; i < this._lines.length; i++) {
            this._lines[i].draw(ctx);
        }
    };
    return RainManager;
}());
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
            timeStamp - this._lastTimeStamp < this._updateInterval ||
            Math.random() < pauseFactor) {
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
            timeStamp - this._lastTimeStamp < this._updateInterval ||
            Math.random() < pauseFactor) {
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
var generateCodeLine = function () {
    // higher chance to start at the top
    var startsAtTop = Math.random() > 0.25;
    var startRow = startsAtTop ? -1 : Math.floor(Math.random() * setup.rows);
    var isConstant = Math.random() < constantLinesFactor;
    return isConstant
        ? new ConstantLine(Math.floor(Math.random() * setup.cols), Math.floor(Math.random() * 15), Math.floor(Math.random() * (maxSpeed - maxSpeed * 0.8 + 1) + maxSpeed * 0.8))
        : new ProceedingCodeLine(Math.floor(Math.random() * setup.cols), Math.floor(Math.random() * setup.rows * lengthFactor), Math.floor(Math.random() * (maxSpeed - minSpeed + 1) + minSpeed), startRow);
};
var getRandomSymbol = function () {
    var sets = [latinSet, numbersSet, katakanaSet];
    var randomSet = sets[Math.floor(Math.random() * sets.length)];
    var randomIndex = Math.floor(Math.random() * randomSet.length);
    return randomSet[randomIndex];
};
var effectManager = new RainManager();
var init = function () {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d", { alpha: false });
    // throw an error if the context is not available
    if (!ctx) {
        throw new Error("Canvas context not available");
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setup = getRowsCols(canvas.width, canvas.height, fontSize);
    effectManager.updateInfo();
    // make the canvas resize with the window
    window.addEventListener("resize", function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        setup = getRowsCols(canvas.width, canvas.height, fontSize);
        effectManager.updateInfo();
    });
    if (blurFactor > 0) {
        ctx.shadowBlur = blurFactor * fontSize;
        ctx.shadowColor = "rgba(200, 214, 193, 1)";
    }
    start(ctx);
};
var getRowsCols = function (width, height, fontSize) {
    var rows = Math.ceil(height / fontSize) + 1;
    var cols = Math.ceil(width / fontSize) + 1;
    var offsetX = (cols * fontSize - width) / 2;
    var offsetY = (rows * fontSize - height) / 2;
    var concurrentLines = Math.ceil(cols * concurrentLinesFactor);
    console.log("Rows: ".concat(rows, ", Cols: ").concat(cols, ", OffsetX: ").concat(offsetX, ", OffsetY: ").concat(offsetY, ", ConcurrentLines: ").concat(concurrentLines));
    return {
        cWidth: width,
        cHeight: height,
        rows: rows,
        cols: cols,
        offsetX: offsetX,
        offsetY: offsetY,
        concurrentLines: concurrentLines,
    };
};
function drawSymbol(ctx, symbol, x, y, opacity) {
    if (opacity === void 0) { opacity = 1; }
    ctx.font = "bold ".concat(fontSize * fontScale, "px monospace");
    ctx.imageSmoothingEnabled = true;
    ctx.textAlign = "center";
    // "red"
    ctx.fillStyle = "rgba(150, 0, 0, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX - tvEffectOffsetR * fontSize, y * fontSize - setup.offsetY - tvEffectOffsetR * fontSize);
    // "cyan"
    ctx.fillStyle = "rgba(0, 150, 150, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX + tvEffectOffsetC * fontSize, y * fontSize - setup.offsetY + tvEffectOffsetC * fontSize);
    // "main"
    ctx.fillStyle = "rgba(83, 164, 96, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX, y * fontSize - setup.offsetY);
}
function drawLeadingSymbol(ctx, symbol, x, y, opacity) {
    if (opacity === void 0) { opacity = 1; }
    ctx.font = "".concat(fontSize * fontScale, "px monospace");
    ctx.imageSmoothingEnabled = true;
    ctx.textAlign = "center";
    // "red"
    ctx.fillStyle = "rgba(255, 150, 150, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX - tvEffectOffsetR * fontSize, y * fontSize - setup.offsetY - tvEffectOffsetR * fontSize);
    // "cyan"
    ctx.fillStyle = "rgba(150, 255, 255, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX + tvEffectOffsetC * fontSize, y * fontSize - setup.offsetY + tvEffectOffsetC * fontSize);
    // main
    ctx.fillStyle = "rgba(200, 214, 193, ".concat(opacity, ")");
    ctx.fillText(symbol, x * fontSize - setup.offsetX, y * fontSize - setup.offsetY);
}
function clearFrame(ctx) {
    if (gradientBackground) {
        var gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
        gradient.addColorStop(0, "#000300");
        gradient.addColorStop(0, "#071312");
        gradient.addColorStop(1, "#000300");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
    else {
        // fill the canvas with dark
        ctx.fillStyle = "#071312";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }
}
var updateAnimation = function (ctx, timeStamp) {
    clearFrame(ctx);
    effectManager.update(ctx, timeStamp);
    effectManager.draw(ctx);
    requestAnimationFrame(function (ts) { return updateAnimation(ctx, ts); });
};
var start = function (ctx) {
    console.log("Starting animation");
    requestAnimationFrame(function (timeStamp) { return updateAnimation(ctx, timeStamp); });
};
init();
