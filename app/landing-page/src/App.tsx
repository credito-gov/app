import Features from './components/Features'
import Header from './components/Header'
import Hero from './components/Hero'
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
    </div>
  )
}

export default App
