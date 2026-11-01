// p5 createSlider → newline-delimited decimal value → Arduino PWM.
let slider;
let port = null;
let writer = null;
let busy = false;
let sending = false;
let pending = null;
const encoder = new TextEncoder();
const statusText = (text) => { document.querySelector('#status').textContent = text; };

function setup() {
  createCanvas(640, 250).parent('preview');
  slider = createSlider(0, 255, 0, 1);
  slider.id('brightness');
  slider.parent('slider');
  slider.input(updateBrightness);
  for (const [label, value] of [['끄기', 0], ['25%', 64], ['50%', 128], ['최대', 255]]) {
    createButton(label).parent('presets').mousePressed(() => {
      slider.value(value);
      updateBrightness();
    });
  }
  document.querySelector('#connect').addEventListener('click', toggleConnection);
  if (!('serial' in navigator) || !window.isSecureContext) {
    document.querySelector('#connect').disabled = true;
    statusText('미리보기 전용 · PC Chrome/Edge에서 HTTPS 또는 localhost로 실행하세요.');
  } else {
    navigator.serial.addEventListener('disconnect', () => {
      if (port) disconnect('USB 연결이 해제되었습니다. 다시 연결하세요.');
    });
  }
  // Latest-value queue: do not accumulate obsolete slider positions.
  setInterval(flushValue, 50);
}

function draw() {
  const value = Number(slider.value());
  background('#121b24');
  noStroke();
  for (let size = 180; size > 60; size -= 8) {
    fill(130, 255, 181, (value / 255) * 7);
    circle(320, 108, size);
  }
  fill(lerpColor(color('#293c36'), color('#adffca'), value / 255));
  circle(320, 108, 62);
  fill('#c9d9e4');
  textAlign(CENTER);
  textSize(14);
  text(`PWM ${value} / 255`, 320, 195);
  textSize(11);
  text(port && !busy ? '전송값 미리보기 · 실제 밝기는 LED에서 확인' : '화면 미리보기 · 장치 미연결', 320, 221);
}

function updateBrightness() {
  const value = Number(slider.value());
  document.querySelector('#value').textContent = `${value} / 255 · ${Math.round(value / 255 * 100)}%`;
  if (writer && !busy) pending = value;
}

async function flushValue() {
  if (!writer || busy || sending || pending === null) return;
  sending = true;
  const value = pending;
  pending = null;
  try {
    await writer.write(encoder.encode(`${value}\n`));
  } catch (error) {
    // Release sending before cleanup to avoid waiting for ourselves.
    sending = false;
    await disconnect(`전송 실패: ${error.message} · USB와 포트를 확인하세요.`);
  } finally {
    sending = false;
  }
}

async function toggleConnection() {
  if (busy) return;
  if (port) { await disconnect('연결 해제 · 미리보기 모드'); return; }
  busy = true;
  const button = document.querySelector('#connect');
  button.disabled = true;
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    statusText('보드 초기화 대기 중…');
    // Uno resets when its serial port opens.
    await new Promise(resolve => setTimeout(resolve, 2000));
    button.textContent = '연결 해제';
    pending = Number(slider.value());
    statusText('연결됨 · 슬라이더 값 전송 중 (9600 baud)');
  } catch (error) {
    if (writer) { writer.releaseLock(); writer = null; }
    if (port) { try { await port.close(); } catch (_) {} }
    port = null;
    statusText(error.name === 'NotFoundError' ? '포트 선택 취소 · 미리보기 모드' : `연결 실패: ${error.message} · 시리얼 모니터를 닫으세요.`);
  } finally {
    busy = false;
    button.disabled = false;
  }
}

async function disconnect(message) {
  if (busy) return;
  busy = true;
  pending = null;
  const button = document.querySelector('#connect');
  button.disabled = true;
  try {
    while (sending) await new Promise(resolve => setTimeout(resolve, 10));
    if (writer) {
      try { await writer.write(encoder.encode('0\n')); } catch (_) {}
      writer.releaseLock();
      writer = null;
    }
    if (port) { try { await port.close(); } catch (_) {} }
  } finally {
    port = null;
    busy = false;
    button.disabled = false;
    button.textContent = '아두이노 연결';
    statusText(message);
  }
}
