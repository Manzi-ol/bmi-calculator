import { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'

const HISTORY_KEY = 'bmi-history-v1'

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm === 0) return null
  const hm = heightCm / 100
  return weightKg / (hm * hm)
}

function toKgCm(weight, height, heightFt, heightIn, unit) {
  if (unit === 'metric') return { weightKg: parseFloat(weight), heightCm: parseFloat(height) }
  const kg = parseFloat(weight) * 0.453592
  const cm = (parseFloat(heightFt || 0) * 12 + parseFloat(heightIn || 0)) * 2.54
  return { weightKg: kg, heightCm: cm }
}

function getCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#6090e0', desc: 'Your BMI is below the healthy range. Consider consulting a healthcare provider for guidance on reaching a healthy weight.' }
  if (bmi < 25) return { label: 'Normal weight', color: '#6ee7a0', desc: 'Great news! Your BMI is in the healthy range. Maintaining this through balanced diet and regular exercise is key.' }
  if (bmi < 30) return { label: 'Overweight', color: '#c9973a', desc: 'Your BMI is slightly above the healthy range. Small lifestyle changes can help move toward a healthier weight.' }
  return { label: 'Obese', color: '#e06060', desc: 'Your BMI is significantly above the healthy range. A healthcare provider can help develop a safe plan to reach a healthier weight.' }
}

function getTips(bmi) {
  if (bmi < 18.5) return [
    { icon: '🍽️', text: 'Increase caloric intake with nutrient-dense foods like nuts, avocados, whole grains, and lean protein.' },
    { icon: '💪', text: 'Add strength training to your routine to build muscle mass safely and effectively.' },
    { icon: '🩺', text: 'Consult a doctor or dietitian to rule out underlying conditions affecting your weight.' },
    { icon: '😴', text: 'Ensure 7–9 hours of quality sleep — sleep is critical for healthy weight maintenance.' },
  ]
  if (bmi < 25) return [
    { icon: '✅', text: 'You\'re in the healthy range! Maintain your weight with balanced meals and regular physical activity.' },
    { icon: '🥗', text: 'Focus on a varied diet: plenty of vegetables, fruits, lean proteins, and whole grains.' },
    { icon: '🏃', text: 'Aim for 150 minutes of moderate aerobic activity per week, plus 2 strength sessions.' },
    { icon: '💧', text: 'Stay hydrated — drink at least 2 litres of water per day to support metabolism.' },
  ]
  if (bmi < 30) return [
    { icon: '🚶', text: 'Add 30 minutes of brisk walking daily — it\'s one of the most effective ways to reduce body fat.' },
    { icon: '🥦', text: 'Reduce ultra-processed foods and refined sugars; replace with vegetables and whole foods.' },
    { icon: '📏', text: 'Track your meals for a week to understand your caloric intake and identify areas to improve.' },
    { icon: '🧘', text: 'Manage stress levels — chronic stress raises cortisol, which promotes fat storage around the abdomen.' },
  ]
  return [
    { icon: '🩺', text: 'Consult a healthcare provider for a medically supervised weight management plan.' },
    { icon: '🏊', text: 'Start with low-impact exercise like swimming or cycling to protect your joints while getting active.' },
    { icon: '🍱', text: 'Reduce portion sizes gradually rather than drastically cutting calories, which can be counterproductive.' },
    { icon: '🛌', text: 'Prioritize sleep — poor sleep is strongly linked to weight gain and difficulty losing weight.' },
  ]
}

function idealWeightRange(heightCm) {
  if (!heightCm || heightCm <= 0) return null
  const hm = heightCm / 100
  const low = Math.round(18.5 * hm * hm)
  const high = Math.round(24.9 * hm * hm)
  return { low, high }
}

function estimateBodyFat(bmi, age, sex) {
  // Deurenberg formula
  const a = parseFloat(age) || 25
  const s = sex === 'female' ? 1 : 0
  const bf = (1.2 * bmi) + (0.23 * a) - (10.8 * (1 - s)) - 5.4
  return Math.max(1, Math.min(60, Math.round(bf * 10) / 10))
}

