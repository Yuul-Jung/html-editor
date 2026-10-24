# 웹 코드 스튜디오 — GitHub HTML Editor

GitHub에 보관한 HTML 파일을 **브라우저에서 불러오기 → 코드 수정 → 실시간 미리보기 → 원본 저장소에 커밋**할 수 있는 웹 편집기입니다.

> **[편집기 실행하기](https://yuul-jung.github.io/html-editor/)**  
> 저장소: https://github.com/Yuul-Jung/html-editor

기존 HTML · CSS(스타일 시트) · JavaScript(자바스크립트) 편집 기능을 유지하면서, **특정 저장소에 한정하지 않고** 접근 가능한 GitHub 저장소의 HTML을 열고 저장하는 기능을 추가했습니다.

## 1. 빠른 사용법

### ① 공개 GitHub 저장소의 HTML 불러오기

1. [웹 편집기](https://yuul-jung.github.io/html-editor/)를 실행합니다.
2. 상단 **GitHub 열기**를 누릅니다.
3. GitHub 사용자명에 `Yuul-Jung`을 입력하거나 기본값을 유지합니다.
4. **목록 불러오기**를 누릅니다.
5. 왼쪽에서 저장소를 선택합니다.
6. 오른쪽에서 폴더를 탐색하고 원하는 `.html` 또는 `.htm` 파일을 클릭합니다.
7. 편집기의 **HTML 탭**에 소스가 열리며 오른쪽에 미리보기가 표시됩니다.

**공개 저장소의 파일을 읽는 데는 토큰이 필요하지 않습니다.** 목록에는 공개 저장소가 표시됩니다.

### ② 코드를 수정하고 미리보기 확인

- 왼쪽 코드 편집기에서 HTML을 수정합니다.
- **실시간 반영**이 켜져 있으면 오른쪽 미리보기가 자동으로 갱신됩니다.
- 데스크톱·태블릿·모바일 화면 크기를 전환할 수 있습니다.
- **전체화면**, **코드 정렬**, **검색/치환**, **개발자 콘솔** 기능도 이용할 수 있습니다.
- HTML · CSS · JS 탭을 사용할 수 있으며, 추가 CSS/JS를 사용한 경우 GitHub 저장 시 HTML에 통합됩니다.

**주의:** 미리보기 변경은 GitHub에 자동으로 저장되지 않습니다. 게시 파일을 변경하려면 별도로 **GitHub 저장**을 실행해야 합니다.

### ③ 수정한 HTML을 GitHub에 저장

1. **GitHub 열기**를 다시 누릅니다.
2. **개인 접근 토큰(PAT)** 입력란에 쓰기 권한이 있는 토큰을 입력합니다.
3. **목록 불러오기**를 눌러 인증된 계정의 저장소 목록을 갱신합니다.
4. 원하는 HTML 파일을 불러온 상태에서 편집합니다.
5. 필요하면 **커밋 메시지**를 수정합니다.
6. 상단 **GitHub 저장** 또는 창 안의 **현재 파일 GitHub 저장**을 누릅니다.
7. 대상 저장소·브랜치·파일 경로를 확인하고 승인합니다.

성공하면 GitHub 저장소의 원본 HTML 파일에 새 커밋이 생성됩니다. GitHub Pages의 실제 웹사이트에는 배포 설정과 빌드 상태에 따라 나중에 반영될 수 있습니다.

## 2. GitHub 토큰 발급 및 권한

GitHub에서 다음 순서로 진행합니다.

1. GitHub 우측 프로필 → **Settings**
2. **Developer settings**
3. **Personal access tokens → Fine-grained tokens**
4. **Generate new token**
5. **Resource owner**를 자신의 계정으로 설정
6. **Repository access**에서 필요한 저장소만 선택하거나 허용할 저장소 범위를 지정
7. **Repository permissions → Contents: Read and write** 권한 부여
8. 생성한 토큰을 복사해 편집기의 **개인 접근 토큰(PAT)** 입력란에 붙여넣기

GitHub의 **Metadata: Read** 권한은 통상 기본으로 제공됩니다. 조직 소유 저장소는 조직 정책·추가 승인에 따라 접근이 제한될 수 있습니다.

**보안 유의사항**

- 토큰을 README, HTML 소스, Git 커밋, 공개 이슈 등에 입력하지 마세요.
- 토큰은 공개 게시 기능과 별개의 **브라우저 인증 수단**입니다.
- 편집기는 토큰을 브라우저 메모리에서만 사용하며, 로컬 스토리지에 저장하지 않도록 작성했습니다. 새로고침하면 다시 입력해야 합니다.
- **토큰 지우기** 버튼으로 입력한 토큰을 해제할 수 있습니다.
- 필요한 저장소와 권한만 부여하고, 불필요한 토큰은 GitHub에서 폐기하세요.
- 이 도구는 GitHub Pages의 정적 웹사이트입니다. 자체 GitHub 비밀번호 입력이나 별도 백엔드 계정 저장 방식은 사용하지 않습니다.

## 3. 웹 주소(URL)로 바로 불러오기

상단 **GitHub 열기 → 웹 주소로 열기**에 GitHub Pages 또는 GitHub 파일 주소를 입력할 수 있습니다.

### 예시 A — Basys3 하드웨어 매뉴얼

- 웹페이지: https://yuul-jung.github.io/basys3_hw_dig/
- 저장소: `Yuul-Jung/basys3_hw_dig`
- 파일: `index.html`
- [편집기로 바로 열기](https://yuul-jung.github.io/html-editor/?repo=Yuul-Jung%2Fbasys3_hw_dig&path=index.html)

### 예시 B — MicroBlaze V SoC 교재의 HTML 한 페이지

- 웹페이지: https://yuul-jung.github.io/soc/MicroBlaze_V_SoC01_41/pages/soc/01_microblaze_bram_minimal_soc.html
- 저장소: `Yuul-Jung/soc`
- 파일: `MicroBlaze_V_SoC01_41/pages/soc/01_microblaze_bram_minimal_soc.html`
- [편집기로 바로 열기](https://yuul-jung.github.io/html-editor/?repo=Yuul-Jung%2Fsoc&path=MicroBlaze_V_SoC01_41%2Fpages%2Fsoc%2F01_microblaze_bram_minimal_soc.html)

다음 형태의 주소도 지원합니다.

- GitHub Pages: `https://사용자명.github.io/저장소명/경로/파일.html`
- GitHub 파일: `https://github.com/사용자명/저장소명/blob/브랜치명/경로/파일.html`
- 직접 열기 파라미터: `https://yuul-jung.github.io/html-editor/?repo=소유자%2F저장소&path=경로%2F파일.html`

**URL 해석 제한:** 사용자 정의 도메인, 복잡한 브랜치명(슬래시 포함), 리다이렉트된 주소 등은 자동 해석하지 못할 수 있습니다. 그때는 저장소 및 파일 경로를 직접 선택하세요.

## 4. GitHub 저장소·파일 탐색

- **GitHub 사용자명**: 탐색할 사용자의 이름을 입력합니다.
- **목록 불러오기**: 공개 저장소, 또는 토큰 인증 시 해당 계정이 접근할 수 있는 저장소 목록을 가져옵니다.
- **저장소 검색**: 불러온 저장소 이름을 필터링합니다.
- **폴더 탐색**: 하위 폴더로 이동하고 **↑ 상위** 버튼으로 돌아옵니다.
- **경로 직접 입력**: `index.html`, `pages/ch01.html` 등 정확한 상대 경로를 입력합니다.
- **파일 선택**: 현재 브랜치의 HTML 파일을 불러옵니다.

기본적으로 각 저장소의 **기본 브랜치(default branch)** 를 대상으로 동작합니다. 저장소 접근 권한이 없거나 삭제된 파일은 열 수 없습니다.

## 5. 이미지와 스타일시트

공개 GitHub 저장소에서 불러온 HTML은 같은 저장소에 있는 **상대 경로 이미지·CSS·JS**를 미리보기에서 읽도록 처리했습니다.

예를 들어 HTML 안에 `<img src="assets/figures/board.webp">`가 있으면, 원본 저장소 안의 해당 그림을 참조합니다.

- 원본 HTML 자체의 이미지 경로를 일괄 변경하지는 않습니다.
- **GitHub 저장**은 편집 중인 HTML 파일만 커밋합니다.
- 이미지나 CSS 파일 자체를 새로 업로드·삭제·이름 변경하는 파일 관리 기능은 제공하지 않습니다.
- 비공개 저장소의 상대 경로 이미지 및 외부 자산은 브라우저에서 접근 제한으로 표시되지 않을 수 있습니다.
- 편집기 미리보기는 안전을 위해 격리된 프레임에서 실행됩니다. 외부 사이트 로그인, 브라우저 저장소 및 일부 상호작용은 원본 웹페이지와 다를 수 있습니다.

## 6. 로컬 파일 열기와 다운로드

기존 기능인 **파일 열기**로 PC의 `.html`, `.css`, `.js`, `.txt` 파일을 읽을 수도 있습니다.

**저장/다운로드** 메뉴에서는 다음을 선택할 수 있습니다.

- 통합 HTML 번들 다운로드
- `index.html` 다운로드
- `style.css` 다운로드
- `script.js` 다운로드

로컬 파일을 연 것과 GitHub 원본 파일을 연 것은 다릅니다. **GitHub 저장**을 사용하려면 GitHub 저장소의 대상 HTML을 불러오고 쓰기 권한을 인증해야 합니다.

## 7. 저장 실패 시 확인 사항

| 증상 | 확인할 내용 |
|---|---|
| 저장소가 목록에 없음 | 소유자명, 공개 여부, 토큰 권한 및 조직 접근 정책 확인 |
| 토큰 입력 후에도 저장 불가 | PAT의 Contents 읽기/쓰기, 대상 저장소 접근 권한 확인 |
| HTML 파일을 열 수 없음 | 파일 경로, 기본 브랜치, HTML 확장자와 API 접근 여부 확인 |
| 저장 시 409 충돌 발생 | GitHub에서 원본이 먼저 변경됐을 수 있습니다. 변경 내용을 백업한 뒤 최신 파일을 다시 열어 비교하세요 |
| 저장 시 403 발생 | PAT 권한, 브랜치 보호 규칙, 조직 정책 또는 API 제한 확인 |
| 본문의 이미지가 깨짐 | 저장소의 실제 이미지 경로·대소문자와 공개 여부 확인 |
| 웹페이지에 수정이 보이지 않음 | GitHub 커밋 존재 여부, GitHub Pages 배포 완료, 브라우저 캐시 확인 |

## 8. 사용 범위와 주의사항

이 편집기는 **접근 권한이 있는 GitHub 저장소의 HTML 파일 편집기**입니다. 저장소 생성·삭제, 브랜치 생성, 다중 파일 동시 커밋, 이미지 업로드, GitHub Pages 활성화 기능은 구현되어 있지 않습니다.

자동으로 모든 저장소를 수정하거나 배포하지 않습니다. **선택한 한 HTML 파일을 사용자가 확인하고 저장하는 방식**입니다.

**권장 작업 흐름:** GitHub 열기 → 저장소 선택 → HTML 열기 → 미리보기 확인 → 수정 → GitHub 저장 → 배포된 웹페이지 확인.
