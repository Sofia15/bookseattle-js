import 'webcomponents.js/webcomponents-lite.js'; // polyfill
import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import flatpickr from 'flatpickr';
import request from 'superagent';
import domify from 'domify';
import serialize from 'form-serialize';
import 'normalize.css';
import 'skeleton-css/css/skeleton.css';
import './index.css';
import './airbnb.css';

const RAF = () => new Promise(requestAnimationFrame);

document.registerElement('bookseattle-app', class extends Component {
  get config() {
    return {
      defaultState: {
        $view: 'home',
      },

      routes: {
        'home':   () => ({$view: 'home'}),
        'rooms/:name': function (_stateUpdate={}, name) {
            this.renderRoom(name);
        },
        'house-rules': () => ({$view: 'house-rules'}),
        'reservation-confirmation': () =>
          ({$view: 'reservation-confirmation'}),
        'itinerary': () => ({$view: 'itinerary'}),
        '':        'home'
      },

      template: state =>
        <div>
          {this.child(`${state.$view}-view`)}

        </div>
    };
  }
  async renderRoom(name) {
    const request = new Request(`http://localhost:3000/rooms/${name}`,{
      headers: new Headers({
        'Accept': 'application/json'
      })
    })
    try {
      const response = await fetch(request)
      const room = await response.json()
      console.log('room', room)
      this.update({
        $view:'room',
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
        enable: room.available_days.map(day => new Date(day))
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
        <div>
          <ul>
            <li><a href="#rooms/paris">Paris</a></li>
            <li><a href="#rooms/dorm">Dorm</a></li>
            <li><a href="#rooms/wonderland">Wonderland</a></li>
          </ul>
        </div>
    };
  }
});

document.registerElement('home-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div className="container">
            <img src="https://s3-us-west-2.amazonaws.com/www.bookseattle.net/rooms/banner.png" />
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

          const form = ev.target.parentNode;

          const reservation = serialize(form, {hash: true})

          this.navigate('house-rules', {reservation})
        }
      },

      template: state => {
        console.log('state', state)
        return (
          <div>
            <form action="" method="">
              <label>Check In</label>
              <input name="check_in" placeholder="yyyy-mm-dd" type="text" className="flatpickr"></input>
              <label>Check Out</label>
              <input name="check_out" placeholder="yyyy-mm-dd" type="text" className="flatpickr"></input>
              <label>Guests</label>
              <input name="max_guests" type="number" value="1" min="1" max={`${state.room.max_guests}`}></input>
              <br />
              <input type="submit" on-click={state.$helpers.submitReservation} >Reserve</input>
            </form>
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
        template: (state) =>
          <div>
            <h2>Review house rules</h2>
            <ul>
              <li>No smoking</li>
              <li>No yelling, there could be babies and they cry</li>
              <li>Check in anytime before 6pm</li>
            </ul>
            <button name="rules_acceptance" on-click={state.$helpers.houseRules.onAcceptance}>Agree and confirm</button>
          </div>
      }
    }
});

document.registerElement('reservation-confirmation-view', class extends Component {
  get config() {
    return {
      helpers: {
        reservationConfirmation: {
          onBook: (ev) => {
            this.navigate('itinerary')
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
