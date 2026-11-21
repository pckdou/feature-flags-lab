# 실험 로그

- 작성일: 2026-11-21
- 실행 환경: Node.js, Windows PowerShell
- 모든 사용자, 트래픽, 전환율, 장애 지표는 **시뮬레이션 데이터**입니다.

## 1. 점진적 롤아웃 기록

실행 명령: `$env:APP_ENV="<환경>"; npm start` (사용자 1000명 시뮬레이션)

| 환경 | new_checkout | dark_mode | recommendation_v2 |
|------|:---:|:---:|:---:|
| development | 1000 / 1000 | 1000 / 1000 | 1000 / 1000 |
| staging | 557 / 1000 | 1000 / 1000 | 198 / 1000 |
| production | 186 / 1000 | 409 / 1000 | 1 / 1000 |

### 관찰
- development → staging → production 순으로 활성 사용자가 줄어드는 점진 배포를 확인했다.
- 설정 퍼센트(예: production new_checkout 10%)보다 활성 사용자가 많은 것은 대상 그룹(beta)이 퍼센트와 별개로 강제 활성화되기 때문이다.
- `recommendation_v2`는 production 롤아웃 0%이지만 대상 사용자 `user-0002` 1명만 활성화되어, 대상 사용자 타겟팅이 동작함을 확인했다.

## 2. 환경 변수 토글 테스트

실행 명령: `$env:APP_ENV="production"; $env:FLAG_NEW_CHECKOUT="off"; npm start`

| 구분 | new_checkout | dark_mode | recommendation_v2 |
|------|:---:|:---:|:---:|
| production (기본) | 186 | 409 | 1 |
| production + `FLAG_NEW_CHECKOUT=off` | 0 | 409 | 1 |

- 환경 변수로 `new_checkout`을 강제로 끄면 대상 사용자/그룹, 롤아웃 퍼센트와 무관하게 0명이 된다.
- 다른 플래그(`dark_mode`, `recommendation_v2`)는 영향을 받지 않았다.
- 코드 배포 없이 환경 변수만으로 기능을 즉시 끌 수 있는 킬 스위치로 사용할 수 있다.

## 3. A/B 테스트: checkout_button_color

- 가설: 새 결제 버튼 색상(treatment)이 기존(control)보다 전환율이 높다.
- 할당 비율: control 50 / treatment 50 (SHA-256 해시 기반)
- 추적 이벤트: `exposure`(노출), `conversion`(전환) → `logs/events.jsonl`

### 할당 일관성 검증

- 같은 사용자에게 `getVariant`를 두 번 호출해 결과를 비교했다.
- **불일치 0건** (development, staging, production, 킬 스위치 실행 4회 모두)
- 실제 할당 인원: control 490명 / treatment 510명

### 결과 (`npm run report`)

| variant | exposures | conversions | rate |
|---------|:---------:|:-----------:|:----:|
| control | 490 | 54 | 11.0% |
| treatment | 510 | 80 | 15.7% |

### 해석
- 전환율은 가정값(control 10%, treatment 14%)을 기반으로 난수로 생성한 값이므로, 실제 효과를 검증한 것이 아니다.
- 이 실험으로 검증한 것은 (1) 사용자 할당의 일관성, (2) 이벤트 기록 및 variant별 집계 파이프라인의 동작이다.
- 전환 수는 `Math.random()` 때문에 실행마다 조금씩 달라지지만, 할당 결과(490/510)는 해시 기반이라 항상 같다.

## 4. Canary 롤아웃 및 자동 롤백 검증 (선택과제)

실행 명령: `npm run canary`

- 대상 플래그: new_checkout
- 단계: 1% → 10% → 50% → 100% (단계별 헬스체크 3회 모두 통과해야 승급)
- 롤백 기준: 에러율 > 3% 또는 p95 지연 > 400ms 또는 샘플 < 50
- 롤백 동작: 기준 초과 시 즉시 0%로 되돌리고 `config/canary-state.json`, `logs/canary-log.jsonl`에 사유 기록
- 시드 고정으로 결과 재현 가능

| 시나리오 | 설명 | 결과 | 실패 단계 | 롤백 사유 |
|----------|------|------|:---------:|-----------|
| healthy | 모든 단계 정상 | COMPLETED (100%) | - | - |
| error_spike | 10%부터 에러율 급증 | ROLLED_BACK | 10% | 에러율 7.7% > 3.0% |
| latency_regression | 50%부터 지연 악화 | ROLLED_BACK | 50% | p95 1162ms > 400ms |

### 관찰
- `error_spike`는 1% 단계를 통과한 뒤 10% 단계에서 감지되어 롤백되었다. 영향받은 사용자는 전체의 10% 이하로 제한된다.
- `latency_regression`은 1%, 10%를 통과하고 50% 단계에서 감지되었다. 지연 문제는 트래픽이 늘어난 뒤에야 드러나는 유형을 가정했다.
- `healthy`는 모든 단계를 통과해 100%까지 승급되어, 정상 상황에서 불필요한 롤백이 일어나지 않음을 확인했다.

## 5. 결론

- 사용자 ID 해시 기반 버킷팅은 별도 저장소 없이 일관된 할당을 보장하고, 롤아웃 퍼센트를 올려도 기존 사용자가 뒤집히지 않는다.
- 플래그 평가 우선순위(환경 변수 → 대상 사용자 → 대상 그룹 → 환경별 퍼센트)를 두어 긴급 차단과 세밀한 타겟팅을 모두 지원했다.
- Canary 배포는 소수 사용자에게 먼저 노출해 장애 영향 범위를 줄이고, 헬스체크 기반 자동 롤백으로 대응 시간을 단축할 수 있다.
- 한계: 모든 지표가 시뮬레이션이라 실제 트래픽의 변동성, 통계적 유의성 검정(표본 크기, p-value)은 다루지 못했다. 실제 서비스에서는 이를 보완해야 한다.