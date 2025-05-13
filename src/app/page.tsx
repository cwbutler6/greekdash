import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative bg-white px-6 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
                All-in-One Chapter Management, Made Easy
              </h1>
              <p className="text-xl text-gray-600">
                Streamline your chapter operations and grow your Greek community with ease.
              </p>
              <div>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="aspect-video bg-emerald-600/10 rounded-xl border-2 border-emerald-200 overflow-hidden relative">
                <Image 
                  src="/images/hero/dashboard-preview.svg" 
                  alt="GreekDash Dashboard Preview" 
                  fill 
                  className="object-cover" 
                  priority 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-1 left-0 right-0 h-8 bg-emerald-600/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-bl-full"></div>
      </section>

      {/* Features Section */}
      <section className="bg-emerald-600/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Features Built for Greek Life
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything your chapter needs to thrive, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Event Management",
                description: "Schedule, manage, and track attendance for all chapter events.",
                icon: "event-management"
              },
              {
                title: "Membership Directory",
                description: "Keep your member information organized and accessible.",
                icon: "membership"
              },
              {
                title: "Communication Tools",
                description: "Connect your chapter with announcements and messaging.",
                icon: "communication"
              },
              {
                title: "Dues & Finances",
                description: "Collect dues, manage your budget, and track expenses.",
                icon: "finances"
              },
              {
                title: "Points Tracking",
                description: "Award points for participation and track member engagement.",
                icon: "points"
              },
              {
                title: "File Sharing",
                description: "Securely store and share important chapter documents.",
                icon: "files"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mb-4 relative">
                  <Image 
                    src={`/images/features/${feature.title === 'Event Management' ? 'event-management' : 
                          feature.title === 'Membership Directory' ? 'membership' : 
                          feature.title === 'Communication Tools' ? 'communication' : 
                          feature.title === 'Dues & Finances' ? 'finances' : 
                          feature.title === 'Points Tracking' ? 'points' : 'files'}.svg`} 
                    alt={feature.title} 
                    width={48}
                    height={48}
                  />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your chapter&apos;s needs and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="bg-emerald-600 p-6 text-white text-center">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="mt-1">Get started with the basics</p>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-center pb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 flex-grow mb-6">
                  {["Up to 30 members", "Basic event management", "Member directory", "File sharing (100MB)"].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link 
                    href="/login" 
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-[#00b894] text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-600/5 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Basic Plan */}
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-md flex flex-col h-full">
              <div className="bg-gray-100 p-6 text-center">
                <h3 className="text-2xl font-bold">Basic</h3>
                <p className="mt-1">For growing chapters</p>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-center pb-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 flex-grow mb-6">
                  {[
                    "Unlimited members",
                    "Advanced event management",
                    "Points tracking system",
                    "File sharing (1GB)",
                    "Dues collection tools"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link 
                    href="/login" 
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                  >
                    Upgrade to Basic
                  </Link>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-lg relative flex flex-col h-full">
              <div className="absolute top-0 right-0 bg-black text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                Most Popular
              </div>
              <div className="bg-gray-100 p-6 text-center">
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="mt-1">For established chapters</p>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-center pb-4">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 flex-grow mb-6">
                  {[
                    "Everything in Basic",
                    "Custom branding",
                    "Advanced analytics",
                    "API access",
                    "File sharing (10GB)",
                    "Priority support",
                    "Custom integrations"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-emerald-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link 
                    href="/login" 
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-emerald-600/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              What Chapters Are Saying
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it — hear from our satisfied chapters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "GreekDash has transformed how we manage our chapter. The event planning tools alone have saved us countless hours.",
                name: "Michael Thomas",
                title: "Chapter President, Alpha Beta Gamma"
              },
              {
                quote: "The dues collection feature has increased our payment rate by 40%. I can&apos;t imagine managing our finances without it now.",
                name: "Sarah Johnson",
                title: "Treasurer, Delta Phi Epsilon"
              },
              {
                quote: "Our members love the points tracking system. It&apos;s created a fun competitive atmosphere that&apos;s boosted participation.",
                name: "James Wilson",
                title: "Member Engagement Chair, Zeta Theta Iota"
              }
            ].map((testimonial, i) => (
              <blockquote key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-emerald-600 text-4xl font-serif mb-4">&quot;</div>
                <p className="text-gray-600 mb-6">{testimonial.quote}</p>
                <footer>
                  <div className="font-medium text-black">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.title}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                question: "Is there a free plan?",
                answer: "Yes! We offer a free plan for chapters with up to 30 members. It includes basic event management, a member directory, and limited file sharing."
              },
              {
                question: "How secure is my chapter&apos;s data?",
                answer: "We take security very seriously. All data is encrypted both in transit and at rest. We employ industry-standard security practices and regular audits to ensure your chapter&apos;s data remains secure."
              },
              {
                question: "Can we switch plans later?",
                answer: "Absolutely! You can upgrade or downgrade your plan at any time. If you upgrade, the changes take effect immediately. If you downgrade, the changes will take effect at the end of your current billing cycle."
              },
              {
                question: "Is there a contract or commitment?",
                answer: "GreekDash operates on a month-to-month basis with no long-term contracts required. You can cancel at any time."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes, we offer a 15% discount when you choose annual billing instead of monthly billing."
              }
            ].map((faq, i) => (
              <div key={i} className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-bold text-black mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-emerald-600 px-6 py-12">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to grow your chapter?
          </h2>
          <p className="text-white/90 text-lg mb-6">
            Get started with GreekDash today and see the difference.
          </p>
          <Link 
            href="/auth/login" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-gray-100 transition-colors shadow-md"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white px-6 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold mb-4">GreekDash</div>
              <p className="text-gray-400 mb-4">
                All-in-one chapter management, made easy.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  📱
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  💻
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  📧
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                {["Features", "Pricing", "Testimonials", "FAQ"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                {["About Us", "Blog", "Careers", "Contact"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Stay Updated</h3>
              <p className="text-gray-400 mb-4">
                Subscribe to our newsletter for tips, updates, and Greek life insights.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 w-full rounded-l-md text-black"
                />
                <button className="bg-emerald-600 px-4 py-2 rounded-r-md hover:bg-emerald-700 transition-colors">
                  →
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} GreekDash. All rights reserved.
            </div>
            <div className="flex space-x-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, i) => (
                <a key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
