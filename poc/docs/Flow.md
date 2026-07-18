# Flow của PoC OCR → Bill

Dựa vào mã nguồn hiện tại trong thư mục `poc`, dưới đây là phân tích toàn bộ luồng xử lý từ lúc người dùng upload ảnh cho đến khi tự động tạo bill.

## 1. Tổng quan flow

Luồng bắt đầu từ việc client gửi request upload một ảnh hóa đơn, API nhận ảnh và xử lý qua các bước: validate file $\rightarrow$ gửi cho OCR service bóc tách chữ $\rightarrow$ chuẩn hóa/parsing dữ liệu $\rightarrow$ ánh xạ thành model Draft Bill $\rightarrow$ lưu vào JSON file tạm thời và trả toàn bộ kết quả về cho client. 

## 2. Flow từng bước

1. **Nhận ảnh hóa đơn:** Client gửi request `POST /api/poc/receipts/process` dưới dạng `multipart/form-data`. Tại controller (`app.js`), hệ thống sử dụng module parse multipart (`upload.js`) để lấy buffer của file. Trong quá trình này, kích thước file, kiểu MIME, và file signature (magic bytes) được kiểm tra kỹ lưỡng.
2. **Gửi ảnh tới OCR service:** Hình ảnh hợp lệ được chuyển cho `processingService` (bên trong `billService.js`). Service gọi OCR provider (`ocr.js`). Tùy vào biến `OCR_MODE`, hệ thống sẽ trả về data mock hoặc encode buffer sang Data URI và gửi yêu cầu đến **External API** (Google Gemini API vision).
3. **Nhận và chuẩn hóa kết quả OCR:** Text thô hoặc JSON trả về từ external API được đẩy vào `normalizer.js`. Bộ chuẩn hóa tiến hành trim dấu, loại bỏ ký tự rác, và chuẩn hóa các giá trị tiền tệ (ví dụ: chuyển chuỗi '100.000 ₫' thành kiểu Integer `100000`).
4. **Trích xuất thông tin:** Thông tin được bóc tách vào các field cụ thể: `merchantName` (Tên cửa hàng), `transactionDate` (Ngày giao dịch), `currency` (Đơn vị tiền), các `items` (Danh sách món, kèm số lượng, đơn giá), `subtotal`, `tax`, `total` (Tổng tiền).
5. **Validate dữ liệu và xử lý lỗi:** Tính toán lại (re-calculate) các tổng. Nếu tổng tự cộng (subtotal + tax + ...) không khớp với total do OCR nhận dạng được, hệ thống sẽ chèn thêm thông báo cảnh báo (`warnings`). Bất kỳ lỗi mạng, lỗi file không hợp lệ, OCR không nhận được chữ đều ném ra lỗi `AppError` và API trả về HTTP code tương ứng (VD: 415, 502, 422).
6. **Chuyển dữ liệu sang bill model:** Thông qua hàm `mapExtractedDataToBill` (trong `billService.js`), dữ liệu trích xuất được map sang schema gần giống với model trên production: `status` thiết lập là `DRAFT` (nếu hoàn hảo) hoặc `NEEDS_REVIEW` (nếu có warning), `splittingMethod` mặc định là `item-based`.
7. **Lưu database hoặc trả kết quả về UI:** PoC mock database bằng cách lưu object bill thông qua lớp `JsonBillStore` (`billStore.js`). Thao tác ghi file này được đảm bảo nguyên tử (atomic) bằng cách ghi file tạm rồi rename. Cuối cùng, router `app.js` phản hồi mã HTTP `201 Created` kèm JSON chứa cả raw text, data trích xuất, bill object, và warnings.

## 3. File và Module quan trọng

- `src/server.js`: Entry point, setup cấu hình và lắng nghe HTTP port.
- `src/app.js`: Router và Controller, định tuyến API, xử lý upload, và response.
- `src/upload.js`: Đọc buffer từ multipart/form-data, validate giới hạn size và file format.
- `src/billService.js`: Core Business Logic, điều phối luồng xử lý và chứa mapper tạo object Bill.
- `src/ocr.js`: Tương tác với hệ thống bên ngoài (Gemini API) hoặc Mock Provider.
- `src/normalizer.js`: Chuẩn hóa kết quả text hỗn loạn thành JSON có cấu trúc.
- `src/billStore.js`: Xử lý lưu trữ JSON đơn giản vào `data/bills.json`.

## 4. Input / Output

- **Input:** Request POST tới `/api/poc/receipts/process` kèm theo dữ liệu `multipart/form-data` chứa trường `file` (dữ liệu file ảnh như JPG, PNG, WEBP, v.v.).
- **Output:**
  ```json
  {
    "success": true,
    "requestId": "uuid",
    "ocr": { "provider": "gemini", "rawText": "...", "confidence": ... },
    "extractedData": { "merchantName": "...", "items": [...], "total": 100000 },
    "bill": { "id": "...", "status": "DRAFT", "totalAmount": 100000, "items": [...] },
    "warnings": []
  }
  ```

## 5. Điểm chưa hoàn chỉnh hoặc đang mock

- **Auth & Users:** Toàn bộ API đều public, thiếu thông tin về người tạo (creator), người chi trả (payer) và những người tham gia chia tiền (participants).
- **Database Storage:** Lưu hóa đơn tạm thời trên file JSON (`JsonBillStore`) thay vì sử dụng MongoDB native với Transaction.
- **Error resilience:** Đối với các hóa đơn viết tay, rách hoặc mờ, luồng xử lý dựa hoàn toàn vào OCR từ Gemini API và có thể vấp phải nhiều dữ liệu rác mà normalizer chưa phủ hết các edge cases. 

## 6. Cách chạy demo end-to-end

- **Chạy server:** Từ thư mục `poc`, chạy `npm install` và `npm start`.
- **Thực thi:** Truy cập UI tại `http://127.0.0.1:8088` (hoặc cổng cấu hình). Giao diện tối giản cho phép upload ảnh từ máy tính.
- **Kết quả mong đợi:** File JSON `bills.json` sẽ được cập nhật. Ở giao diện web, các thông tin về hóa đơn, món hàng và danh sách cảnh báo (nếu có) được liệt kê đầy đủ. Có thể tra cứu lại thông qua `GET /api/poc/bills/{bill-id}`.
