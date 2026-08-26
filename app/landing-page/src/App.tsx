import DashboardShowcase from './components/DashboardShowcase'
import Faq from './components/Faq'
import Features from './components/Features'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import Metrics from './components/Metrics'
import Pricing from './components/Pricing'
import ProblemSolution from './components/ProblemSolution'
import SocialProof from './components/SocialProof'
import Testimonials from './components/Testimonials'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="h-[80px] w-full" aria-hidden="true" />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <DashboardShowcase />
      <ProblemSolution />
      <Features />
      <Metrics />
      <Testimonials />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  )
}

export default App
