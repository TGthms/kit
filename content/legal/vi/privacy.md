# Chính sách quyền riêng tư

**Cập nhật lần cuối:** 15 tháng 7 năm 2026

Chính sách này mô tả cách thông tin được xử lý khi bạn sử dụng **Kit**, một bộ tiện ích được phát hành dưới dạng trang web tĩnh và được thiết kế để chạy trong trình duyệt của bạn.

## Nguyên tắc chính

Kit được thiết kế để **công việc trên các tệp của bạn diễn ra trên thiết bị của bạn**. Chúng tôi không vận hành máy chủ ứng dụng nhận, lưu trữ hoặc phân tích nội dung tài liệu, hình ảnh hay phương tiện mà bạn mở trong các công cụ.

## Kit không làm gì

Khi bạn sử dụng các công cụ (ví dụ: hợp nhất PDF hoặc nén hình ảnh):

- Tệp của bạn **không được tải lên** máy chủ phụ trợ của Kit để xử lý.
- Chúng tôi **không tạo tài khoản người dùng**.
- Chúng tôi **không bán dữ liệu cá nhân**.
- Chúng tôi **không sử dụng SDK quảng cáo hoặc theo dõi liên trang web cho quảng cáo**.

## Thông tin có thể tồn tại xung quanh dịch vụ

### 1. Dữ liệu vẫn ở trên thiết bị của bạn

Trình duyệt có thể lưu cục bộ một lượng thông tin giới hạn, chẳng hạn như:

- Tùy chọn giao diện (sáng, tối hoặc theo hệ thống)
- Ngôn ngữ đã chọn
- Công cụ yêu thích hoặc được ghim
- **Tóm tắt lịch sử** (công cụ đã dùng, thời điểm gần đúng, mô tả ngắn) — **không phải** nội dung tệp của bạn
- Các cài đặt sẵn mà bạn chọn lưu

Bạn có thể xóa lịch sử trong phần Cài đặt hoặc xóa dữ liệu của trang web này trong trình duyệt.

### 2. Nhật ký mạng và lưu trữ

Kit thường được lưu trữ dưới dạng các tệp tĩnh trên **Cloudflare Pages** (trang chuẩn: trykit.pages.dev), với bản sao trên GitHub Pages. Khi trình duyệt yêu cầu các trang và tài nguyên, nhà cung cấp dịch vụ lưu trữ có thể tự động ghi lại dữ liệu kỹ thuật tiêu chuẩn như địa chỉ IP, user agent, dấu thời gian và URL được yêu cầu. Việc ghi nhật ký này do cơ sở hạ tầng và chính sách của nhà lưu trữ kiểm soát — không phải do máy chủ Kit mở tài liệu của bạn.

### 3. Tài nguyên bên thứ ba tùy chọn

Công cụ PDF tải worker pdf.js, phông chữ và tài nguyên liên quan **từ chính trang này** (đi kèm ứng dụng). Công cụ âm thanh và video tải một engine FFmpeg WebAssembly **từ chính trang này**. Nội dung tệp của bạn ở lại trong trình duyệt; các thư viện đó là mã ứng dụng, không phải nơi chúng tôi gửi tài liệu của bạn.

Engine FFmpeg (`@ffmpeg/core`) được cấp phép **GPL-2.0-or-later** vì gồm các codec như H.264 và LAME MP3. Mã nguồn của Kit vẫn là MIT. pdf.js và các thư viện khác giữ giấy phép Apache, BSD hoặc MIT.

### 4. Tỷ giá tiền tệ

Khi bạn làm mới tỷ giá, trình duyệt này truy vấn API công khai của Frankfurter. Yêu cầu có thể chia sẻ với Frankfurter siêu dữ liệu mạng tiêu chuẩn như địa chỉ IP, user agent, thời gian và URL được yêu cầu. Tỷ giá có thể lấy từ bộ nhớ đệm của trình duyệt này và có thể đã cũ. Đây chỉ là dữ liệu tham khảo hằng ngày, không phải bảo đảm cho giao dịch, kế toán, thuế hoặc quyết toán. Mở bộ chuyển hoặc đổi tiền tệ cũng có thể hỏi tỷ giá nếu chưa có bộ nhớ đệm mới. Số tiền bạn gõ không được gửi.

## Ứng dụng web lũy tiến (PWA)

Nếu bạn cài đặt Kit hoặc cho phép sử dụng ngoại tuyến, service worker có thể lưu vào bộ nhớ đệm **vỏ ứng dụng** (trang, tập lệnh, kiểu và biểu tượng). Kit không được thiết kế để lưu trữ các tệp cá nhân của bạn trong bộ nhớ đệm đó.

## Trẻ em

Kit là tiện ích dành cho mục đích chung. Kit không hướng đến trẻ em dưới 13 tuổi và vì không cung cấp tài khoản, chúng tôi không cố ý thu thập thông tin cá nhân của trẻ em thông qua hệ thống đăng ký.

## Thay đổi

Chúng tôi có thể cập nhật chính sách này khi sản phẩm hoặc yêu cầu pháp lý thay đổi. Khi đó, chúng tôi sẽ sửa ngày “Cập nhật lần cuối”. Việc tiếp tục sử dụng Kit sau khi cập nhật có nghĩa là bạn đã xem chính sách sửa đổi.

## Liên hệ

Câu hỏi về quyền riêng tư: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Được xuất bản bởi **Tim G (GitHub: TGthms)**.
