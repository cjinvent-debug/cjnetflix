# Netflix 영화 웹사이트

Netflix 스타일의 현재 상영 중인 영화를 보여주는 웹사이트입니다.

## 기능

- 현재 상영 중인 영화 표시 (TMDB API 사용)
- 인기도 TOP10 순위 표시
- 개봉일 순으로 전체 영화 표시
- 영화 카드 클릭 시 Netflix 인트로 사운드 재생

## Netflix 인트로 오디오 설정 방법

1. YouTube에서 오디오 추출:
   - https://youtu.be/GV3HUDMQ-F8?si=TyTwlRbmqYtQ3EPD 에서 오디오 다운로드
   - 온라인 도구 사용 (예: y2mate.com, ytmp3.cc 등)
   - 또는 브라우저 확장 프로그램 사용

2. 파일 이름 변경:
   - 다운로드한 파일을 `netflix-intro.mp3`로 이름 변경
   - 또는 `netflix-intro.wav`, `netflix-intro.ogg` 형식도 지원

3. 프로젝트 폴더에 저장:
   - `index.html`, `script.js`, `style.css`와 같은 폴더에 저장

4. 브라우저에서 테스트:
   - 영화 카드를 클릭하면 Netflix 인트로 소리가 재생됩니다

## 파일 구조

```
cj-netflix/
├── index.html
├── style.css
├── script.js
└── netflix-intro.mp3 (추가 필요)
```

## 사용 방법

1. `index.html` 파일을 브라우저에서 엽니다
2. 자동으로 현재 상영 중인 영화가 로드됩니다
3. 영화 카드를 클릭하면 Netflix 인트로 사운드가 재생됩니다
