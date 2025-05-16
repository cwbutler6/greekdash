import Link from "next/link";
import Image from "next/image";

// Feature icons components
const FeatureIcons = {
  ChapterCreation: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  MemberInvites: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  EventManagement: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  PublicWebpage: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  PaymentsDonations: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Communication: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  MemberPortal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  FileSharing: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};

export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative bg-white px-6 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight">
                Complete Greek Chapter Management Solution
              </h1>
              <p className="text-xl text-gray-600">
                Create your chapter, invite members, manage events, collect payments, and communicate seamlessly—all from one platform designed for Greek life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Create Your Chapter
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center px-8 py-3 border border-emerald-600 text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-emerald-50 transition-colors"
                >
                  Member Login
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="aspect-video bg-emerald-600/10 rounded-xl border-2 border-emerald-200 overflow-hidden relative shadow-lg">
                <Image 
                  src="/images/hero/dashboard-preview.svg" 
                  alt="GreekDash Dashboard Preview" 
                  fill 
                  className="object-cover" 
                  priority 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent p-4 text-sm text-emerald-800 font-medium text-center">
                  Admin dashboard shown above — member portal also included
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chapter admin features in icon grid */}
        <div className="mx-auto max-w-7xl mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Everything Chapter Administrators Need</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "ChapterCreation", text: "Create Chapter" },
              { icon: "MemberInvites", text: "Invite Members" },
              { icon: "EventManagement", text: "Manage Events" },
              { icon: "PublicWebpage", text: "Public Web Page" },
              { icon: "PaymentsDonations", text: "Process Payments" },
              { icon: "Communication", text: "Email Members" },
              { icon: "MemberPortal", text: "Member Portal" },
              { icon: "FileSharing", text: "Share Files" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center p-2 text-center">
                <div className="h-10 w-10 flex items-center justify-center text-emerald-600 mb-2">
                  {item.icon === "ChapterCreation" && <FeatureIcons.ChapterCreation />}
                  {item.icon === "MemberInvites" && <FeatureIcons.MemberInvites />}
                  {item.icon === "EventManagement" && <FeatureIcons.EventManagement />}
                  {item.icon === "PublicWebpage" && <FeatureIcons.PublicWebpage />}
                  {item.icon === "PaymentsDonations" && <FeatureIcons.PaymentsDonations />}
                  {item.icon === "Communication" && <FeatureIcons.Communication />}
                  {item.icon === "MemberPortal" && <FeatureIcons.MemberPortal />}
                  {item.icon === "FileSharing" && <FeatureIcons.FileSharing />}
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-1 left-0 right-0 h-8 bg-emerald-600/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-bl-full"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-emerald-600/5 px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black">
              Powerful Features For Chapter Admins & Members
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run your chapter efficiently and engage your membership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Create Your Chapter",
                description: "Set up your chapter in minutes with a unique URL, branding, and customizable settings for your organization.",
                icon: <FeatureIcons.ChapterCreation />
              },
              {
                title: "Invite & Manage Members",
                description: "Send invitations, approve applications, and maintain a complete membership directory with profiles and roles.",
                icon: <FeatureIcons.MemberInvites />
              },
              {
                title: "Event Management",
                description: "Create, schedule, and promote chapter events. Track RSVPs, attendance, and collect event-specific payments.",
                icon: <FeatureIcons.EventManagement />
              },
              {
                title: "Public Chapter Website",
                description: "Every chapter gets a customizable public web page for recruiting new members and showcasing chapter activities.",
                icon: <FeatureIcons.PublicWebpage />
              },
              {
                title: "Payments & Donations",
                description: "Collect dues, process event fees, and accept donations with secure integrated payment processing.",
                icon: <FeatureIcons.PaymentsDonations />
              },
              {
                title: "Email Communication",
                description: "Send targeted emails to your entire chapter or specific member groups. Create newsletters and announcements.",
                icon: <FeatureIcons.Communication />
              },
              {
                title: "Member Portal Access",
                description: "Members get their own login to access events, pay dues, update profiles, and connect with other members.",
                icon: <FeatureIcons.MemberPortal />
              },
              {
                title: "Financial Tracking",
                description: "Track chapter finances, create budgets, record expenses, and generate financial reports.",
                icon: <FeatureIcons.FileSharing />
              },
              {
                title: "Document Sharing",
                description: "Securely store and share important documents, bylaws, meeting minutes, and resources with your members.",
                icon: <FeatureIcons.FileSharing />
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="w-12 h-12 mb-4 text-emerald-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                <p className="text-gray-600 flex-grow">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white px-6 py-16 md:py-24">
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
      <section id="testimonials" className="bg-emerald-600/5 px-6 py-16 md:py-24">
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
      <section id="faq" className="bg-white px-6 py-16 md:py-24">
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
            Ready to transform your chapter management?
          </h2>
          <p className="text-white/90 text-lg mb-6">
            Join thousands of fraternity and sorority chapters using GreekDash to streamline operations and engage members.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-gray-100 transition-colors shadow-md"
            >
              Create Your Chapter
            </Link>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-emerald-700 transition-colors"
            >
              Member Login
            </Link>
          </div>
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
