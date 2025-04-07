import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './FuelCalculator.css';

const FuelCalculator = () => {
  const [kmTraveled, setKmTraveled] = useState(140);
  const [fuelCost, setFuelCost] = useState(94);
  const [results, setResults] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [error, setError] = useState('');
  
  // Memoize efficiency range
  const efficiencyRange = useMemo(() => 
    [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    []
  );
  
  const validateInputs = (km, cost) => {
    if (km <= 0) return 'Distance must be greater than 0';
    if (cost <= 0) return 'Fuel cost must be greater than 0';
    if (km > 10000) return 'Distance seems unusually high';
    if (cost > 1000) return 'Fuel cost seems unusually high';
    return '';
  };

  useEffect(() => {
    const validationError = validateInputs(kmTraveled, fuelCost);
    setError(validationError);
    
    if (!validationError) {
      calculateCosts();
    }
  }, [kmTraveled, fuelCost]);
  
  const calculateCosts = () => {
    if (!kmTraveled || !fuelCost) return;
    
    try {
      // Calculate fuel costs for each efficiency
      const calculatedResults = efficiencyRange.map(efficiency => {
        const litersUsed = kmTraveled / efficiency;
        const cost = litersUsed * fuelCost;
        return {
          efficiency,
          cost: parseFloat(cost.toFixed(3))
        };
      });
      setResults(calculatedResults);
      
      // Create comparison matrix with memoization
      const comparisonMatrix = efficiencyRange.map(rowEff => {
        const rowCost = calculatedResults.find(r => r.efficiency === rowEff).cost;
        
        return {
          efficiency: rowEff,
          baseCost: rowCost,
          comparisons: efficiencyRange.map(colEff => {
            const colCost = calculatedResults.find(r => r.efficiency === colEff).cost;
            const diff = (rowCost - colCost).toFixed(3);
            return Math.abs(parseFloat(diff)) < 0.01 ? 0 : parseFloat(diff);
          })
        };
      });
      
      setComparisons(comparisonMatrix);
    } catch (err) {
      setError('An error occurred during calculation');
      console.error(err);
    }
  };
  
  return (
    <div className="fuel-calculator">
      <h1>Car Fuel Cost Calculator</h1>
      
      {error && (
        <div className="bg-red-100" role="alert">
          {error}
        </div>
      )}
      
      <div className="input-group">
        <div className="input-container">
          <label htmlFor="kmTraveled">Total KM Traveled</label>
          <input
            id="kmTraveled"
            type="number"
            min="0"
            max="10000"
            value={kmTraveled}
            onChange={(e) => setKmTraveled(parseFloat(e.target.value) || 0)}
            aria-label="Total kilometers traveled"
          />
        </div>
        
        <div className="input-container">
          <label htmlFor="fuelCost">Fuel Cost Per Liter</label>
          <input
            id="fuelCost"
            type="number"
            min="0"
            max="1000"
            value={fuelCost}
            onChange={(e) => setFuelCost(parseFloat(e.target.value) || 0)}
            aria-label="Fuel cost per liter"
          />
        </div>
      </div>
      
      {/* Results Table */}
      <div className="table-container">
        <h2>Fuel Cost Results</h2>
        <table>
          <thead>
            <tr>
              <th>Distance (Km)</th>
              <th>Fuel Cost/L</th>
              {efficiencyRange.map((eff) => (
                <th key={eff} className="bg-yellow-100">{eff} km/L</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{kmTraveled}</td>
              <td>{fuelCost}</td>
              {results.map((result) => (
                <td key={result.efficiency} className="bg-yellow-100">
                  ₹{result.cost}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Comparison Matrix */}
      <div className="table-container">
        <h2>Cost Comparison Matrix</h2>
        <table>
          <thead>
            <tr>
              <th>Efficiency (Km/L)</th>
              <th>Total Cost</th>
              {efficiencyRange.map((eff) => (
                <th key={eff}>{eff} km/L</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <tr key={row.efficiency}>
                <td className="bg-green-100">{row.efficiency}</td>
                <td className="bg-green-100">₹{row.baseCost}</td>
                {row.comparisons.map((diff, idx) => (
                  <td key={idx} className={diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : ''}>
                    {diff > 0 ? '+' : ''}{diff}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="help-text">
        <p>• The top table shows the total fuel cost for different fuel efficiency values (10-22 km/L).</p>
        <p>• The comparison matrix shows the cost difference between each efficiency level.</p>
        <p>• Negative values (in green) indicate savings compared to the reference efficiency.</p>
        <p>• Positive values (in red) indicate additional costs compared to the reference efficiency.</p>
      </div>
    </div>
  );
};

FuelCalculator.propTypes = {
  initialKm: PropTypes.number,
  initialFuelCost: PropTypes.number,
};

export default FuelCalculator; 