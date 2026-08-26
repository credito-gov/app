import FaqAndFinalCta from './components/FaqAndFinalCta'
import Features from './components/Features'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Pricing from './components/Pricing'
import ProblemSolution from './components/ProblemSolution'
import SocialProof from './components/SocialProof'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Features />
      <Pricing />
      <FaqAndFinalCta />
      <Footer />
    </div>
  )
}

export default App
