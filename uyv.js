const uyvType = {};
uyvType.Image = HTMLImageElement;
uyvType.ImageData = ImageData;
function uyvIsNumber(value) {
  return typeof value === "number" && isFinite(value);
}
uyvType.SetBit = function(value) {
  return value ? 1 : 0;
};
uyvType.NormalizeBits = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeBits);
  } else {
    return uyvType.SetBit(value);
  }
};
uyvType.SetUint8 = function(value) {
  return Math.max(0, Math.min(255, Math.floor(value)));
};
uyvType.NormalizeUint8s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint8s);
  } else {
    return uyvType.SetUint8(value);
  }
};
uyvType.SetUint16 = function(value) {
  return Math.max(0, Math.min(65535, Math.floor(value)));
};
uyvType.NormalizeUint16s = function(value) {
  if (Array.isArray(value)) {
    return value.map(uyvType.NormalizeUint16s);
  } else {
    return uyvType.SetUint16(value);
  }
};
const uyvInfinity = Number.MAX_VALUE;
const uyvInfinityMax = Number.MAX_VALUE;
const uyvInfinityMin = Number.MIN_VALUE;
let uyvWidth;
let uyvHeight;
let uyvCurrentFillColor = null;
let uyvCurrentStrokeColor = null;
let uyvCurrentStrokeWeight = 1;
let uyvDeltaTime = 0;
let uyvPrevTimestamp = 0;
let uyvKey = "";
// Main Functions Start --------------------------------------------------------
/**
 * Creates the main drawing canvas. It should only be
 * called once at the beginning of uyvStart()
 * @returns {{canvas: CanvasRenderingContext2D, screen: HTMLCanvasElement}}
 *
 * @param {uyvType.uint16} w
 * @param {uyvType.uint16} h
 */
function uyvCreateScreen(w, h) {
  /** @type {HTMLCanvasElement | null} */
  const canvas = document.createElement("canvas");
  canvas.id = "uyvCanvas";
  if (canvas === null) {
    throw new Error("No canvas with id uyvCanvas is found");
  }
  if (w < 0 || w > 7680) {
    throw new Error("Screen width needs to be between 0 and 7680 (inclusive)");
  }
  if (h < 0 || h > 4320) {
    throw new Error("Screen height needs to be between 0 and 4320 (inclusive)");
  }
  canvas.width = w;
  canvas.height = h;
  document.body.appendChild(canvas);
  const uyvCanvasCtx = canvas.getContext("2d");
  if (uyvCanvasCtx === null) {
    throw new Error("2D context error.");
  }
  const uyvScreen = canvas;
  uyvWidth = uyvCanvasCtx.canvas.width;
  uyvHeight = uyvCanvasCtx.canvas.height;
  return { canvas: uyvCanvasCtx, screen: uyvScreen };
}
function uyvInitializeEngine() {
  if (typeof window.uyvPreLoad === "function") {
    Promise.resolve(window.uyvPreLoad())
      .then(() => {
        uyvStartEngine();
      })
      .catch((error) => {
        console.error("Error in uyvPreLoad:", error);
      });
  } else {
    uyvStartEngine();
  }
}
function uyvHandleKeyDown(e) {
  uyvKey = e.key;
  if (typeof window.uyvKeyDown === "function") {
    window.uyvKeyDown();
  }
}
function uyvHandleKeyUp(e) {
  const releasedKey = e.key;
  if (typeof window.uyvKeyUp === "function") {
    uyvKey = releasedKey;
    window.uyvKeyUp();
  }
  if (uyvKey === releasedKey) {
    uyvKey = "";
  }
}
/**
 * Starts the engine by calling uyvStart and initiating the main loop.
 * @ignore
 */
