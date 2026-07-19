# Skill: Explain PoC Flow

## Mục tiêu
Phân tích repository hiện tại và giải thích ngắn gọn luồng Proof of Concept từ đầu đến cuối.

## Yêu cầu thực hiện
1. Xác định điểm bắt đầu của PoC: API, UI, command hoặc test.
2. Tìm các file chính tham gia vào luồng.
3. Mô tả dữ liệu đi qua từng bước:
   - Nhận ảnh hóa đơn.
   - Gửi ảnh tới OCR service.
   - Nhận và chuẩn hóa kết quả OCR.
   - Trích xuất thông tin: cửa hàng, ngày, tổng tiền, danh sách món.
   - Validate dữ liệu và xử lý lỗi.
   - Chuyển dữ liệu sang bill model.
   - Lưu database hoặc trả kết quả về UI.
4. Chỉ rõ service, controller, module, repository và external API liên quan.
5. Nêu cách chạy demo end-to-end và kết quả mong đợi.

## Format output
- Tổng quan flow.
- Flow từng bước.
- File quan trọng.
- Input / Output.
- Điểm chưa hoàn chỉnh hoặc đang mock.

Không mô tả lan man. Chỉ kết luận dựa trên code trong repository.