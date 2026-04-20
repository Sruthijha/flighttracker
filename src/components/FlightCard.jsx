import { format, differenceInMinutes } from 'date-fns';

export default function FlightCard({ flight, age, showTrip = false }) {
  const {
    airlineName, airlineIATA, airlineColor,
    flightNumber, departureAirport, arrivalAirport,
    departureDateTime, arrivalDateTime,
    tripName, status, notes
  } = flight;

  const durationMins = departureDateTime && arrivalDateTime
    ? differenceInMinutes(new Date(arrivalDateTime), new Date(departureDateTime))
    : null;

  const durationText = durationMins !== null && durationMins > 0
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
    : null;

  const color = airlineColor || '#8B5CF6';

  return (
    <div className="flight-card" style={{ '--airline-color': color }}>
      <div className="flight-card-accent" />
      <div className="flight-card-body">
        <div className="flight-top">
          <div className="flight-airline">
            <span className="airline-badge" style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
              {airlineIATA || '??'}
            </span>
            <div>
              <div className="airline-name">{airlineName || 'Unknown Airline'}</div>
              {flightNumber && <div className="flight-num">{flightNumber}</div>}
            </div>
          </div>
          <div className="flight-status-area">
            {status === 'cancelled' && <span className="status-badge cancelled">Cancelled</span>}
            {status === 'delayed' && <span className="status-badge delayed">Delayed</span>}
            {age !== null && <span className="age-badge">Age {age}</span>}
            {showTrip && tripName && <span className="trip-badge">{tripName}</span>}
          </div>
        </div>

        <div className="flight-route-row">
          <div className="route-airport">
            <div className="airport-code-lg">{departureAirport || '---'}</div>
            {departureDateTime && (
              <div className="flight-time">{format(new Date(departureDateTime), 'HH:mm')}</div>
            )}
            {departureDateTime && (
              <div className="flight-date-sm">{format(new Date(departureDateTime), 'MMM d, yyyy')}</div>
            )}
          </div>
          <div className="flight-path">
            <div className="flight-path-line">
              <span className="path-dot" />
              <div className="path-line" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
              <span className="path-plane" style={{ color }}>✈</span>
              <div className="path-line" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }} />
              <span className="path-dot" />
            </div>
            {durationText && <div className="flight-duration">{durationText}</div>}
          </div>
          <div className="route-airport route-airport-right">
            <div className="airport-code-lg">{arrivalAirport || '---'}</div>
            {arrivalDateTime && (
              <div className="flight-time">{format(new Date(arrivalDateTime), 'HH:mm')}</div>
            )}
            {arrivalDateTime && (
              <div className="flight-date-sm">{format(new Date(arrivalDateTime), 'MMM d, yyyy')}</div>
            )}
          </div>
        </div>

        {notes && <div className="flight-notes">📝 {notes}</div>}
      </div>
    </div>
  );
}
