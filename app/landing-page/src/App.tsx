import DashboardShowcase from './components/DashboardShowcase'
import Faq from './components/Faq'
import Features from './components/Features'
import FinalCta from './components/FinalCta'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import ProblemSolution from './components/ProblemSolution'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="h-[80px] w-full" aria-hidden="true" />
      <Hero />
      <HowItWorks />
      <DashboardShowcase />
      <ProblemSolution />
      <Features />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}

export default App
