# TASK — violethpark 프로필 프로젝트

> 이 문서는 프로젝트 작업 순서와 각 단계의 세부 요구사항을 정의합니다.

---

## 작업 순서

### Task 1. RESUME*.md 오탈자 검토 및 수정

- **입력:** `RESUME*.md` 패턴에 일치하는 모든 파일 (RESUME.md, RESUME2.md 등 — 외부 이력서 사이트에서 Markdown으로 변환한 원본)
- **목표:** 모든 RESUME 파일에서 오탈자, 문법 오류, 서식 깨짐, 불일치 등을 찾아 수정
- **검토 항목:**
  - 한글 맞춤법 및 띄어쓰기
  - 마크다운 문법 오류 (깨진 링크, 잘못된 헤딩 레벨 등)
  - 날짜/숫자 표기 일관성
  - 이미지 경로 유효성 (`images/` 폴더 내 파일과 대조)
  - 특수문자, 이모지 깨짐 여부
- **주의사항:**
  - 내용의 사실관계는 변경하지 않는다.
  - 맞춤법, 띄어쓰기, 마크다운 문법, 일관성 위주로 검토한다.
  - 이미지 경로(`images/` 폴더)가 올바른지 확인한다.
  - 수정 사항은 직접 파일에 반영한다.
  - 의미가 달라질 수 있는 수정은 사용자에게 확인한다.

### Task 2. CV.md 초안 생성

- **입력:** 수정된 `RESUME*.md` 파일들 (복수 파일 통합)
- **출력:** `CV.md` (프로젝트 최상단 디렉토리)
- **목표:** RESUME*.md 파일들의 사실 정보를 통합하여 **영어** CV 초안 작성
- **권장 구성:**
  1. 헤더 (이름, 한줄 소개)
  2. 연락처 / 링크
  3. 기술 스택 (카테고리별 정리)
  4. 경력 요약
  5. 주요 프로젝트
  6. 학력
  7. 자격증
  8. 자기소개 (간결하게 다듬기)
  9. 부록 (성격 검사 결과 등 — 이미지 포함 가능)
- **주의사항:**
  - 여러 RESUME 파일이 있을 경우, 모든 파일의 정보를 통합하여 하나의 CV로 구성한다.
  - RESUME*.md에 기재된 사실만 사용한다. **거짓 정보를 절대 추가하지 않는다.**
  - 장황한 설명을 피하고 **간결하고 읽기 쉬운 포맷**을 사용한다.
  - 기술 스택, 경력, 프로젝트, 학력, 자격증 등 카테고리별로 구성한다.
  - **CV 형식에 부적합한 정보는 제거한다:** 희망연봉, 전화번호, 상세 주소 등
  - 추후 이미지/자료 추가를 위한 섹션 자리를 마련해 둔다.
  - 문서 상단에 한국어(`CV_ko.md`), 일본어(`CV_jp.md`) 버전 링크를 포함한다.

### Task 3. README.md 생성 (GitHub 프로필 페이지)

