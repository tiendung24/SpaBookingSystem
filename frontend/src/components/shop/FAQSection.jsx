import React, { useState } from 'react';

const faqItems = [
  {
    id: 1,
    question: 'Tôi có phải trả phí khởi tạo không?',
    answer: 'Không, LumiX hoàn toàn không thu phí khởi tạo hay phí lắp đặt. Bạn chỉ cần tạo tài khoản và bắt đầu sử dụng ngay lập tức.'
  },
  {
    id: 2,
    question: 'Dữ liệu khách hàng của tôi có được bảo mật không?',
    answer: 'Tuyệt đối bảo mật. Chúng tôi sử dụng công nghệ mã hóa đa lớp và máy chủ đặt tại các trung tâm dữ liệu hàng đầu để đảm bảo an toàn thông tin.'
  },
  {
    id: 3,
    question: 'Tôi có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào không?',
    answer: 'Có, bạn có thể thay đổi gói dịch vụ linh hoạt theo nhu cầu kinh doanh thực tế của shop ngay trên trang quản lý.'
  }
];

export default function FAQSection() {
  const [openId, setOpenId] = useState(null);

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="py-24 px-4 md:px-10 max-w-4xl mx-auto" id="faq">
      <h2 className="font-h2 text-[32px] text-main text-center mb-16">Câu hỏi thường gặp</h2>
      <div className="space-y-6">
        {faqItems.map((item) => (
          <details
            key={item.id}
            className="glass-card p-8 rounded-3xl border border-primary/10 group open:border-primary/50 transition-all cursor-pointer"
            open={openId === item.id}
          >
            <summary
              onClick={() => toggleFAQ(item.id)}
              className="flex justify-between items-center font-label-bold text-lg text-main list-none"
            >
              {item.question}
              <span className={`material-symbols-outlined transition-transform text-primary ${openId === item.id ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </summary>
            {openId === item.id && (
              <p className="font-body-md text-body-md text-main mt-6 leading-relaxed">
                {item.answer}
              </p>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}


