import React from 'react';

const Features = () => {
  // Data for the three feature cards
  const featureList = [
    {
      title: "Easy Booking",
      desc: "Book any service in a few clicks. Our intuitive interface allows you to schedule machinery and operators for specific dates and times.",
      icon: "📱",
    },
    {
      title: "Verified Quality",
      desc: "All operators and equipment are strictly verified. We ensure that you get the best performance and value for your money.",
      icon: "✅",
    },
    {
      title: "Transparent Pricing",
      desc: "No hidden costs. Get clear upfront pricing and estimates for all services. Secure payments and detailed invoices for your records.",
      icon: "💰",
    }
  ];

  return (
    <section className="py-10 ">
      <div className="container mx-auto px-6">
        {/* Header Text */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="bg-white/20 backdrop-blur-md px-10 py-12 rounded-[5rem] shadow-xl border border-white/30 flex flex-col items-center gap-4">
            <h2 className="text-white font-extrabold uppercase tracking-widest text-sm mb-1 drop-shadow-md">About Our Platform</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-md">Why Choose Our Application?</h3>
            <p className="text-white text-lg font-medium max-w-2xl mx-auto drop-shadow-md">
              Designed with the specific needs of the farming community in mind, offering a seamless experience from booking to harvest.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-10">
          {featureList.map((feature, index) => (
            <div
              key={index}
              className="p-10 rounded-[4rem] bg-white/10 backdrop-blur-md border border-white/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h4 className="text-2xl font-bold mb-4 text-white drop-shadow-md">{feature.title}</h4>
              <p className="text-white/80 leading-relaxed text-lg drop-shadow-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;