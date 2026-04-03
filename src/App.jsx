/**
 * App — navigation shell for IrriCount Quick Quote PWA.
 * State-based routing: input → results → saved → settings.
 * Settings and inputs persisted to localStorage.
 */

import { useState, useCallback } from 'react'
import Nav from './components/Nav'
import InputScreen from './screens/InputScreen'
import ResultsScreen from './screens/ResultsScreen'
import SettingsScreen from './screens/SettingsScreen'
import SavedQuotesScreen from './screens/SavedQuotesScreen'
import { calculate } from './utils/calculations'
import { loadSettings, loadPrices, DEFAULT_INPUTS } from './utils/storage'

export default function App() {
  const [screen, setScreen] = useState('input')
  const [inputs, setInputs] = useState({ ...DEFAULT_INPUTS })
  const [results, setResults] = useState(null)
  const [settings, setSettings] = useState(() => loadSettings())
  const [prices, setPrices] = useState(() => loadPrices())

  // InputScreen passes both inputs and optional settings override
  function handleInputChange(newInputs, newSettings) {
    setInputs(newInputs)
    if (newSettings) setSettings(newSettings)
  }

  function handleCalculate() {
    const r = calculate(inputs, settings, prices)
    setResults(r)
    setScreen('results')
  }

  const handleRecallQuote = useCallback((quote) => {
    setInputs({ ...DEFAULT_INPUTS, ...quote.inputs })
    setResults(quote.results)
    setSettings(prev => ({ ...prev, ...quote.settingsSnapshot }))
    setScreen('results')
  }, [])

  function navigate(key) {
    if (key === 'input' && screen === 'results') {
      setScreen('input')
    } else {
      setScreen(key)
    }
  }

  const navScreens = ['input', 'saved', 'settings']
  const showNav = navScreens.includes(screen)

  return (
    <div
      className="flex flex-col h-full max-w-md mx-auto relative"
      style={{ paddingBottom: showNav ? 'calc(64px + env(safe-area-inset-bottom))' : 0 }}
    >
      {screen === 'input' && (
        <InputScreen
          inputs={inputs}
          settings={settings}
          onChange={handleInputChange}
          onCalculate={handleCalculate}
        />
      )}

      {screen === 'results' && results && (
        <ResultsScreen
          inputs={inputs}
          results={results}
          settings={settings}
          prices={prices}
          onBack={() => setScreen('input')}
          onSaved={() => {}}
        />
      )}

      {screen === 'saved' && (
        <SavedQuotesScreen
          settings={settings}
          onRecall={handleRecallQuote}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onSave={(updated) => setSettings(updated)}
          prices={prices}
          onSavePrices={(updated) => setPrices(updated)}
        />
      )}

      {showNav && (
        <Nav screen={screen} onNavigate={navigate} />
      )}
    </div>
  )
}
