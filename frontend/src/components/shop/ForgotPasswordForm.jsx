import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reset link sent to:', email);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setEmail('');
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-primary">Kiểm tra email của bạn</h2>
          <p className="text-main">Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn.</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 font-medium">Vui lòng kiểm tra và làm theo hướng dẫn.</p>
        </div>
        <Link to="/login" className="inline-block text-primary hover:text-primary/80 font-semibold transition-colors">
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Đặt lại mật khẩu</h1>
        <p className="text-main">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-main uppercase tracking-wider">Email</label>
          <div className="custom-input relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-main/60">
              <Mail size={18} />
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@lumix.vn"
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl outline-none transition-all placeholder-gray-400 text-main"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cta-3d"
        >
          Gửi hướng dẫn
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </form>

      <div className="text-center">
        <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors">
          <ArrowLeft size={18} />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
