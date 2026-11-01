# p5 슬라이더로 아두이노 LED 밝기 조절

p5.js의 `createSlider(0, 255, 0, 1)`로 만든 슬라이더 값을 USB 시리얼로 보내 Arduino에 연결한 LED의 밝기를 조절하는 프로젝트입니다.

## 구성과 원리

`p5 슬라이더 → Web Serial API → USB → Arduino → D9 PWM → LED`

- 슬라이더: 0~255, 간격 1. 숫자와 백분율 및 화면 미리보기를 함께 표시합니다.
- 통신: 9600 baud. 예를 들어 128을 선택하면 문자열 `128`과 줄바꿈(`\n`)을 전송합니다.
- Arduino: 줄바꿈으로 메시지를 구분하고 0~255 정수만 `analogWrite(9, value)`에 적용합니다.
- PWM: 빠른 ON/OFF의 켜진 시간 비율을 바꿉니다. 0은 꺼짐, 255는 최대이며 128은 약 50% 듀티비입니다. 사람 눈에 보이는 밝기가 정확히 50%라는 뜻은 아닙니다.
- 별도 시리얼 중계 프로그램 없이 브라우저 Web Serial API를 사용합니다.

## 준비물과 배선

Arduino Uno, USB 데이터 케이블, LED 1개, 220~330Ω 저항 1개, 브레드보드, 점퍼선.

```text
Arduino D9 (~PWM) ── 220~330Ω 저항 ── LED 긴 다리 (+)
Arduino GND      ────────────────── LED 짧은 다리 (-)
PC              ── USB 케이블 ──── Arduino
```

전원을 분리한 상태에서 연결합니다. 저항을 반드시 직렬로 연결합니다. Uno의 내장 13번 LED 대신 외부 LED를 PWM 핀 D9에 연결하세요. 다른 보드는 PWM 지원 핀과 전압을 확인하고 `LED_PIN`을 수정해야 합니다.

## 실행 방법

1. 이 저장소를 다운로드합니다.
2. Arduino IDE에서 `led_brightness/led_brightness.ino`를 엽니다.
3. 보드와 포트를 선택하고 업로드합니다. **시리얼 모니터와 플로터를 닫습니다.**
4. PC의 Chrome 또는 Edge에서 웹 코드를 실행합니다. 아래 방법 중 하나를 사용합니다.
   - [p5 웹 에디터](https://editor.p5js.org/)에 `index.html`, `style.css`, `sketch.js`의 내용을 각각 복사해 실행합니다. 포트 선택이 iframe 정책으로 차단되면 독립된 HTTPS 페이지나 localhost를 사용합니다.
   - 로컬 서버: Python이 설치돼 있으면 프로젝트 폴더에서 `python -m http.server 8000` 실행 후 `http://localhost:8000`에 접속합니다.
   - GitHub Pages: 저장소 Settings → Pages에서 main 브랜치의 루트(`/`)를 게시한 뒤 발급된 HTTPS 주소에 접속합니다.
5. **아두이노 연결**을 누르고 장치 포트를 선택합니다. 약 2초 동안 보드 초기화를 기다립니다.
6. 슬라이더와 빠른 선택 버튼을 조작해 실제 LED를 확인합니다.
7. 끝나면 **연결 해제**를 누릅니다. 해제 직전 0을 전송합니다. 탭을 갑자기 닫으면 마지막 밝기가 남을 수 있으므로 LED를 끄거나 USB를 분리합니다.

p5 라이브러리를 CDN에서 불러오므로 인터넷 연결이 필요합니다. 화면 미리보기는 장치의 실제 밝기를 측정한 결과가 아닙니다.

## 파일

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 구성과 p5 라이브러리 로딩 |
| `style.css` | 반응형 화면 스타일 |
| `sketch.js` | p5 슬라이더, 미리보기, 시리얼 연결과 전송 |
| `led_brightness/led_brightness.ino` | 수신 문자열 검증과 PWM 출력 |

## 완성도를 위한 기능

- 밝기 숫자·백분율·LED 미리보기, 끄기/25%/50%/최대 버튼
- 연결 취소, 포트 사용 중, USB 분리 안내
- 50ms마다 최신 값만 전송하여 오래된 슬라이더 값이 쌓이는 현상 방지
- 비정상 값, 너무 긴 메시지, 불완전한 메시지 처리
- 키보드로 조작 가능한 슬라이더와 상태 안내

## 실제 장치 검증 체크리스트

아래는 사용자가 실물 장치에서 확인해야 할 항목입니다. 아직 실물 검증이나 시연 영상 촬영은 완료하지 않았습니다.

- [ ] Arduino 스케치 컴파일 및 업로드 성공
- [ ] 0: LED 꺼짐 / 64: 약하게 켜짐 / 128: 중간 / 255: 최대
- [ ] 슬라이더를 빠르게 이동해도 마지막 값 적용
- [ ] 연결 해제 시 LED 꺼짐, 재연결 가능
- [ ] USB 분리 후 안내 표시
- [ ] 배선 사진과 0→128→255→0 시연 영상 첨부

## 문제 해결

| 증상 | 확인할 내용 |
| --- | --- |
| 포트를 열 수 없음 | Arduino IDE 시리얼 모니터/플로터 및 다른 연결 탭 닫기 |
| 장치가 목록에 없음 | 충전 전용이 아닌 데이터 케이블, 보드 드라이버와 USB 연결 확인 |
| 밝기가 변하지 않음 | PWM D9 사용 여부, LED 극성, GND, 코드 업로드 확인 |
| 연결 버튼 비활성 | PC Chrome/Edge 및 HTTPS 또는 localhost 사용 |
| 화면이 표시되지 않음 | 인터넷과 p5 CDN 로딩 확인 |

## 참고 자료

- [p5 createSlider](https://p5js.org/reference/p5/createSlider/)
- [Chrome Web Serial API](https://developer.chrome.com/docs/capabilities/serial)
- [Arduino PWM 출력](https://support.arduino.cc/hc/en-us/articles/9350537961500-Use-PWM-output-with-Arduino)

## 제출

GitHub에 위 파일들을 업로드한 후 **저장소 URL**을 과제 댓글로 제출합니다. 안내받은 기한은 11월 2일 월요일 자정까지입니다. 제출 전 실제 장치 검증과 사진·영상 추가를 권장합니다.
