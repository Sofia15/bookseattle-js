import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import flatpickr from 'flatpickr';
import request from 'superagent';
import domify from 'domify';
import serialize from 'form-serialize';
import 'normalize.css';
import 'skeleton-css/css/skeleton.css';
import './index.css';
import 'flatpickr/dist/themes/airbnb.css';

const RAF = () => new Promise(requestAnimationFrame);

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
          <a href="#home">Home</a>
          {this.child('errors-view')}
          {this.child(`${state.$view}-view`)}
          <footer>
            <div className="rule_76irmj"></div>
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
      console.log('response', response)
      const room = await response.json()
      console.log('room', room)
      this.update({
        $view:'room',
        $fragment: `#rooms/${name}`,
        errors: [],
        room
      });
      await RAF();
      const roomContainer = document.querySelector('room-view .room');
      const currentRoom = roomContainer.children[0]
      const roomHTML = domify(room.html)

      console.log('room', room)

      roomContainer.innerHTML = ""
      roomContainer.appendChild(roomHTML)
      flatpickr(".flatpickr", {
        enable: room.available_days.map(day => day)
      });

      // console.log(data.html)
      // console.log(domify(data.html))
    } catch(e) {
      console.log('error', e)
    }
  }
});

document.registerElement('navigation-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div className="row">
          <ul>
            <li>
              <a href="#rooms/paris">
                Paris
                <img src="http://www.bookseattle.net/rooms/paris.jpg" />
              </a>
            </li>
            <li>
              <a href="#rooms/dorm">
                Dorm
                <img src="http://www.bookseattle.net/rooms/dorm_paint.jpeg" />
              </a>
            </li>
            <li>
              <a href="#rooms/wonderworld">
                Wonder World
                <img src="http://www.bookseattle.net/rooms/hellokitty2.jpg" />
              </a>
            </li>
            <li>
              <img src="https://s3-us-west-2.amazonaws.com/www.bookseattle.net/rooms/mama.jpeg" />
            </li>
            <li>
              <img src="http://www.bookseattle.net/gasworks.jpeg" />
            </li>
            <li>
              <img src="http://www.bookseattle.net/coffee.jpg" />
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
            <img src="http://www.bookseattle.net/rooms/banner.png" />
                {this.child('navigation-view')}

        </div>
    };
  }
});

document.registerElement('room-view', class extends Component {
  get config() {
    return {
      helpers: {
        submitReservation: (ev) => {
          ev.preventDefault();

          if (this.state.errors.length > 0) return undefined;

          const form = ev.target.parentNode;

          const reservation = serialize(form, {hash: true})

          this.navigate('house-rules', {reservation: Object.assign(this.state.reservation, reservation), errors:[]})
        },
        calculatePrice: (ev) => {
          const form = ev.target.parentNode;

          const reservation = serialize(form, {hash: true})
          const checkinIndex = this.state.room.available_days.indexOf(
            reservation.check_in
          );
          const checkoutIndex = this.state.room.available_days.indexOf(
            reservation.check_out
          );

         let weekday_count = 0;
         let weekend_count = 0;

         if (checkinIndex === -1 || checkoutIndex === -1) {
           return undefined;
         }

         if (checkoutIndex <= checkinIndex) {
           return this.update({errors: ['Check-in must come before check-out !!']})
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
        let chargesSummary, weekdays, weekends;

         if (state.reservation && state.reservation.total_price) {
           if (state.reservation.weekday_count > 0) {
             weekdays = <p>${state.room.weekday_rate * 1} x {state.reservation.weekday_count} night</p>;
           }
           if (state.reservation.weekend_count > 0) {
             weekends = <p>${state.room.weekend_rate * 1} x {state.reservation.weekend_count} night</p>;
           }

           chargesSummary = (
               <div>
                 {weekdays || ''}
                 {weekends || ''}
                 <p>Total: ${state.reservation.total_price * 1}</p>
               </div>
           );
         } else {
           chargesSummary = '';
         }
        console.log('state', state)
        return (
          <div>
            <div>
               <p>${state.room.weekday_rate * 1} <small>per weekday night</small></p>
               <p>${state.room.weekend_rate * 1} <small>per weekend night</small></p>
            </div>
            <form action="" method="">
              <label>Check In</label>
              <input name="check_in" placeholder="yyyy-mm-dd" type="text" className="flatpickr" on-input={state.$helpers.calculatePrice}></input>
              <label>Check Out</label>
              <input name="check_out" placeholder="yyyy-mm-dd" type="text" className="flatpickr" on-input={state.$helpers.calculatePrice}></input>
              <label>Guests</label>
              <input name="guest_count" type="number" value="1" min="1" max={`${state.room.max_guests}`} on-input={state.$helpers.calculatePrice}></input>
              <br />
              <input type="submit" value="Reserve" on-click={state.$helpers.submitReservation} on-input={state.$helpers.calculatePrice} ></input>
            </form>
            {chargesSummary}
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
              // ev.preventDefault();
              this.navigate('reservation-confirmation', {accepted: true})
            }
          }
        },
        template: (state) => {
          if (!state.reservation || !state.reservation.check_in) {
            state.$component.navigate('home')
          }
          return (
            <div>
              <div>
                <h2>Review house rules</h2>
                <ul>
                  <li>No smoking</li>
                  <li>No yelling, there could be babies and they cry</li>
                  <li>Check in anytime before 6pm</li>
                </ul>
                <button name="rules_acceptance" on-click={state.$helpers.houseRules.onAcceptance}>Agree and confirm</button>
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
            // TODO: POST to http://api.bookseattle.net/reservations
            // Retrieve reservation info from state.
            const reservation = {
              check_in: this.state.reservation.check_in,
              check_out: this.state.reservation.check_out,
              guest_count: this.state.reservation.guest_count,
              room_id: this.state.room.id
            };
            console.log(reservation)
            const body = JSON.stringify({reservation});
            this.onCreate(body);
          }
        }
      },
      template: (state) =>
        <div>
          <h2>Payment Instructions</h2>
          <p>We only accept Venmo(id: bookseattle) or cash payments at check-in</p>
          <button name="reservation_confirmation" on-click={state.$helpers.reservationConfirmation.onBook}>Book</button>
        </div>
    }
  };

  async onCreate(body) {
    // console.log('body', body)
    const request = new Request(`${API_URL}/reservations`, {
      method: 'POST',
      body: body,
      headers: new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    });
    // console.log('fetch request', request)

    try {
      const response = await fetch(request);
      console.log('reservationResponse', response)
      const body = await response.json();
      console.log('body', body)
      if (body["errors"]) {
        return this.update({errors: body["errors"]})
      }
      this.navigate('itinerary');
    } catch(e) {
      console.log('e', e);
    }
  }
});

document.registerElement('itinerary-view', class extends Component {
  get config() {
    return {
      template: () =>
        <div>You booked Seattle!!</div>
    }
  }
});

document.registerElement('summary-view', class extends Component {
  get config() {
    return {
      template: (state) =>
        console.log(state) ||
        <aside>
         <h1>{state.reservation.check_in}</h1>
        </aside>
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
