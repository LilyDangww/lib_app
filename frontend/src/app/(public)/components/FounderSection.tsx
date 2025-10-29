import Image from "next/image";

export default function FounderSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Tag */}
        <div className="mb-12 inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-normal">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Person icon"
          >
            <title>Person icon</title>
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          Nhà sáng lập thư viện
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Image */}
          <div className="relative w-full h-full">
            <Image
              src="/img.png"
              alt="Hoàng Quý Bình - Founder of D Free Book"
              fill
              className="object-cover rounded-xl"
              priority
            />
          </div>

          {/* Right Column - Content */}
          <div>
            {/* Main Heading */}
            <h2 className="text-4xl sm:text-4xl text-[#171717] leading-tight mb-[18px]">
              Nhà sáng lập D Free Book
            </h2>

            {/* Body Paragraph */}
            <div className="prose prose-lg text-gray-600 leading-relaxed mb-6">
              <p>
                D Free Book được thành lập năm 2017 bởi Hoàng Quý Bình – cựu
                sinh viên Đại học Bách khoa Hà Nội. Từ tủ sách cá nhân với 300
                đầu sách của mình, Bình thu thập thêm nhiều đầu sách các loại
                cho các bạn cùng xóm trọ và quanh khu vực trường đến đọc. Và
                rồi, quyết định táo bạo nhất của anh là thành lập một thư viện
                cộng đồng với cơ sở đầu tiên đặt tại một khu tập thể trên phố Lê
                Thanh Nghị. Tri thức bắt đầu được lan tỏa như thế.
              </p>
            </div>

            {/* Quote Section */}
            <div className="bg-orange-50 border-l-4 border-orange-300 p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="text-orange-500 text-4xl font-bold leading-none">
                  "
                </div>
                <blockquote className="text-xl font-medium text-gray-800 italic">
                  Sách nằm im là sách chết
                </blockquote>
                <div className="text-orange-500 text-4xl font-bold leading-none">
                  "
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
