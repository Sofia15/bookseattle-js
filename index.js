import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import flatpickr from 'flatpickr';
import request from 'superagent';
import domify from 'domify';
import serialize from 'form-serialize';
import loadGoogleMapsAPI from 'load-google-maps-api';
import 'normalize.css';
import 'skeleton-css/css/skeleton.css';
import './icono.min.css'
import './index.css';
import 'flatpickr/dist/themes/airbnb.css';

const RAF = () => new Promise(requestAnimationFrame);

const CHECK_IN = '3:00pm - 6:00pm'
const CHECK_OUT = '12:00pm'

let googleMaps;

document.registerElement('bookseattle-app', class extends Component {
  get config() {
    return {
      defaultState: {
        $view: 'home',
        errors: []
      },

      routes: {
        'home':   () => ({$view: 'home', errors: []}),
        'rooms/:name': function (_stateUpdate={}, name) {
            this.renderRoom(name);
        },
        'house-rules': () => ({$view: 'house-rules', errors: []}),
        'reservation-confirmation': () =>
          ({$view: 'reservation-confirmation', errors: []}),
        'itinerary': () => ({$view: 'itinerary', errors: []}),
        '':        'home'
      },

      template: state =>
        <div>
          <a className="icon icono-home" href="#home">Home</a>
          {this.child('errors-view')}
          {this.child(`${state.$view}-view`)}
          <footer>
            <hr></hr>
            <p><a href="mailto:bookseattlehelp@gmail.com">bookseattlehelp@gmail.com</a></p>
            <p><small>&copy; BookSeattle</small></p>
          </footer>
        </div>
    };
  }
  async renderRoom(name) {
    const request = new Request(`${API_URL}/rooms/${name}`,{
      headers: new Headers({
        'Accept': 'application/json'
      })
    })
    try {
      const response = await fetch(request)
      const room = await response.json()
      this.update({
        $view:'room',
        $fragment: `#rooms/${name}`,
        errors: [],
        reservation: {},
        room
      });
      await RAF();
      const roomContainer = document.querySelector('room-view .room');
      const currentRoom = roomContainer.children[0]
      const roomHTML = domify(room.html)

      roomContainer.innerHTML = ""
      roomContainer.appendChild(roomHTML)
      flatpickr(".flatpickr", {
        minDate: room.available_days[0],
        enable: room.available_days.map(day => day)
      });

    } catch(e) {

    }
  }
});

document.registerElement('navigation-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div>
          <ul>
            <li>
              <a href="#rooms/paris">Paris</a>
              <img src="http://www.bookseattle.net/rooms/paris.jpg" />
            </li>
            <li>
              <a href="#rooms/wonderworld">Wonder World</a>
              <img src="http://www.bookseattle.net/rooms/hellokitty2.jpg" />
            </li>
            <li>
              <a href="#rooms/dorm">Dorm</a>
             <img src="http://www.bookseattle.net/rooms/dorm.jpg" />
            </li>
          </ul>
        </div>
    };
  }
});

document.registerElement('home-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div>
          <h1 className="title"><span>Book</span><span>Seattle</span></h1>
          <img className="banner-image" src="http://www.bookseattle.net/rooms/banner.png" />
          <p>Traveling to Seattle?</p>
          <p>Choose the room that speaks to you.</p>
          <h4>Rooms</h4>
          {this.child('navigation-view')}
          <h4>Location</h4>
          {this.child('google-map-view')}
        </div>
    };
  }
});

function chargesSummary(state) {
  let chargesSummary, weekdays, weekends;

  if (!state.reservation || !state.reservation.total_price) {
    return "";
  }

  if (state.reservation.weekday_count > 0) {
    weekdays = <li className="line-item"><p>${state.room.weekday_rate * 1} x {state.reservation.weekday_count} night</p></li>;
  }

  if (state.reservation.weekend_count > 0) {
    weekends = <li className="line-item"><p>${state.room.weekend_rate * 1} x {state.reservation.weekend_count} night <small>(weekend rate)</small></p></li>;
  }

  return (
    <div>
      <ul>
        {weekdays || ''}
        {weekends || ''}
        <li className="line-item"><p><b>Total:</b> ${state.reservation.total_price * 1}</p></li>
      </ul>
    </div>
  );
}

