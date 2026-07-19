# Splitly OCR → Bill PoC

Standalone, dependency-free Node.js PoC for this flow:

`multipart image upload → OCR → normalization → draft bill → JSON persistence/UI`

Quick start (Node.js 20+):

```powershell
cd poc
npm.cmd ci
npm.cmd test
npm.cmd start
```

Open <http://127.0.0.1:8089> and upload `samples/receipt.svg`, or read [the full PoC document](docs/OCR_BILL_POC.md).

The default `OCR_MODE=mock` is deterministic and does not claim to read the uploaded pixels. Set `OCR_MODE=real` and configure the existing Gemini API variables to exercise real OCR with JPG/PNG/WEBP/HEIC/HEIF images.
