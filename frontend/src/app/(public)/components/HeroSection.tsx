import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative lg:min-h-[600px] bg-gradient-to-br from-teal-50 to-mint-50 overflow-hidden py-6 lg:py-0"
      style={{
        background:
          "linear-gradient(135deg, rgba(168, 224, 211, 0.2) 0%, #F7FAF9 70.71%)",
      }}
    >
      <div className="max-w-[1440px] mx-auto relative px-10">
        {/* Background decorative element */}
        <div className="absolute right-10 top-0 aspect-[2/3] h-full">
          <Image
            src="/hero-curl-div.png"
            alt="Decorative background"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Small Banner */}
              <div className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="Book icon"
                >
                  <title>Book icon</title>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mượn sách miễn phí trực tiếp và online
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl text-gray-900 leading-tight">
                Thư viện cộng đồng cho mượn sách miễn phí
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
                Khám phá hàng ngàn đầu sách từ văn học, khoa học đến kỹ năng
                sống. Tham gia cộng đồng yêu sách và chia sẻ tri thức cùng nhau.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  Đăng ký
                </Link>
                <Link
                  href="/books"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors duration-200"
                >
                  Xem sách
                </Link>
              </div>
            </div>

            {/* Right Content - Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px] lg:h-[600px]">
                <div className="absolute inset-0 p-8">
                  <div className="relative w-full h-full">
                    <Image
                      src="/hero-image.png"
                      alt="Flying person with open book illustration"
                      fill
                      className="object-contain opacity-80"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
