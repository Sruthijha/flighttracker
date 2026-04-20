import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { AIRLINES, AIRPORTS } from '../data/airlines';
import { format } from 'date-fns';

const EMPTY_FLIGHT = {
  airlineIATA: '',
  airlineName: '',
  airlineColor: '',
  flightNumber: '',
  departureAirport: '',
  departureCity: '',
  departureCountry: '',
  arrivalAirport: '',
  arrivalCity: '',
  arrivalCountry: '',
  departureDateTime: '',
  arrivalDateTime: '',
  status: 'completed',
  notes: '',
};

export default function TripModal({ user, editTrip, onClose }) {
  const [tripName, setTripName] = useState(editTrip?.name || '');
  const [flights, setFlights] = useState(editTrip?.flights || [{ ...EMPTY_FLIGHT }]);
  const [saving, setSaving] = useState(false);
  const [airlineSearch, setAirlineSearch] = useState(Array(flights.length).fill(''));
  const [airlineDropdown, setAirlineDropdown] = useState(-1);
  const [deptSearch, setDeptSearch] = useState(Array(flights.length).fill(''));
  const [deptDropdown, setDeptDropdown] = useState(-1);
  const [arrSearch, setArrSearch] = useState(Array(flights.length).fill(''));
  const [arrDropdown, setArrDropdown] = useState(-1);

  const updateFlight = (idx, key, value) => {
    setFlights(prev => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const addFlight = () => {
    setFlights(prev => [...prev, { ...EMPTY_FLIGHT }]);
    setAirlineSearch(prev => [...prev, '']);
    setDeptSearch(prev => [...prev, '']);
    setArrSearch(prev => [...prev, '']);
  };

  const removeFlight = (idx) => {
    setFlights(prev => prev.filter((_, i) => i !== idx));
    setAirlineSearch(prev => prev.filter((_, i) => i !== idx));
    setDeptSearch(prev => prev.filter((_, i) => i !== idx));
    setArrSearch(prev => prev.filter((_, i) => i !== idx));
  };

  const selectAirline = (idx, airline) => {
    updateFlight(idx, 'airlineIATA', airline.iata);
    updateFlight(idx, 'airlineName', airline.name);
    updateFlight(idx, 'airlineColor', airline.color);
    setAirlineSearch(prev => prev.map((s, i) => i === idx ? airline.name : s));
    setAirlineDropdown(-1);
  };

  const selectAirport = (idx, airport, type) => {
    if (type === 'dep') {
      updateFlight(idx, 'departureAirport', airport.iata);
      updateFlight(idx, 'departureCity', airport.city);
      updateFlight(idx, 'departureCountry', airport.country);
      setDeptSearch(prev => prev.map((s, i) => i === idx ? `${airport.iata} - ${airport.city}` : s));
      setDeptDropdown(-1);
    } else {
      updateFlight(idx, 'arrivalAirport', airport.iata);
      updateFlight(idx, 'arrivalCity', airport.city);
      updateFlight(idx, 'arrivalCountry', airport.country);
      setArrSearch(prev => prev.map((s, i) => i === idx ? `${airport.iata} - ${airport.city}` : s));
      setArrDropdown(-1);
    }
  };

  const filteredAirlines = (search) => AIRLINES.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.iata.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const filteredAirports = (search) => AIRPORTS.filter(a =>
    a.iata.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const handleSave = async (e) => {
    e.preventDefault();
    if (flights.length === 0) return;
    setSaving(true);
    try {
      const data = {
        uid: user.uid,
        name: tripName || `${flights[0]?.departureAirport || '?'} → ${flights[flights.length - 1]?.arrivalAirport || '?'}`,
        flights,
        updatedAt: new Date().toISOString(),
      };
      if (editTrip) {
        await setDoc(doc(db, 'trips', editTrip.id), data);
      } else {
        await addDoc(collection(db, 'trips'), { ...data, createdAt: new Date().toISOString() });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save trip. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{editTrip ? 'Edit Trip' : 'New Trip'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="field-group">
            <label>Trip Name <span className="optional">(optional)</span></label>
            <input
              type="text"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              placeholder="e.g. India Trip 2024, Thanksgiving Weekend..."
            />
          </div>

          <div className="flights-section">
            <div className="flights-section-header">
              <h3>Flights ({flights.length})</h3>
              <p className="section-hint">Add all legs of this trip — layovers are calculated automatically.</p>
            </div>

            {flights.map((flight, idx) => (
              <div key={idx} className="flight-form-block">
                <div className="flight-form-header">
                  <span className="leg-label">Flight {idx + 1}</span>
                  {flights.length > 1 && (
                    <button type="button" className="remove-btn" onClick={() => removeFlight(idx)}>Remove</button>
                  )}
                </div>

                {/* Airline Autocomplete */}
                <div className="field-group autocomplete-group">
                  <label>Airline</label>
                  <div className="autocomplete-wrap">
                    <input
                      type="text"
                      value={airlineSearch[idx]}
                      onChange={e => {
                        setAirlineSearch(prev => prev.map((s, i) => i === idx ? e.target.value : s));
                        setAirlineDropdown(idx);
                        updateFlight(idx, 'airlineName', '');
                      }}
                      onFocus={() => setAirlineDropdown(idx)}
                      placeholder="Search airline name or IATA code..."
                      autoComplete="off"
                    />
                    {flight.airlineColor && (
                      <span className="airline-dot" style={{ background: flight.airlineColor }} />
                    )}
                    {airlineDropdown === idx && airlineSearch[idx] && (
                      <div className="dropdown">
                        {filteredAirlines(airlineSearch[idx]).map(a => (
                          <div key={a.iata} className="dropdown-item" onMouseDown={() => selectAirline(idx, a)}>
                            <span className="dd-iata" style={{ background: a.color + '22', color: a.color }}>{a.iata}</span>
                            <span>{a.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flight Number */}
                <div className="field-group">
                  <label>Flight Number</label>
                  <input
                    type="text"
                    value={flight.flightNumber}
                    onChange={e => updateFlight(idx, 'flightNumber', e.target.value.toUpperCase())}
                    placeholder={flight.airlineIATA ? `${flight.airlineIATA}123` : 'e.g. UA2451'}
                  />
                </div>

                {/* Departure Airport */}
                <div className="field-row">
                  <div className="field-group autocomplete-group flex-1">
                    <label>From</label>
                    <div className="autocomplete-wrap">
                      <input
                        type="text"
                        value={deptSearch[idx]}
                        onChange={e => {
                          setDeptSearch(prev => prev.map((s, i) => i === idx ? e.target.value : s));
                          setDeptDropdown(idx);
                        }}
                        onFocus={() => setDeptDropdown(idx)}
                        placeholder="DEN or Denver..."
                        autoComplete="off"
                      />
                      {deptDropdown === idx && deptSearch[idx] && (
                        <div className="dropdown">
                          {filteredAirports(deptSearch[idx]).map(a => (
                            <div key={a.iata} className="dropdown-item" onMouseDown={() => selectAirport(idx, a, 'dep')}>
                              <span className="dd-iata">{a.iata}</span>
                              <span>{a.city}, {a.country}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrival Airport */}
                  <div className="field-group autocomplete-group flex-1">
                    <label>To</label>
                    <div className="autocomplete-wrap">
                      <input
                        type="text"
                        value={arrSearch[idx]}
                        onChange={e => {
                          setArrSearch(prev => prev.map((s, i) => i === idx ? e.target.value : s));
                          setArrDropdown(idx);
                        }}
                        onFocus={() => setArrDropdown(idx)}
                        placeholder="DEL or Delhi..."
                        autoComplete="off"
                      />
                      {arrDropdown === idx && arrSearch[idx] && (
                        <div className="dropdown">
                          {filteredAirports(arrSearch[idx]).map(a => (
                            <div key={a.iata} className="dropdown-item" onMouseDown={() => selectAirport(idx, a, 'arr')}>
                              <span className="dd-iata">{a.iata}</span>
                              <span>{a.city}, {a.country}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date/Times */}
                <div className="field-row">
                  <div className="field-group flex-1">
                    <label>Departure Date & Time</label>
                    <input
                      type="datetime-local"
                      value={flight.departureDateTime}
                      onChange={e => updateFlight(idx, 'departureDateTime', e.target.value)}
                    />
                  </div>
                  <div className="field-group flex-1">
                    <label>Arrival Date & Time</label>
                    <input
                      type="datetime-local"
                      value={flight.arrivalDateTime}
                      onChange={e => updateFlight(idx, 'arrivalDateTime', e.target.value)}
                    />
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="field-row">
                  <div className="field-group flex-1">
                    <label>Status</label>
                    <select value={flight.status} onChange={e => updateFlight(idx, 'status', e.target.value)}>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="field-group flex-2">
                    <label>Notes <span className="optional">(optional)</span></label>
                    <input
                      type="text"
                      value={flight.notes}
                      onChange={e => updateFlight(idx, 'notes', e.target.value)}
                      placeholder="Window seat, missed connection..."
                    />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="add-leg-btn" onClick={addFlight}>
              + Add Another Flight Leg
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : editTrip ? 'Save Changes' : 'Save Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
