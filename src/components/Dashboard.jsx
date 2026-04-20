import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { differenceInYears, differenceInMinutes, format } from 'date-fns';
import TripModal from './TripModal';
import FlightCard from './FlightCard';
import StatsBar from './StatsBar';

export default function Dashboard({ user, profile, onProfileUpdate }) {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [filterAirline, setFilterAirline] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [view, setView] = useState('trips'); // 'trips' | 'flights'
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'trips'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTrips(data);
    });
    return () => unsub();
  }, [user.uid]);

  const allFlights = trips.flatMap(t =>
    (t.flights || []).map(f => ({ ...f, tripId: t.id, tripName: t.name }))
  );

  const uniqueAirlines = [...new Set(allFlights.map(f => f.airlineName).filter(Boolean))];
  const uniqueDests = [...new Set(allFlights.map(f => f.arrivalAirport).filter(Boolean))];

  const getAgeAtFlight = (flightDate) => {
    if (!profile.dob || !flightDate) return null;
    return differenceInYears(new Date(flightDate), new Date(profile.dob));
  };

  const filteredTrips = trips
    .filter(t => {
      if (filterAirline) return (t.flights || []).some(f => f.airlineName === filterAirline);
      if (filterDest) return (t.flights || []).some(f => f.arrivalAirport === filterDest);
      if (searchText) return t.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        (t.flights || []).some(f =>
          f.airlineName?.toLowerCase().includes(searchText.toLowerCase()) ||
          f.departureAirport?.toLowerCase().includes(searchText.toLowerCase()) ||
          f.arrivalAirport?.toLowerCase().includes(searchText.toLowerCase())
        );
      return true;
    })
    .sort((a, b) => {
      const aDate = a.flights?.[0]?.departureDateTime || '';
      const bDate = b.flights?.[0]?.departureDateTime || '';
      if (sortBy === 'date') return bDate.localeCompare(aDate);
      if (sortBy === 'date-asc') return aDate.localeCompare(bDate);
      if (sortBy === 'airline') return (a.flights?.[0]?.airlineName || '').localeCompare(b.flights?.[0]?.airlineName || '');
      return 0;
    });

  const handleDelete = async (tripId) => {
    if (confirm('Delete this trip and all its flights?')) {
      await deleteDoc(doc(db, 'trips', tripId));
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo">✈ Logbook</div>
        <nav className="dash-nav">
          <button className={view === 'trips' ? 'nav-btn active' : 'nav-btn'} onClick={() => setView('trips')}>Trips</button>
          <button className={view === 'flights' ? 'nav-btn active' : 'nav-btn'} onClick={() => setView('flights')}>All Flights</button>
        </nav>
        <div className="dash-user">
          {profile.photoURL && <img src={profile.photoURL} className="avatar" alt="" />}
          <span className="user-name">{profile.name}</span>
          <button className="sign-out-btn" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </header>

      <StatsBar trips={trips} allFlights={allFlights} profile={profile} />

      <div className="dash-controls">
        <input
          className="search-input"
          placeholder="Search trips, airlines, airports..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <div className="filter-row">
          <select value={filterAirline} onChange={e => { setFilterAirline(e.target.value); setFilterDest(''); setSearchText(''); }}>
            <option value="">All Airlines</option>
            {uniqueAirlines.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterDest} onChange={e => { setFilterDest(e.target.value); setFilterAirline(''); setSearchText(''); }}>
            <option value="">All Destinations</option>
            {uniqueDests.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="airline">By Airline</option>
          </select>
          {(filterAirline || filterDest || searchText) &&
            <button className="clear-btn" onClick={() => { setFilterAirline(''); setFilterDest(''); setSearchText(''); }}>✕ Clear</button>
          }
        </div>
        <button className="add-trip-btn" onClick={() => { setEditTrip(null); setShowModal(true); }}>
          + New Trip
        </button>
      </div>

      <div className="trips-grid">
        {view === 'trips' ? (
          filteredTrips.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '4rem' }}>🌍</div>
              <h3>No trips yet</h3>
              <p>Add your first trip to start your logbook.</p>
              <button className="primary-btn" onClick={() => setShowModal(true)}>Add First Trip</button>
            </div>
          ) : (
            filteredTrips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                getAgeAtFlight={getAgeAtFlight}
                onEdit={() => { setEditTrip(trip); setShowModal(true); }}
                onDelete={() => handleDelete(trip.id)}
              />
            ))
          )
        ) : (
          <div className="all-flights-list">
            <h2 className="section-title">All Flights ({allFlights.length})</h2>
            {allFlights
              .sort((a, b) => (b.departureDateTime || '').localeCompare(a.departureDateTime || ''))
              .filter(f => {
                if (filterAirline) return f.airlineName === filterAirline;
                if (filterDest) return f.arrivalAirport === filterDest;
                if (searchText) return f.airlineName?.toLowerCase().includes(searchText.toLowerCase()) ||
                  f.departureAirport?.toLowerCase().includes(searchText.toLowerCase()) ||
                  f.arrivalAirport?.toLowerCase().includes(searchText.toLowerCase());
                return true;
              })
              .map((f, i) => (
                <FlightCard key={i} flight={f} age={getAgeAtFlight(f.departureDateTime)} showTrip />
              ))}
          </div>
        )}
      </div>

      {showModal && (
        <TripModal
          user={user}
          editTrip={editTrip}
          onClose={() => { setShowModal(false); setEditTrip(null); }}
        />
      )}
    </div>
  );
}