function bmiToScalePct(bmi) {
  // Map bmi 10–45 to 0–100%
  return Math.min(100, Math.max(0, ((bmi - 10) / 35) * 100))
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function App() {
  const [unit, setUnit] = useState('metric')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('male')
  const [result, setResult] = useState(null)
  const [animKey, setAnimKey] = useState(0)
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem(HISTORY_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
  })

  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) }, [history])

  const handleCalculate = useCallback(() => {
    const { weightKg, heightCm } = toKgCm(weight, height, heightFt, heightIn, unit)
    const bmi = calcBMI(weightKg, heightCm)
    if (!bmi || isNaN(bmi) || bmi < 5 || bmi > 80) return
    const cat = getCategory(bmi)
    const ideal = idealWeightRange(heightCm)
    const bf = estimateBodyFat(bmi, age, sex)
    const entry = { bmi: Math.round(bmi * 10) / 10, date: new Date().toISOString(), color: cat.color }
    setResult({ bmi: Math.round(bmi * 10) / 10, bmiRaw: bmi, cat, ideal, bf, weightKg, heightCm })
    setAnimKey(k => k + 1)
    setHistory(prev => {
      const updated = [entry, ...prev.filter(h => h.date !== entry.date)].slice(0, 5)
      return updated
    })
  }, [weight, height, heightFt, heightIn, unit, age, sex])

  const tips = useMemo(() => result ? getTips(result.bmiRaw) : [], [result])
  const scalePct = result ? bmiToScalePct(result.bmiRaw) : 0
  const histMax = useMemo(() => history.length ? Math.max(...history.map(h => h.bmi)) : 40, [history])

  const fmtWeight = (kg) => {
    if (unit === 'metric') return `${Math.round(kg)} kg`
    return `${Math.round(kg / 0.453592)} lb`
  }

  return (
    <div className="app">
      <header className="header">
        <h1>BMI Calculator</h1>
        <p>#15 of Manzi's 100 GitHub Projects Roadmap</p>
      </header>

      <div className="main">
        {/* Unit Toggle */}
        <div className="unit-toggle">
          <button className={`unit-btn${unit === 'metric' ? ' active' : ''}`} onClick={() => setUnit('metric')}>Metric</button>
          <button className={`unit-btn${unit === 'imperial' ? ' active' : ''}`} onClick={() => setUnit('imperial')}>Imperial</button>
        </div>

        {/* Inputs */}
        <div className="input-section">
          <div className="input-card">
            <label>Weight</label>
            <div className="input-row">
              <input className="input-field" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder={unit === 'metric' ? '70' : '154'} min="0" />
              <div className="input-unit">{unit === 'metric' ? 'kg' : 'lb'}</div>
            </div>
          </div>
          <div className="input-card">
            <label>Height</label>
            {unit === 'metric' ? (
              <div className="input-row">
                <input className="input-field" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" min="0" />
                <div className="input-unit">cm</div>
              </div>
            ) : (
              <div className="input-row">
                <input className="input-field" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" min="0" style={{ maxWidth: 70 }} />
                <div className="input-unit">ft</div>
                <input className="input-field" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="9" min="0" max="11" style={{ maxWidth: 70 }} />
                <div className="input-unit">in</div>
              </div>
            )}
          </div>
          <div className="input-card">
            <label>Age (optional)</label>
            <div className="input-row">
              <input className="input-field" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" min="1" max="120" />
              <div className="input-unit">yrs</div>
            </div>
          </div>
          <div className="input-card">
            <label>Sex (for body fat %)</label>
            <div className="input-row">
              <button
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: sex === 'male' ? 'var(--accent)' : 'transparent', color: sex === 'male' ? '#0f1a13' : 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setSex('male')}
              >Male</button>
              <button
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: sex === 'female' ? 'var(--accent)' : 'transparent', color: sex === 'female' ? '#0f1a13' : 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setSex('female')}
              >Female</button>
            </div>
          </div>
        </div>

        <button className="btn-calc" onClick={handleCalculate}>Calculate BMI</button>

        {/* Result */}
        {result && (
          <div className="result-section" key={animKey}>
            <div className="result-top">
              <div className="result-bmi" style={{ color: result.cat.color }}>{result.bmi}</div>
              <div>
                <div className="result-category" style={{ color: result.cat.color }}>{result.cat.label}</div>
                <div className="result-desc">{result.cat.desc}</div>
              </div>
            </div>

            {/* Scale */}
            <div className="bmi-scale">
              <div className="bmi-scale-label">BMI Scale</div>
              <div className="bmi-scale-bar">
                <div className="bmi-pointer" style={{ left: `${scalePct}%` }} />
              </div>
              <div className="bmi-scale-ticks">
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>

            <div className="result-extras">
              <div className="extra-item">
                <div className="extra-label">Body Fat Est.</div>
                <div className="extra-value" style={{ color: result.cat.color }}>{result.bf}%</div>
              </div>
              {result.ideal && (
                <div className="extra-item">
                  <div className="extra-label">Ideal Weight Range</div>
                  <div className="extra-value" style={{ color: '#6ee7a0' }}>{fmtWeight(result.ideal.low)} – {fmtWeight(result.ideal.high)}</div>
                </div>
              )}
              <div className="extra-item">
                <div className="extra-label">Your BMI Category</div>
                <div className="extra-value" style={{ color: result.cat.color }}>{result.cat.label}</div>
              </div>
              <div className="extra-item">
                <div className="extra-label">Healthy BMI Range</div>
                <div className="extra-value">18.5 – 24.9</div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {result && (
          <div className="tips-section">
            <h3>Health Tips for You</h3>
            <div className="tip-list">
              {tips.map((tip, i) => (
                <div className="tip-item" key={i}>
                  <span className="tip-icon">{tip.icon}</span>
                  <span className="tip-text">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="history-section">
          <h3>BMI History (last 5)</h3>
          {history.length === 0 ? (
            <div className="history-empty">No history yet. Calculate your BMI to start tracking.</div>
          ) : (
            <div className="history-chart">
              {history.slice().reverse().map((h, i) => {
                const pct = histMax > 0 ? (h.bmi / (histMax * 1.2)) * 100 : 50
                return (
                  <div className="hist-bar-col" key={i}>
                    <div className="hist-val">{h.bmi}</div>
                    <div className="hist-bar-wrap">
                      <div className="hist-bar" style={{ height: `${pct}%`, background: h.color }} />
                    </div>
                    <div className="hist-date">{formatDate(h.date)}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
