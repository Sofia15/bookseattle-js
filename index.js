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

loadMap();

const CHECK_IN = '3:00pm - 6:00pm'
const CHECK_OUT = '12:00pm'

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
          <p>Traveling to Seattle?</p>
          <p>Choose the room that speaks to you.</p>
          <h4>Rooms</h4>
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
          {this.child('navigation-view')}
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
    weekdays = <p className="line-item">${state.room.weekday_rate * 1} x {state.reservation.weekday_count} night</p>;
  }

  if (state.reservation.weekend_count > 0) {
    weekends = <p className="line-item">${state.room.weekend_rate * 1} x {state.reservation.weekend_count} night <small>(weekend rate)</small></p>;
  }

  return (
    <div>
      <ul>
        {weekdays || ''}
        {weekends || ''}
        <p><b>Total:</b> ${state.reservation.total_price * 1}</p>
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
              <ul>
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
                <h2>Review house rules</h2>
                <ul>
                  <li>No smoking</li>
                  <li>No yelling, there could be babies and they cry</li>
                  <li>Check in anytime before 6pm</li>
                </ul>
                <button className="bookseattle-button" name="rules_acceptance" on-click={state.$helpers.houseRules.onAcceptance}>Agree and confirm</button>
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
            const reservation = {
              check_in: this.state.reservation.check_in,
              check_out: this.state.reservation.check_out,
              guest_count: this.state.reservation.guest_count,
              room_id: this.state.room.id
            };
            const body = JSON.stringify({reservation});
            this.onCreate(body);
          }
        }
      },
      template: (state) =>
        <div>
          <h2>Payment Instructions</h2>
          <p>We only accept Venmo(id: bookseattle) or cash payments at check-in</p>
          <button className="bookseattle-button" name="reservation_confirmation" on-click={state.$helpers.reservationConfirmation.onBook}>Book</button>
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
    }
  }
});

document.registerElement('itinerary-summary-view', class extends Component {
  get config() {
    return {
      template: state => {
        console.log('state!', state)
        return <div>
          <img src={`${state.room.photo_url}`} alt="Photo of the room" />
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
          state.$component.navigate('home')
        }

        return (
          <div>
            <p>Your reservation is complete.</p>
            <p>Please keep a copy of the following for your records:</p>
            {chargesSummary(state)}
            <ul>
              <li><p>Check in: {this.state.reservation.check_in} at {CHECK_IN}</p></li>
              <li><p>Check out: {this.state.reservation.check_out} at {CHECK_OUT}</p></li>
            </ul>
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
          state.$component.navigate('home');
        }

        return <aside>
          <ul>
          <li><p>Location: {state.room.location.name}</p></li>
          <li><p>Room: {state.room.name}</p></li>
          </ul>
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

document.registerElement('google-map-view', class extends Component {
  get config() {
    return {
      template: () =>
        <div>
        </div>
    }
  };
});

async function loadMap() {
  // console.log('')
  try {
    const googleMaps = await loadGoogleMapsAPI({key: GOOGLE_MAPS_API_KEY});
    await RAF();
    const mapContainer = document.querySelector('google-map-view div');
    const coordinates = {lat: 47.6076, lng: -122.3347};
    const map = await new googleMaps.Map(mapContainer, {
		  center: coordinates,
		  zoom: 15
	  });
    await new googleMaps.Marker({
      position: coordinates,
      map: map
    });
    googleMaps.event.addDomListener(window, "resize", function() {
      var center = map.getCenter();
      googleMaps.event.trigger(map, "resize");
      map.setCenter(center);
    });
    await RAF();
    return '';
  } catch(e) {
    console.log('error', e)
  }
}