function uyvStartEngine() {
  if (typeof window.uyvStart !== "function") {
    console.error(
      "No uyvStart function defined. Define function uyvStart() in your script.",
    );
    return;
  }
  if (typeof window.uyvUpdate !== "function") {
    console.error(
      "No uyvUpdate function defined. Define function uyvUpdate() in your script.",
    );
    return;
  }
  if (typeof window.uyvDraw !== "function") {
    console.error(
      "No uyvDraw function defined. Define function uyvDraw() in your script.",
    );
    return;
  }
  window.uyvStart();
  window.requestAnimationFrame(uyvMainLoop);
  window.addEventListener("keydown", uyvHandleKeyDown);
  window.addEventListener("keyup", uyvHandleKeyUp);
}
function uyvMainLoop(timestamp) {
  uyvDeltaTime = (timestamp - uyvPrevTimestamp) / 1000;
  uyvPrevTimestamp = timestamp;
  window.uyvUpdate();
  window.uyvDraw();
  window.requestAnimationFrame(uyvMainLoop);
}
function uyvLoadImageAndData(url) {
  const image = new Image();
  image.src = url;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        throw new Error("The browser does not support this game engine.");
      }
      ctx.drawImage(image, 0, 0);
      const imgData = ctx.getImageData(0, 0, image.width, image.height);
      resolve({ image: image, data: imgData });
    };
    image.onerror = reject;
  });
}
function uyvGetWidth(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.width;
}
function uyvGetHeight(uyvCanvasCtx) {
  return uyvCanvasCtx.canvas.height;
}
function uyvTranslate(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.translate(x, y);
}
function uyvScale(uyvCanvasCtx, x, y) {
  uyvCanvasCtx.scale(x, y);
}
class uyvVector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
  }
    static zero() {
    return new uyvVector2D(0, 0);
  }
    static fromAngle( angle) {
    return new uyvVector2D(Math.cos(angle), Math.sin(angle));
  }
    array() {
    return [this.x, this.y];
  }
    div( other) {
    return new uyvVector2D(this.x / other.x, this.y / other.y);
  }
    mult( other) {
    return new uyvVector2D(this.x * other.x, this.y * other.y);
  }
    sub( other) {
    return new uyvVector2D(this.x - other.x, this.y - other.y);
  }
    add( other) {
    return new uyvVector2D(this.x + other.x, this.y + other.y);
  }
    lengthSqrt() {
    return this.x * this.x + this.y * this.y;
  }
    length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
    rotate90() {
    return new uyvVector2D(-this.y, this.x);
  }
    distanceToSqrt( other) {
    return other.sub(this).lengthSqrt();
  }
    distanceTo( other) {
    return other.sub(this).length();
  }
    scale(value) {
    return new uyvVector2D(this.x * value, this.y * value);
  }
    normalize() {
    const len = this.length();
    if (len === 0) {
      return new uyvVector2D(0, 0);
    }
    return new uyvVector2D(this.x / len, this.y / len);
  }
    lerp(other, t) {
    return other.sub(this).scale(t).add(this);
  }
    dot(other) {
    return this.x * other.x + this.y * other.y;
  }
}
function xoshiro128ss(a, b, c, d) {
  return function() {
    let t = b << 9,
      r = b * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    c ^= a;
    d ^= b;
    b ^= c;
    a ^= d;
    c ^= t;
    d = (d << 11) | (d >>> 21);
    return (r >>> 0) / 4294967296;
  };
}
function uyvRandom(min, max) {
  const seedgen = () => (Math.random() * 2 ** 32) >>> 0;
  const rand = xoshiro128ss(seedgen(), seedgen(), seedgen(), seedgen());
  if (!uyvIsNumber(min) || !uyvIsNumber(max)) {
    console.warn("uyvRandom: params have to be numbers.");
    return rand();
  }
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  return rand() * (max - min) + min;
}
function uyvPush(uyvCanvasCtx) {
  uyvCanvasCtx.save();
}
function uyvPop(uyvCanvasCtx) {
  uyvCanvasCtx.restore();
}
function uyvClampRGB(r, g, b) {
  r = uyvType.NormalizeUint8s(r);
  g = uyvType.NormalizeUint8s(g);
  b = uyvType.NormalizeUint8s(b);
  return { r: r, g: g, b: b };
}
function uyvClampConvertRgbHexString(r, g, b) {
  const color = uyvClampRGB(r, g, b);
    const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}
function uyvNormalizeAlpha(val) {
  return Math.max(0, Math.min(1, val / 255));
}
function uyvFill(uyvCanvasCtx, r, g, b, a = 255) {
  a = uyvNormalizeAlpha(uyvType.SetUint8(a));
  uyvCurrentFillColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.fillStyle = uyvCurrentFillColor;
}
function uyvNoFill() {
  uyvCurrentFillColor = null;
}
function uyvStroke(uyvCanvasCtx, r, g, b, a = 255) {
  a = uyvNormalizeAlpha(uyvType.SetUint8(a));
  uyvCurrentStrokeColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  uyvCanvasCtx.strokeStyle = uyvCurrentStrokeColor;
}
function uyvNoStroke() {
  uyvCurrentStrokeColor = null;
}
function uyvStrokeWeight(uyvCanvasCtx, weight) {
  const actualWeight = Math.max(0, weight);
  uyvCurrentStrokeWeight = actualWeight;
  uyvCanvasCtx.lineWidth = actualWeight;
}
function uyvBackground(uyvCanvasCtx, r, g, b) {
  uyvCanvasCtx.fillStyle = uyvClampConvertRgbHexString(r, g, b);
  uyvCanvasCtx.fillRect(
    0,
    0,
    uyvGetWidth(uyvCanvasCtx),
    uyvGetHeight(uyvCanvasCtx),
  );
}
function uyvLine(uyvCanvasCtx, x1, y1, x2, y2) {
  uyvCanvasCtx.beginPath();
  uyvCanvasCtx.moveTo(x1, y1);
  uyvCanvasCtx.lineTo(x2, y2);
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  } else {
    throw new Error("A stroke color is needed to draw a line.");
  }
}
function uyvPoint(uyvCanvasCtx, x, y, radius = 3) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0.0000000009, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
function uyvCircle(uyvCanvasCtx, x, y, radius) {
  uyvCanvasCtx.beginPath();
  const actualRadius = Math.max(0, radius);
  uyvCanvasCtx.arc(x, y, actualRadius, 0, 2 * Math.PI);
  if (uyvCurrentFillColor) {
    uyvCanvasCtx.fill();
  }
  if (uyvCurrentStrokeColor) {
    uyvCanvasCtx.stroke();
  }
}
window.addEventListener("load", function() {
  uyvInitializeEngine();
});
