import './App.css'
import { EchoSubmitForm } from '@/components/custom/EchoSubmitForm'

function App() {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
            Ephemeral Echoes
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 sm:mt-4">
            Drop a thought. Catch a whisper.
          </p>
        </header>
        
        <section className="flex justify-center mb-8">
          <EchoSubmitForm />
        </section>

        {/* Future section for catching echoes */}
        {/* 
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Discover an Echo</h2>
          <div className="flex justify-center">
            <Button>Catch an Echo</Button> 
          </div>
          {/* Display Echo content here }
        </section>
        */}
      </div>
    </main>
  )
}

export default App