function TripCard({ trip, getAgeAtFlight, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const flights = trip.flights || [];
  const firstFlight = flights[0];
  const lastFlight = flights[flights.length - 1];

  const origin = firstFlight?.departureAirport || '?';
  const destination = lastFlight?.arrivalAirport || '?';
  const totalLegs = flights.length;

  const totalLayoverMins = flights.slice(0, -1).reduce((acc, f, i) => {
    const nextFlight = flights[i + 1];
    if (f.arrivalDateTime && nextFlight?.departureDateTime) {
      const mins = differenceInMinutes(new Date(nextFlight.departureDateTime), new Date(f.arrivalDateTime));
      return acc + (mins > 0 ? mins : 0);
    }
    return acc;
  }, 0);

  const layoverText = totalLayoverMins > 0
    ? `${Math.floor(totalLayoverMins / 60)}h ${totalLayoverMins % 60}m total layover`
    : null;

  const tripDate = firstFlight?.departureDateTime
    ? format(new Date(firstFlight.departureDateTime), 'MMM d, yyyy')
    : 'Unknown date';

  const age = getAgeAtFlight(firstFlight?.departureDateTime);
  const airlineColor = firstFlight?.airlineColor || '#8B5CF6';

  return (
    <div className="trip-card" style={{ '--airline-color': airlineColor }}>
      <div className="trip-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="trip-route">
          <span className="airport-code">{origin}</span>
          <div className="route-line">
            {flights.map((_, i) => (
              <span key={i} className="route-dot" />
            ))}
            <span className="route-arrow">→</span>
          </div>
          <span className="airport-code">{destination}</span>
        </div>
        <div className="trip-meta">
          <span className="trip-name">{trip.name || `${origin} → ${destination}`}</span>
          <span className="trip-date">{tripDate}</span>
          {age !== null && <span className="trip-age">Age {age}</span>}
        </div>
        <div className="trip-tags">
          <span className="tag">{totalLegs} {totalLegs === 1 ? 'flight' : 'flights'}</span>
          {layoverText && <span className="tag tag-layover">{layoverText}</span>}
          {firstFlight?.airlineName && (
            <span className="tag tag-airline" style={{ background: airlineColor + '22', color: airlineColor, borderColor: airlineColor + '44' }}>
              {firstFlight.airlineName}
            </span>
          )}
        </div>
        <div className="trip-actions">
          <button className="icon-btn" onClick={e => { e.stopPropagation(); onEdit(); }}>✏️</button>
          <button className="icon-btn" onClick={e => { e.stopPropagation(); onDelete(); }}>🗑️</button>
          <button className="icon-btn expand-btn">{expanded ? '▲' : '▼'}</button>
        </div>
      </div>

      {expanded && (
        <div className="trip-flights">
          {flights.map((f, i) => (
            <div key={i}>
              <FlightCard flight={f} age={getAgeAtFlight(f.departureDateTime)} />
              {i < flights.length - 1 && (() => {
                const nextFlight = flights[i + 1];
                if (f.arrivalDateTime && nextFlight?.departureDateTime) {
                  const mins = differenceInMinutes(new Date(nextFlight.departureDateTime), new Date(f.arrivalDateTime));
                  if (mins > 0) return (
                    <div className="layover-bar">
                      🕐 Layover at {f.arrivalAirport}: {Math.floor(mins / 60)}h {mins % 60}m
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