document.registerElement('room-view', class extends Component {
  get config() {
    return {
      helpers: {
        submitReservation: (ev) => {
          ev.preventDefault();
          if (this.state.errors.length > 0) return undefined;

          const form = ev.target.parentNode;
          const reservation = serialize(form, {hash: true})

          if (!reservation.check_in || !reservation.check_out || !reservation.guest_count) {
            return this.update({errors: ['All fields are required.']});
          }
          this.navigate('house-rules', {reservation: Object.assign(this.state.reservation, reservation), errors:[]})
        },

        calculatePrice: (ev) => {
          const form = ev.target.parentNode;
          const reservation = serialize(form, {hash: true})
          const checkinIndex = this.state.room.available_days.indexOf(reservation.check_in);
          const checkoutIndex = this.state.room.available_days.indexOf(reservation.check_out);

          let weekday_count = 0;
          let weekend_count = 0;

          if (checkinIndex === -1 || checkoutIndex === -1) {
            return undefined;
          }

          if (checkoutIndex <= checkinIndex) {
            return this.update({errors: ['Check-out must be after check-in.']})
          }

          const reservationDays = this.state.room.available_days.slice(
            checkinIndex, checkoutIndex
          );

          reservationDays.forEach(day => {
            const date = new Date(day);
            const dayOfWeekIndex = date.getUTCDay();
            if (dayOfWeekIndex == 5 || dayOfWeekIndex == 6) {
              weekend_count += 1;
            } else {
              weekday_count += 1;
            }
          });

          const weekday_total = weekday_count * this.state.room.weekday_rate;
          const weekend_total = weekend_count * this.state.room.weekend_rate;
          const total_price = weekday_total + weekend_total;

          return this.update({errors: [], reservation: {
            total_price,
            weekday_count,
            weekday_total,
            weekend_count,
            weekend_total
          }});
        }
      },

      template: state => {
        return (
          <div>
            <div>
              <ul className="nightly-rates">
                <li><p>${state.room.weekday_rate * 1} <small>per weekday night</small></p></li>
                <li><p>${state.room.weekend_rate * 1} <small>per weekend night</small></p></li>
              </ul>
            </div>
            <form action="" method="">
              <label>Check In</label>
              <input name="check_in" placeholder="yyyy-mm-dd" type="text" className="flatpickr" on-input={state.$helpers.calculatePrice}></input>
              <label>Check Out</label>
              <input name="check_out" placeholder="yyyy-mm-dd" type="text" className="flatpickr" on-input={state.$helpers.calculatePrice}></input>
              <label>Guests</label>
              <input name="guest_count" type="number" value="1" min="1" max={`${state.room.max_guests}`} on-input={state.$helpers.calculatePrice}></input>
              <br />
              <input className="bookseattle-button" type="submit" value="Reserve" on-click={state.$helpers.submitReservation}></input>
            </form>
            {chargesSummary(state)}
            <div className="room">
            </div>
          </div>
        )
      }
    }
  };
});

document.registerElement('house-rules-view', class extends Component {
    get config() {
      return {
        helpers: {
          houseRules: {
            onAcceptance: (ev) => {
              this.navigate('reservation-confirmation', {accepted: true})
            }
          }
        },
        template: (state) => {
          if (!state.reservation || !state.reservation.check_in) {
            state.$component.navigate('')
          }
          return (
            <div>
              <div className="review-rules">
                <h4>Review house rules</h4>
                <ul>
                  <li>No smoking</li>
                  <li>No yelling, there could be babies and they cry</li>
                  <li>Check in anytime before 6pm</li>
                </ul>
                <button className="bookseattle-button" on-click={state.$helpers.houseRules.onAcceptance}>Agree and confirm</button>
              </div>
              {this.child('summary-view')}
            </div>
          );
        }
      }
    }
});

