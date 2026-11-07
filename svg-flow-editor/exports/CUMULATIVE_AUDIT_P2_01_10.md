# 제2부 01~10장 누적 과제 플로우차트 적대적 검증

검토일: 2026-11-07 (KST)
기준: `html-editor/svg-flow-editor/index.html`의 `baseScene()`, `chapters/P2_02.json`~`P2_10.json`, `Yuul-Jung/soc/CURRICULUM.md` 및 `docs/references/digilent-vivado-library.md`.

## 결론
**전체 누적 과제 정합성: FAIL / 재설계 필요.** 이전 SVG 정적 검사 PASS(노드/에지 존재, 색·여백, 문법)는 누적 설계 검증 PASS가 아니다. 02~10장 JSON은 모두 `DESIGN_DRAFT_NOT_CODE_VERIFIED`로 되어 있으며 미검증 상태 유지.

## 중대 문제

### P0 — 01장 기준 도면과 과제 편성 불일치
- 편집기 내 01장 `baseScene()`은 `P2-01 · main() 전체 실행 흐름`, `read_command_line`, `handle_command`, `LED ON/OFF/STATUS`를 나타냄.
- `soc/docs/references/digilent-vivado-library.md`에는 이전 승인 기록으로 P2-01 CdS DO→RTL→LED13, P2-02 FND가 명시됨.
- 최신 `soc/CURRICULUM.md` (2026-11-01)은 P2 과제 순서를 미정이라고 명시함. 이 기록들은 서로 다른 기준일/버전이므로 01장 실제 코드·테스트 기록을 확인하기 전 동등하다고 간주하지 않음.
- 조치: 01장 **실제 성공 소스·커밋·Vitis main/RTL 및 보드 핀 배정**을 단일 기준으로 확정한 다음 02~10장 누적 의존성을 재검증해야 함.

### P0 — 누적 기능의 자료 흐름이 누락
- 현재 02~10장은 전부 7노드/8에지의 같은 추상형 (start→input→decision→action/other→status→repeat).
- 각 장에 '기존 기능 유지'라는 글자는 있으나, 입력 소유권·상태 레지스터·출력 소유권·이전 IP 유지 경로·우선순위·에러 처리·단계별 선행 조건을 시각적으로 검증할 수 없음.
- 특히 `P2-05` CdS는 P2-01 CdS를 기준으로 했을 때 센서의 **중복 신설**처럼 해석됨. 실제로 재사용/자동 제어 연계 과제라면 제목과 도면을 명확히 수정해야 함.

### P0 — 안전 조건/우선순위 부족
- P2-06: HC-SR04 Echo의 5V→3.3V 보호와 timeout/no echo/invalid measurement 경로 필요.
- P2-07: 모터 외부 전원·공통 GND·방향전환 데드타임·정지 우선순위와 위험시 독립 출력 차단 경로 필요.
- P2-08: XADC 0~1V는 **특정 구성의 외부 아날로그 전용 입력 조건**으로서 실제 회로·보드·XADC 설정 확인 없이 모든 입력에 일반화하면 안 됨.
- P2-09/10: 수동 명령이 위험 상태에서 모터를 재가동하지 못하도록 **안전 STOP > 자동·수동 출력요청** 중재 경로와 fault latch/RESET 복구 조건을 명시해야 함.

### P1 — 계층 구조 미구분
- 하드웨어 실시간 처리(센서 동기화, 디바운스, FND multiplex, PWM 카운터, ECHO 타이밍, 모터 인터록)와 MicroBlaze 소프트웨어(명령 구문, 제어 정책, 상태 보고) 및 AXI4-Lite Register Map을 구분하지 않음.
- Top은 핀·wire·인스턴스 연결만 담당해야 하며 새 동작은 Controller/Core에 배치해야 함.

### P1 — 기존 고정 신호/자원 충돌 점검
- BTNC는 기존 Reset으로 유지. BTNU/BTND/BTNL/BTNR 이벤트와 혼동 금지.
- LED14 UART, LED15 Timer heartbeat, FND 각 자리 의미, LED1 PWM·LED2 WARN·LED13 CdS 등은 **실제 기준 프로젝트와 확인 후** 단일 드라이버/출력 소유권 관리.
- 제1부 GPIO/AXI UART Lite/Timer/INTC 및 BRAM·주소맵은 필요 없는 중복 IP 제작이나 임의 수정 금지.

## 장별 필수 누적 연결 체크

| 장 | 새 기능 | 이전 단계 필수 유지 | 검증해야 할 실제 데이터·제어 경로 |
|---|---|---|---|
| 01 | 기준 미확정: UART main 또는 CdS→LED13 이력 충돌 | 제1부 검증 기능 | 소스·커밋과 실제 I/O 확정 |
| 02 | FND 사용자 IP·표시 | 01 및 제1부 GPIO/UART/Timer | 명령/Reg Map→표시 레지스터→4자리 스캔, 자리 의미 |
| 03 | 4개 방향 버튼·IRQ | 01~02 | sync/debounce/short/long→status/IRQ→SW handler |
| 04 | 독립 PWM Controller | 01~03 | shadow 설정→주기 경계 commit→PWM 출력, 기존 GPIO 충돌 방지 |
| 05 | CdS 자동 조명 연계/재사용 여부 확인 | 01~04 | 입력 극성→동기화→Auto 조건→PWM 요청, 수동/자동 소유권 |
| 06 | 초음파 거리·경보 | 01~05 | TRIG/ECHO→유효거리/timeout→WARN/표시, 5V 보호 |
| 07 | DC 모터 | 01~06 | 모터 명령→안전 중재→데드타임→드라이버, 경보 시 STOP |
| 08 | XADC 입력 | 01~07 | 범위 보호→변환 유효성→ADC 값→상태/PWM |
| 09 | MODE AUTO/MANUAL | 01~08 | UART/버튼/타이머 IRQ→모드 정책→모든 출력 소유권/안전 우선 |
| 10 | 통합 안전 캡스톤 | 01~09 전부 | sensor validity + fault latch→safety arbitration→RUN/STOP→상태 |

## 수정 판단 기준
1. 01장 성공 소스·과제 번호 대조 전에는 02~10장 JSON/SVG의 기능 명칭을 임의로 확정·덮어쓰지 않는다.
2. 도면은 '기능 추가 + 기존 유지' 두 경로를 명시하고, **CPU/AXI IP/RTL Core/Board I/O**를 구획한다.
3. 모든 장에 공통인 인터럽트·Reset·출력 소유권·상태 피드백 연결을 드러낸다.
4. 단계별 `CUMULATIVE_CONTRACT`(유지 기능/신규 기능/핀/주소맵/테스트)을 만든 후 다이어그램 자동검증을 시행한다.
5. 정적 SVG 검사와 실제 Vivado/Vitis/RTL/시뮬레이션/보드/브라우저 시각 검증은 별도 PASS/FAIL로 기록한다.

## 현재 상태
- **정적 파일 구조**: 02~10 SVG/JSON 존재 및 형식 검증 PASS.
- **누적 설계 의미 검증**: FAIL (재설계 필요).
- **실제 코드/보드 동등성**: 미확인.
- **01장 원본**: 수정 없음.
