import React from 'react';

const problems = [
  {
    icon: 'event_busy',
    title: 'Khó kiểm soát lịch',
    description: 'Lịch hẹn chồng chéo, khách phải chờ lâu gây ảnh hưởng đến uy tín của shop.'
  },
  {
    icon: 'notifications_off',
    title: 'Quên lịch khách',
    description: 'Không có hệ thống nhắc lịch tự động, dẫn đến việc bỏ lỡ những khách hàng quan trọng.'
  },
  {
    icon: 'group_remove',
    title: 'CRM rời rạc',
    description: 'Thông tin khách hàng lưu trên sổ sách dễ thất lạc, khó tra cứu lịch sử dịch vụ.'
  },
  {
    icon: 'money_off',
    title: 'Thất thoát doanh thu',
    description: 'Sai sót trong quá trình tính tiền và không theo dõi được báo cáo lãi lỗ chính xác.'
  }
];

export default function ProblemSection() {
  return (
    <section className="py-24 px-4 md:px-10">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="font-h2 text-[32px] text-main mb-4">Shop của bạn có đang gặp những vấn đề này?</h2>
        <div className="w-24 h-1.5 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full"></div>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {problems.map((problem, idx) => (
          <div key={idx} className="glass-card p-8 rounded-[32px] float-3d group">
            <div className="w-16 h-16 bg-error/20 text-error rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-[36px]">{problem.icon}</span>
            </div>
            <h3 className="font-h3 text-h3 mb-4 text-main">{problem.title}</h3>
            <p className="font-body-md text-body-md text-main">{problem.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