document.registerElement('reservation-confirmation-view', class extends Component {
  get config() {
    return {
      helpers: {
        reservationConfirmation: {
          onBook: (ev) => {
            if (!this.state.reservation || !this.state.reservation.check_in) {
              return this.navigate('')
            }

            try {
              const reservation = {
                check_in: this.state.reservation.check_in,
                check_out: this.state.reservation.check_out,
                guest_count: this.state.reservation.guest_count,
                room_id: this.state.room.id
              };
              const body = JSON.stringify({reservation});
              this.onCreate(body);
            } catch(error) {
              this.update({errors: ['There was a problem processing your reservation.', 'Please try re-booking from the beginning.']});
            }
          }
        }
      },
      template: (state) =>
        <div>
          <h4>Payment Instructions</h4>
          <p>We only accept Venmo(id: bookseattle) or cash payments at check-in.</p>
          <p>Please enter your name and email address to complete the reservation.</p>
          <div className="payment-form">
            <div>
              <label>Given name</label>
              <input name="given_name" required></input>
            </div>
            <div>
            <label>Family name</label>
            <input name="family_name" required></input>
            </div>
            <div>
              <label>Email</label>
              <input name="email" type="email" required></input>
            </div>
           <button className="bookseattle-button" name="reservation_confirmation" on-click={state.$helpers.reservationConfirmation.onBook}>Book</button>
          </div>
          <p>We will mail you a copy of your itinerary.</p>
        </div>
    }
  };

  async onCreate(body) {
    const request = new Request(`${API_URL}/reservations`, {
      method: 'POST',
      body: body,
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    });

    try {
      const response = await fetch(request);
      const body = await response.json();
      if (body["errors"]) {
        return this.update({errors: body["errors"]})
      }
      this.navigate('itinerary');
    } catch(e) {
      console.log('error', e);
    }
  }
});

document.registerElement('itinerary-summary-view', class extends Component {
  get config() {
    return {
      template: state => {
        return <div>
          <img src={`${state.room.photo_url}`} alt="Photo of the room" />
          <ul>
            <li><p>Location: {state.room.location.name}</p></li>
            <li><p>Room: {state.room.name}</p></li>
          </ul>
          {chargesSummary(state)}
        </div>
      }
    }
  }
});

document.registerElement('itinerary-view', class extends Component {
  get config() {
    return {
      template: state => {
        if (!state.reservation || !state.accepted) {
          return state.$component.navigate('home')
        }

        return (
          <div>
            <h4>Reservation complete</h4>
            <p>Your reservation is complete. Thank you for booking Seattle.</p>
            <p>Please keep a copy of the following for your records:</p>
            <div>
              <ul>
                <li className="line-item"><p><span>Location</span> {state.room.location.name}</p></li>
                <li className="line-item"><p><span>Room</span> {state.room.name}</p></li>
                <li className="line-item"><p><span>Check in</span> {this.state.reservation.check_in} at {CHECK_IN}</p></li>
                <li className="line-item"><p><span>Check out</span> {this.state.reservation.check_out} at {CHECK_OUT}</p></li>
              </ul>
              {chargesSummary(state)}
            </div>
          </div>
        );
      }
    }
  }
});

document.registerElement('summary-view', class extends Component {
  get config() {
    return {
      template: (state) => {
        if (!state.room) {
          return state.$component.navigate('home');
        }

        return <aside>
          {this.child('itinerary-summary-view')}
        </aside>
      }
    }
  }

});

document.registerElement('errors-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div>
          {state.errors.map(function (e) {
            return <p>{e}</p>;
          })}
        </div>
    }
  }
});

document.registerElement('google-map-view', class extends HTMLElement {
  constructor() {
    super();
  };

  attachedCallback() {
    this.loadMap();
  };

  async loadMap() {
    try {
      googleMaps = googleMaps || await loadGoogleMapsAPI({key: GOOGLE_MAPS_API_KEY});
      const coordinates = {lat: 47.61, lng: -122.338};
      const map = await new googleMaps.Map(this, {
		    center: coordinates,
		    zoom: 15
	    });
      await googleMaps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        googleMaps.event.trigger(map, "resize");
        map.setCenter(center);
      });

      const infowindow = await new googleMaps.InfoWindow();

      const locations = [
        ['BookSeattle: 1215 4th Ave #1050', 47.6076, -122.3347]
      ];

      let marker;

      locations.forEach(function(location, i) {
        marker = new googleMaps.Marker({
          position: new googleMaps.LatLng(locations[i][1], locations[i][2]),
          map: map
        });

        googleMaps.event.addListener(marker, 'click', (function(marker, i) {
          return function() {
            infowindow.setContent(locations[i][0]);
            infowindow.open(map, marker);
          }
        })(marker, i));
      });
    } catch(e) {
      console.log('error', e)
    }
  };
});
