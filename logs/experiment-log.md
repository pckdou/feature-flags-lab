# 실험 로그

> 전환 데이터는 코드에 넣은 가정값(control 10%, treatment 14%)으로 만든 **시뮬레이션 데이터**입니다.

## 1. 점진적 롤아웃 기록

| 환경 | new_checkout | dark_mode | recommendation_v2 |
|------|-------------|-----------|-------------------|
| development | (결과) /1000 | (결과) /1000 | (결과) /1000 |
| staging | (결과) /1000 | (결과) /1000 | (결과) /1000 |
| production | (결과) /1000 | (결과) /1000 | (결과) /1000 |

## 2. 환경 변수 토글 테스트
- `FLAG_NEW_CHECKOUT=off` 설정 시 production에서 new_checkout 활성 사용자 수: (결과)명

## 3. A/B 테스트: checkout_button_color
- 할당 비율: control 50 / treatment 50
- 할당 일관성 검증: 불일치 (결과)건

| variant | exposures | conversions | rate |
|---------|-----------|-------------|------|
| control | (결과) | (결과) | (결과) |
| treatment | (결과) | (결과) | (결과) |

## 4. 결론 및 배운 점
- (직접 작성)