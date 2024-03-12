const latinSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const numbersSet = "0123456789";
const katakanaSet =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

const fontSize = 12;
const fontScale = 1.1;
const tvEffectOffsetR = 0.1;
const tvEffectOffsetC = 0.05;

const blurFactor = 0.125;

const minSpeed = 1;
const maxSpeed = 50;

const concurrentLinesFactor = 3;
const lengthFactor = 1.2;

const replacementFactor = 2;
const pauseFactor = 0.6;

const constantLinesFactor = 0.15;

const gradientBackground = true;

var setup = {
  cWidth: 0,
  cHeight: 0,
  rows: 0,
  cols: 0,
  offsetX: 0,
  offsetY: 0,
  concurrentLines: 0,
};

class RainManager {
  private _lines: ICodeLine[] = [];

  constructor() {
    for (let i = 0; i < setup.concurrentLines; i++) {
      this._lines.push(generateCodeLine());
    }
    console.log(`RainManager: initialized: ${this._lines.length} lines`);
  }

  updateInfo() {
    console.log(
      `RainManager: updating info: starting with ${this._lines.length} lines`
    );
    const linesLeft = setup.concurrentLines - this._lines.length;
    console.log(`RainManager: updating info: ${linesLeft} lines to generate`);
    const newLines = Array.from({ length: linesLeft }, () =>
      generateCodeLine()
    );
    this._lines = [...this._lines, ...newLines];
    console.log(
      `RainManager: updating info: ended with ${this._lines.length} lines`
    );
  }

  update(ctx: CanvasRenderingContext2D, timeStamp: number) {
    // possible after resizing back to lower width
    if (this._lines.length > setup.concurrentLines) {
      this._lines = this._lines.filter((l) => !l.finished);
    }

    for (let i = 0; i < this._lines.length; i++) {
      if (this._lines[i].finished) {
        this._lines[i] = generateCodeLine();
        continue;
      }
      this._lines[i].update(ctx, timeStamp);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this._lines.length; i++) {
      this._lines[i].draw(ctx);
    }
  }
}
interface ICodeLine {
  finished: boolean;
  update(ctx: CanvasRenderingContext2D, timeStamp: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}
class ConstantLine implements ICodeLine {
  private _column: number;
  private _maxLength: number;
  private _currentRow: number;
  private _symbols: string[] = [];
  private _lastTimeStamp: number = 0;
  private _updateInterval: number;

  finished: boolean = false;

  constructor(column: number, _length: number = 10, speed: number = 1) {
    this._column = column;
    this._maxLength = _length;
    this._currentRow = -1;
    this._updateInterval = 1000 / speed;
    this.initializeSymbols();
  }

  private initializeSymbols() {
    for (let i = 0; i < this._maxLength; i++) {
      this._symbols.push(getRandomSymbol());
    }
  }

  update(ctx: CanvasRenderingContext2D, timeStamp: number): void {
    if (
      this.finished ||
      timeStamp - this._lastTimeStamp < this._updateInterval ||
      Math.random() < pauseFactor
    ) {
      return;
    }
    this._currentRow++;
    if (this._currentRow > setup.rows + this._maxLength) {
      this.finished = true;
      return;
    }
    this._lastTimeStamp = timeStamp;
  }
  draw(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this._symbols.length; i++) {
      const symbol = this._symbols[i];
      const posY = this._currentRow - this._symbols.length + i;
      const opacity = i / this._symbols.length;
      i == this._symbols.length - 1
        ? drawLeadingSymbol(ctx, symbol, this._column, posY, opacity)
        : drawSymbol(ctx, symbol, this._column, posY, opacity);
    }
  }
}
class ProceedingCodeLine implements ICodeLine {
  private _column: number;
  private _maxLength: number;
  private _currentRow: number;
  private _symbols: string[] = [];
  private _lastTimeStamp: number = 0;
  private _updateInterval: number;

  finished: boolean = false;

  constructor(
    column: number,
    _length: number = 10,
    speed: number = 1,
    startRow: number = -1
  ) {
    this._column = column;
    this._maxLength = _length;
    this._currentRow = startRow == -1 ? -_length : startRow;
    this._updateInterval = 1000 / speed;
  }

  update(ctx: CanvasRenderingContext2D, timeStamp: number) {
    if (
      this.finished ||
      timeStamp - this._lastTimeStamp < this._updateInterval ||
      Math.random() < pauseFactor
    ) {
      return;
    }
    const symbol = getRandomSymbol();
    this._symbols.push(symbol);
    if (this._symbols.length > this._maxLength) {
      this._symbols.shift();
    }
    this._currentRow++;
    if (this._currentRow > setup.rows + this._maxLength) {
      this.finished = true;
      return;
    }
    for (let i = 0; i < replacementFactor; i++) {
      this.replaceRandomChar();
    }
    this._lastTimeStamp = timeStamp;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this._symbols.length; i++) {
      const symbol = this._symbols[i];
      const posY = this._currentRow - this._symbols.length + i;
      const opacity = i / this._symbols.length;
      i == this._symbols.length - 1
        ? drawLeadingSymbol(ctx, symbol, this._column, posY, opacity)
        : drawSymbol(ctx, symbol, this._column, posY, opacity);
    }
  }

  private replaceRandomChar() {
    const index = Math.floor(Math.random() * this._symbols.length);
    this._symbols[index] = getRandomSymbol();
  }
}