- **입력:** `CV.md`
- **출력:** `README.md` (프로젝트 최상단 디렉토리, 기존 파일 덮어쓰기)
- **목표:** GitHub 프로필 페이지에 표시될 간결한 자기소개 README 작성
- **주의사항:**
  - **영어**로 작성한다.
  - CV.md의 내용을 **간략하게 요약**한다.
  - CV 형식에 부적합한 정보(희망연봉, 전화번호, 상세 주소 등)는 제거한다.
  - **CV 링크:** [about.violethpark.com](https://about.violethpark.com/) 으로 연결한다.
    - 한국어: [about.violethpark.com/ko/](https://about.violethpark.com/ko/)
    - 일본어: [about.violethpark.com/jp/](https://about.violethpark.com/jp/)
  - 활용 요소:
    - Emoji (👋, 🛠️, 💼, 🎓 등)
    - shields.io 배지 (기술 스택, 연락처 등)
    - GitHub Stats 카드 (선택)
    - 간결한 섹션 구분
  - 핵심 정보: 소개, 기술 스택 배지, 경력 요약, 링크
  - **분량:** 스크롤 1~2회 이내로 끝나는 분량이 이상적이다.
  - **톤:** 전문적이면서 친근한 톤
  - 문서 상단에 한국어(`README_ko.md`), 일본어(`README_jp.md`) 버전 링크를 포함한다.

### Task 4. CV.md 보강 — 이미지 및 자료 추가

- **입력:** `CV.md`, `images/` 폴더 내 기존 이미지, 사용자 추가 제공 자료
- **목표:** CV.md에 시각 자료를 추가하여 완성도를 높인다.
- **주의사항:**
  - 현재 `images/` 폴더에 있는 자료: `profile.png`, `mbti.jpeg`, `cliftonStrengths.jpg`, `big5.jpg`, `enneagram.jpg`
  - 사용자에게 추가로 필요한 이미지/자료를 **구체적으로 요청**한다.
    - 프로필 사진 (있다면)
    - 프로젝트 스크린샷 또는 데모 링크
    - 자격증 사본 이미지
    - 기타 포트폴리오 자료
  - 기존 `images/` 폴더의 이미지를 CV.md에 적절히 배치한다.
  - 이미지 경로는 `images/` 하위로 통일한다.

### Task 5. 다국어 버전 생성

- **입력:** `CV.md` (영어), `README.md` (영어)
- **출력:** `CV_ko.md`, `CV_jp.md`, `README_ko.md`, `README_jp.md`
- **목표:** 영어 기본 문서를 한국어 및 일본어로 번역하여 별도 파일로 제공
- **주의사항:**
  - 기술 용어, 고유명사는 원어(영어) 표기를 유지한다.
  - 각 문서 상단에 다른 언어 버전으로의 링크를 상호 연결한다.
  - 번역의 정확성을 위해 의역보다 직역을 우선하되, 자연스러운 표현을 사용한다.
  - RESUME*.md는 번역 대상이 아니다. 원본 언어(한국어)를 유지한다.

### Task 6. CV*.html 생성 (HTML 변환)

- **입력:** `CV.md`, `CV_ko.md`, `CV_jp.md`, `convert.ts`, `style.css`
- **출력:** `CV.html`, `CV_ko.html`, `CV_jp.html`
- **목표:** 모든 MD 파일 작업 완료 후 `convert.ts`를 실행하여 CV HTML 파일을 생성한다.
- **실행 명령:** `npm run convert`
- **주의사항:**
  - **Task 1~5가 모두 완료된 후에 실행한다.** 이 Task는 항상 마지막에 실행한다.
  - MD 파일이 수정될 때마다 재실행하여 HTML을 최신 상태로 유지한다.
  - 변환 후 HTML 파일이 정상 생성되었는지 확인한다.
  - `style.css`가 함께 존재해야 HTML이 올바르게 렌더링된다.
  - `node_modules`가 없는 경우 `npm install`을 먼저 실행한다.

### Task 7. GitHub Pages 배포 (GitHub Actions)

- **입력:** `CV*.html`, `style.css`, `images/`
- **출력:** GitHub Pages (`https://violethpark.github.io/violethpark/`)
- **목표:** CV*.html을 index*.html 형식으로 GitHub Pages에 자동 배포
- **워크플로우:** `.github/workflows/deploy-cv.yml`
- **주의사항:**
  - `main` 브랜치에 push 시 자동 실행된다.
  - CV.html → index.html, CV_ko.html → index_ko.html, CV_jp.html → index_jp.html로 복사한다.
  - 언어 간 교차 링크(.md)를 index*.html로 자동 변환한다.
  - `style.css`와 `images/` 폴더도 함께 배포한다.
  - GitHub 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정해야 한다.
  - 배포 URL: `https://violethpark.github.io/violethpark/`
  - 커스텀 도메인 URL: `https://about.violethpark.com/`

---

## 완료 조건

- [x] RESUME*.md 오탈자 수정 완료
- [x] CV.md 생성 완료 (영어, 사실 기반, CV 부적합 정보 제거)
- [x] README.md 생성 완료 (영어, GitHub 프로필용, 간결 & 시각적)
- [x] CV.md 이미지/자료 추가 완료 (사용자 확인 후)
- [x] 다국어 버전 생성 완료 (CV_ko.md, CV_jp.md, README_ko.md, README_jp.md)
- [x] CV*.html 생성 완료 (convert.ts 실행, CV.html, CV_ko.html, CV_jp.html)
- [x] GitHub Pages 배포 설정 완료 (GitHub Actions 워크플로우)
