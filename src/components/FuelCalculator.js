import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './FuelCalculator.css';

const vehiclePresets = {
  'Small Car': { minEfficiency: 15, maxEfficiency: 20 },
  'SUV': { minEfficiency: 8, maxEfficiency: 12 },
  'Motorcycle': { minEfficiency: 25, maxEfficiency: 35 },
  'Hybrid': { minEfficiency: 20, maxEfficiency: 25 }
};

const FuelCalculator = () => {
  const [kmTraveled, setKmTraveled] = useState(140);
  const [fuelCost, setFuelCost] = useState(94);
  const [results, setResults] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('Small Car');
  const [tripFrequency, setTripFrequency] = useState('single');
  const [tripsPerPeriod, setTripsPerPeriod] = useState(1);
  const [tollCost, setTollCost] = useState(0);
  
  // Memoize efficiency range based on selected vehicle
  const efficiencyRange = useMemo(() => {
    const preset = vehiclePresets[selectedVehicle];
    return Array.from(
      { length: preset.maxEfficiency - preset.minEfficiency + 1 },
      (_, i) => preset.minEfficiency + i
    );
  }, [selectedVehicle]);
  
  const validateInputs = (km, cost, toll) => {
    if (km <= 0) return 'Distance must be greater than 0';
    if (cost <= 0) return 'Fuel cost must be greater than 0';
    if (toll < 0) return 'Toll cost cannot be negative';
    if (km > 10000) return 'Distance seems unusually high';
    if (cost > 1000) return 'Fuel cost seems unusually high';
    if (tripsPerPeriod < 1) return 'Number of trips must be at least 1';
    if (tripsPerPeriod > 100) return 'Number of trips seems unusually high';
    return '';
  };

  const calculateTotalCosts = (baseFuelCost) => {
    const tollCostPerTrip = parseFloat(tollCost) || 0;
    const tripsCount = parseInt(tripsPerPeriod) || 1;
    
    let multiplier = 1;
    switch(tripFrequency) {
      case 'monthly':
        multiplier = 1 * tripsCount;
        break;
      case 'yearly':
        multiplier = 12 * tripsCount;
        break;
      default: // single trip
        multiplier = 1;
    }
    
    return {
      fuelCost: baseFuelCost * multiplier,
      tollCost: tollCostPerTrip * multiplier,
      totalCost: (baseFuelCost + tollCostPerTrip) * multiplier
    };
  };

  useEffect(() => {
    const validationError = validateInputs(kmTraveled, fuelCost, tollCost);
    setError(validationError);
    
    if (!validationError) {
      calculateCosts();
    }
  }, [kmTraveled, fuelCost, tollCost, tripFrequency, tripsPerPeriod, efficiencyRange, selectedVehicle]);
  
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
          <label htmlFor="vehicleType">Vehicle Type</label>
          <select
            id="vehicleType"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="vehicle-select"
          >
            {Object.keys(vehiclePresets).map(vehicle => (
              <option key={vehicle} value={vehicle}>{vehicle}</option>
            ))}
          </select>
        </div>

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

      <div className="trip-details-section">
        <h2>Trip Details</h2>
        <div className="input-group">
          <div className="input-container">
            <label htmlFor="tripFrequency">Trip Frequency</label>
            <select
              id="tripFrequency"
              value={tripFrequency}
              onChange={(e) => setTripFrequency(e.target.value)}
              className="frequency-select"
            >
              <option value="single">Single Trip</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {tripFrequency !== 'single' && (
            <div className="input-container">
              <label htmlFor="tripsPerPeriod">
                Trips per {tripFrequency === 'monthly' ? 'Month' : 'Year'}
              </label>
              <input
                id="tripsPerPeriod"
                type="number"
                min="1"
                max="100"
                value={tripsPerPeriod}
                onChange={(e) => setTripsPerPeriod(parseInt(e.target.value) || 1)}
                aria-label={`Number of trips per ${tripFrequency}`}
              />
            </div>
          )}

          <div className="input-container">
            <label htmlFor="tollCost">Toll Cost per Trip</label>
            <input
              id="tollCost"
              type="number"
              min="0"
              value={tollCost}
              onChange={(e) => setTollCost(parseFloat(e.target.value) || 0)}
              aria-label="Toll cost per trip"
            />
          </div>
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

      {/* Cost Summary */}
      <div className="cost-summary">
        <h2>Cost Summary</h2>
        <div className="summary-grid">
          {results.map((result) => {
            const costs = calculateTotalCosts(result.cost);
            return (
              <div key={result.efficiency} className="summary-card">
                <h3>{result.efficiency} km/L</h3>
                <div className="summary-details">
                  <div className="cost-item">
                    <span>Fuel Cost:</span>
                    <span>₹{costs.fuelCost.toFixed(2)}</span>
                  </div>
                  {tollCost > 0 && (
                    <div className="cost-item">
                      <span>Toll Cost:</span>
                      <span>₹{costs.tollCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="cost-item total">
                    <span>Total Cost:</span>
                    <span>₹{costs.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="period">
                    {tripFrequency === 'single' 
                      ? 'Per Trip'
                      : `Per ${tripFrequency === 'monthly' ? 'Month' : 'Year'}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                <th key={eff}>vs {eff} km/L</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => {
              const costs = calculateTotalCosts(row.baseCost);
              return (
                <tr key={row.efficiency}>
                  <td className="bg-green-100">{row.efficiency} km/L</td>
                  <td className="bg-green-100">₹{costs.totalCost.toFixed(2)}</td>
                  {row.comparisons.map((diff, idx) => {
                    const comparisonEfficiency = efficiencyRange[idx];
                    const comparisonResult = results.find(r => r.efficiency === comparisonEfficiency);
                    if (!comparisonResult) return <td key={idx}>-</td>;
                    
                    const comparisonCosts = calculateTotalCosts(comparisonResult.cost);
                    const totalDiff = costs.totalCost - comparisonCosts.totalCost;
                    return (
                      <td 
                        key={idx} 
                        className={totalDiff < 0 ? 'text-green-600' : totalDiff > 0 ? 'text-red-600' : ''}
                        title={`Total cost difference between ${row.efficiency} km/L and ${comparisonEfficiency} km/L`}
                      >
                        {totalDiff > 0 ? '+' : ''}{totalDiff.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="help-text">
        <p>• The top table shows the total fuel cost for different fuel efficiency values.</p>
        <p>• The comparison matrix shows the total cost difference between each efficiency level (including toll costs).</p>
        <p>• Negative values (in green) indicate savings compared to the reference efficiency.</p>
        <p>• Positive values (in red) indicate additional costs compared to the reference efficiency.</p>
        <p>• Hover over any value to see a detailed comparison between the two efficiency levels.</p>
      </div>
    </div>
  );
};

FuelCalculator.propTypes = {
  initialKm: PropTypes.number,
  initialFuelCost: PropTypes.number,
};

export default FuelCalculator; 