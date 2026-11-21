# feature-flags-lab

11주차 Feature Flags 및 점진적 배포 실습

## Feature Flags (3개)

| 플래그 | 설명 |
|--------|------|
| `new_checkout` | 새 결제 화면 |
| `dark_mode` | 다크 모드 UI |
| `recommendation_v2` | 추천 알고리즘 v2 |

## 플래그 평가 우선순위

1. 환경 변수 강제 설정 (`FLAG_<NAME>=on|off`)
2. 대상 사용자 (`allowUsers`)
3. 대상 그룹 (`allowGroups`)
4. 환경별 퍼센트 롤아웃 (`APP_ENV`: development / staging / production)

롤아웃 설정은 `config/rollout.json`에서 관리합니다. 사용자 ID 해시로 버킷(0~99)을 정하므로 퍼센트를 올려도 기존 사용자가 뒤집히지 않습니다.

## A/B 테스트

- 실험: `checkout_button_color` (control 50 / treatment 50)
- 실험명 + 사용자 ID 해시로 variant를 할당해 같은 사용자는 항상 같은 variant를 받습니다.
- 노출(exposure)/전환(conversion) 이벤트는 `logs/events.jsonl`에 기록됩니다.

## 실행 방법

```bash
npm start        # 1000명 시뮬레이션 실행
npm run report   # variant별 전환율 리포트
```

환경 변경 예시 (PowerShell): `$env:APP_ENV="production"; npm start`

## 구조

- `src/flags/` 플래그 평가 및 롤아웃 로직
- `src/experiments/` A/B 할당 및 이벤트 추적
- `config/rollout.json` 롤아웃 설정
- `logs/experiment-log.md` 실험 로그