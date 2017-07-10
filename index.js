import 'webcomponents.js/webcomponents-lite.js'; // polyfill
import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import 'normalize.css';
import 'skeleton-css/css/skeleton.css';
import './index.css';
import request from 'superagent';
import domify from 'domify';

console.log('hello world');

const RAF = () => new Promise(requestAnimationFrame);

document.registerElement('bookseattle-app', class extends Component {
  get config() {
    return {
      defaultState: {
        $view: 'home',
      },

      routes: {
        // 'bookseattle': () => ({$view: 'bookseattle'}),
        'home':   () => ({$view: 'home'}),
        'rooms/:name': function (_stateUpdate={}, name) {
            this.renderRoom(name);
        },
        '':        'home'
      },

      template: state =>
        <div>
          {this.child(`${state.$view}-view`)},
          {this.child('navigation-view')}
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
      const data = await response.json()
      this.update({
        $view:'room'
      })
      await RAF();
      const roomContainer = document.querySelector('room-view .room');
      const currentRoom = roomContainer.children[0]
      const roomHTML = domify(data.html)

      roomContainer.innerHTML = ""
      roomContainer.appendChild(roomHTML)

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
            <li><a href="#home">rooms</a></li>
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
        </div>
    };
  }
});

document.registerElement('room-view', class extends Component {
  get config() {
    return {
      template: state =>
      <div>
        <form action="http://localhost:3000/availability" method="get">
          <label for="check_in">Check In</label>
          <input name="check_in" type="date"></input>
          <label for="check_out">Check Out</label>
          <input name="check_out" type="date"></input>
          <input type="submit">Reserve</input>
        </form>
        <div className="room">

        </div>
      </div>
    }
  };
});