const generateCodeLine = () => {
  // higher chance to start at the top
  const startsAtTop = Math.random() > 0.25;
  const startRow = startsAtTop ? -1 : Math.floor(Math.random() * setup.rows);
  const isConstant = Math.random() < constantLinesFactor;
  return isConstant
    ? new ConstantLine(
        Math.floor(Math.random() * setup.cols),
        Math.floor(Math.random() * 15),
        Math.floor(
          Math.random() * (maxSpeed - maxSpeed * 0.8 + 1) + maxSpeed * 0.8
        )
      )
    : new ProceedingCodeLine(
        Math.floor(Math.random() * setup.cols),
        Math.floor(Math.random() * setup.rows * lengthFactor),
        Math.floor(Math.random() * (maxSpeed - minSpeed + 1) + minSpeed),
        startRow
      );
};

const getRandomSymbol = (): string => {
  const sets = [latinSet, numbersSet, katakanaSet];
  const randomSet = sets[Math.floor(Math.random() * sets.length)];
  const randomIndex = Math.floor(Math.random() * randomSet.length);
  return randomSet[randomIndex];
};
const effectManager = new RainManager();

const init = () => {
  const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d", { alpha: false });

  // throw an error if the context is not available
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  setup = getRowsCols(canvas.width, canvas.height, fontSize);
  effectManager.updateInfo();

  // make the canvas resize with the window
  window.addEventListener("resize", () => {
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

const getRowsCols = (
  width: number,
  height: number,
  fontSize: number
): {
  cWidth: number;
  cHeight: number;
  rows: number;
  cols: number;
  offsetX: number;
  offsetY: number;
  concurrentLines: number;
} => {
  const rows = Math.ceil(height / fontSize) + 1;
  const cols = Math.ceil(width / fontSize) + 1;
  const offsetX = (cols * fontSize - width) / 2;
  const offsetY = (rows * fontSize - height) / 2;
  const concurrentLines = Math.ceil(cols * concurrentLinesFactor);
  console.log(
    `Rows: ${rows}, Cols: ${cols}, OffsetX: ${offsetX}, OffsetY: ${offsetY}, ConcurrentLines: ${concurrentLines}`
  );
  return {
    cWidth: width,
    cHeight: height,
    rows,
    cols,
    offsetX,
    offsetY,
    concurrentLines,
  };
};

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  x: number,
  y: number,
  opacity: number = 1
) {
  ctx.font = `bold ${fontSize * fontScale}px monospace`;
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = "center";
  // "red"
  ctx.fillStyle = `rgba(150, 0, 0, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX - tvEffectOffsetR * fontSize,
    y * fontSize - setup.offsetY - tvEffectOffsetR * fontSize
  );
  // "cyan"
  ctx.fillStyle = `rgba(0, 150, 150, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX + tvEffectOffsetC * fontSize,
    y * fontSize - setup.offsetY + tvEffectOffsetC * fontSize
  );
  // "main"
  ctx.fillStyle = `rgba(83, 164, 96, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX,
    y * fontSize - setup.offsetY
  );
}

function drawLeadingSymbol(
  ctx: CanvasRenderingContext2D,
  symbol: string,
  x: number,
  y: number,
  opacity: number = 1
) {
  ctx.font = `${fontSize * fontScale}px monospace`;
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = "center";
  // "red"
  ctx.fillStyle = `rgba(255, 150, 150, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX - tvEffectOffsetR * fontSize,
    y * fontSize - setup.offsetY - tvEffectOffsetR * fontSize
  );
  // "cyan"
  ctx.fillStyle = `rgba(150, 255, 255, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX + tvEffectOffsetC * fontSize,
    y * fontSize - setup.offsetY + tvEffectOffsetC * fontSize
  );
  // main
  ctx.fillStyle = `rgba(200, 214, 193, ${opacity})`;
  ctx.fillText(
    symbol,
    x * fontSize - setup.offsetX,
    y * fontSize - setup.offsetY
  );
}

function clearFrame(ctx: CanvasRenderingContext2D) {
  if(gradientBackground) {
    const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
    gradient.addColorStop(0, "#000300");
    gradient.addColorStop(0, "#071312");
    gradient.addColorStop(1, "#000300");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  } else {
    // fill the canvas with dark
    ctx.fillStyle = "#071312";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

const updateAnimation = (ctx: CanvasRenderingContext2D, timeStamp: number) => {
  clearFrame(ctx);
  effectManager.update(ctx, timeStamp);
  effectManager.draw(ctx);

  requestAnimationFrame((ts) => updateAnimation(ctx, ts));
};

const start = (ctx: CanvasRenderingContext2D) => {
  console.log("Starting animation");
  requestAnimationFrame((timeStamp) => updateAnimation(ctx, timeStamp));
};

init();
