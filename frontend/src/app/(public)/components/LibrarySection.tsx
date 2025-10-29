import Image from "next/image";

export default function LibrarySection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tag */}
        <div className="mb-8 inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Information icon"
          >
            <title>Information icon</title>
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
          </svg>
          Giới thiệu về thư viện
        </div>

        {/* Text Content */}
        <div className="mb-16">
          <div className="max-w-4xl">
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              D Free Book là không gian tri thức mở, nơi mọi người có thể tiếp cận sách miễn phí và chia sẻ niềm đam mê đọc sách. 
              Chúng tôi tin rằng tri thức thuộc về tất cả mọi người và không ai bị bỏ lại phía sau.
            </p>
          </div>

          {/* Branch Information */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Cơ sở Đại La</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Clock icon">
                  <title>Clock icon</title>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Thời gian mở cửa: 8h30 – 22h mỗi ngày.</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Location icon">
                  <title>Location icon</title>
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Địa chỉ: Số 107, khu tập thể A5, ngõ 128C Đại La.</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Phone icon">
                  <title>Phone icon</title>
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-gray-700">Liên hệ: 0962.188.248</span>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (1).png"
              alt="D Free Book exterior building sign"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (2).png"
              alt="Library interior with framed photos and decorations"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (3).png"
              alt="Library window with decorative metalwork"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (4).png"
              alt="Love Fund Box with decorative elements"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (5).png"
              alt="D Free Book building exterior with Vietnamese flag"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (6).png"
              alt="Student studying at library desk"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (7).png"
              alt="Library interior with bookshelves and decorations"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="relative w-full h-[192px]">
            <Image
              src="/img (8).png"
              alt="Close-up of colorful books on shelf"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
