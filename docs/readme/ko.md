# Kit

[English](../../README.md) · [Español](es.md) · [Français](fr.md) · [Deutsch](de.md) · [Português (Brasil)](pt-BR.md) · [日本語](ja.md) · [简体中文](zh-Hans.md) · [繁體中文](zh-Hant.md) · **한국어** · [العربية](ar.md)

<details>
<summary>README 30개 언어 모두</summary>

- [English](../../README.md)
- [Español](es.md)
- [Français](fr.md)
- [Deutsch](de.md)
- [Italiano](it.md)
- [Português (Brasil)](pt-BR.md)
- [Português (Portugal)](pt-PT.md)
- [Nederlands](nl.md)
- [Dansk](da.md)
- [Svenska](sv.md)
- [Norsk Bokmål](nb.md)
- [Suomi](fi.md)
- [Polski](pl.md)
- [Čeština](cs.md)
- [Magyar](hu.md)
- [Română](ro.md)
- [Ελληνικά](el.md)
- [Türkçe](tr.md)
- [Русский](ru.md)
- [Українська](uk.md)
- [العربية](ar.md)
- [עברית](he.md)
- [हिन्दी](hi.md)
- [ไทย](th.md)
- [Tiếng Việt](vi.md)
- [Bahasa Indonesia](id.md)
- [日本語](ja.md)
- **한국어**
- [简体中文](zh-Hans.md)
- [繁體中文](zh-Hant.md)

</details>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

**브라우저에서 쓰는 일상 도구. 처음부터 비공개.**

Kit는 PDF, 이미지, 미디어, 변환, 텍스트 도구가 기기에서 실행되는 모음입니다. 처리는 브라우저에 남고 Kit 서버로 아무것도 보내지 않습니다.

**사이트:** https://trykit.pages.dev

**작성자 소개:** https://t-g.pages.dev

## 무엇을 얻나요

정돈된 도구 모음입니다. 분명한 레이아웃, 라이트/다크, 네이티브 선택기의 30개 언어, 설치 가능한 PWA, 그리고 브라우저가 할 수 있는 일의 정직한 한계.

## 언어

앱 UI와 이 GitHub README는 **30개 언어**입니다. 설정(또는 헤더)의 네이티브 선택기나 이 파일 맨 위 링크로 바꾸세요. 아랍어와 히브리어는 오른쪽에서 왼쪽입니다. 개인정보와 약관은 해당 언어의 법률 문구가 있을 때만 번역되고, 없으면 영어입니다. 예전 `/zh/` 링크는 여전히 중국어 간체로 연결됩니다.

## 도구

홈은 작업별로 도구를 묶습니다(PDF 페이지, 데이터, 개발…). 한 줄로 나열하지 않습니다.

### PDF
- 합치기, 나누기, 정리, 쪽 번호
- 압축, 잠금/해제, 메타데이터, 양식 병합
- 워터마크, 시각적 가림, 입력 서명
- 텍스트 추출, PDF → 이미지 ZIP, 이미지 → PDF

### 이미지
- 압축, 크기 조정, 자르기, 회전/뒤집기, 파비콘 팩
- 보정, 필터, 워터마크
- JPEG/PNG/WEBP 변환, EXIF 보기/제거

### 오디오와 비디오
- 변환, 파형으로 자르기, 속도/음량, 오디오 추출, 클립 → GIF  
  *(FFmpeg WASM. 큰 파일은 느릴 수 있고 코덱 지원은 제한적입니다)*

### 데이터
- JSON / YAML / TOML / SQL, CSV ↔ JSON, XML ↔ JSON
- JSON → TypeScript 인터페이스
- 변환 허브

### 글쓰기
- Markdown ↔ HTML, 텍스트 비교, 대소문자, Lorem ipsum

### 개발
- JWT 디코드, 유닉스 타임스탬프, cron, 진법
- 해시 (SHA/MD5), 정규식, 색
- Base64, URL, HTML 엔티티
- UUID, 비밀번호 생성, QR

## 개인정보

- 도구는 데이터를 **기기에서** 처리합니다
- 기록은 **요약만** 남깁니다(파일 내용은 저장하지 않음)
- 설정은 로컬 저장소에 남습니다
- [개인정보 처리방침](https://trykit.pages.dev/ko/privacy/) · [이용약관](https://trykit.pages.dev/ko/terms/)

## 로컬 개발

**Node.js 24+** 가 필요합니다(`.nvmrc` 참고).

```bash
git clone https://github.com/TGthms/kit.git
cd kit
npm install
npm run dev
```

http://localhost:3000 을 열면 기본 로케일이 `/en/` 으로 이동합니다.

```bash
npm run build
npm run typecheck
npm run lint
```

### 베이스 경로

GitHub 프로젝트 Pages는 다음으로 빌드합니다.

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
```

로컬 기본값은 접두사 없음(`NEXT_PUBLIC_BASE_PATH` 비움).

## GitHub Pages에 배포

### 자동(권장)

1. 이 저장소를 **https://github.com/TGthms/kit** 로 푸시
2. GitHub → **Settings → Pages → Source: GitHub Actions**
3. [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) 가 `NEXT_PUBLIC_BASE_PATH=/kit` 로 빌드하고 `out/` 을 공개합니다

### 수동

```bash
NEXT_PUBLIC_BASE_PATH=/kit npm run build
# Upload contents of out/ to your Pages target, or use actions/upload-pages-artifact
```

Pages URL: `https://TGthms.github.io/kit/`  
정규 사이트: `https://trykit.pages.dev`

## 기술 스택

Next.js 16(App Router, 정적 내보내기) · TypeScript · Tailwind CSS · shadcn 스타일 UI · Zustand · next-intl · @cantoo/pdf-lib / PDF.js · Canvas · FFmpeg WASM · PWA 서비스 워커

## 라이선스

[MIT](../../LICENSE) © Tim G (GitHub: [TGthms](https://github.com/TGthms))
