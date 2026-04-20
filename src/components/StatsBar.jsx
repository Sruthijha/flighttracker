import { differenceInMinutes } from 'date-fns';

export default function StatsBar({ trips, allFlights, profile }) {
  const totalFlights = allFlights.length;
  const totalTrips = trips.length;

  const totalMins = allFlights.reduce((acc, f) => {
    if (f.departureDateTime && f.arrivalDateTime) {
      const m = differenceInMinutes(new Date(f.arrivalDateTime), new Date(f.departureDateTime));
      return acc + (m > 0 ? m : 0);
    }
    return acc;
  }, 0);

  const totalHours = Math.floor(totalMins / 60);
  const totalDays = Math.floor(totalHours / 24);

  const uniqueAirlines = new Set(allFlights.map(f => f.airlineName).filter(Boolean)).size;
  const uniqueCountries = new Set(allFlights.map(f => f.arrivalCountry).filter(Boolean)).size;
  const uniqueAirports = new Set([
    ...allFlights.map(f => f.departureAirport),
    ...allFlights.map(f => f.arrivalAirport)
  ].filter(Boolean)).size;

  const stats = [
    { label: 'Trips', value: totalTrips, icon: '🗺️' },
    { label: 'Flights', value: totalFlights, icon: '✈️' },
    { label: 'Hours in Air', value: totalHours, icon: '⏱️' },
    { label: 'Airlines', value: uniqueAirlines, icon: '🏢' },
    { label: 'Airports', value: uniqueAirports, icon: '🛫' },
    { label: 'Countries', value: uniqueCountries, icon: '🌍' },
  ];

  return (
    <div className="stats-bar">
      {stats.map(s => (
        <div key={s.label} className="stat-item">
          <span className="stat-icon">{s.icon}</span>
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
