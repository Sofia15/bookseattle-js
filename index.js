import 'webcomponents.js/webcomponents-lite.js'; // polyfill
import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import 'normalize.css';
import 'skeleton-css/css/skeleton.css';
import './index.css';
import request from 'superagent';

console.log('hello world');

document.registerElement('bookseattle-app', class extends Component {
  get config() {
    return {
      defaultState: {
        $view: 'home',
      },

      routes: {
        // 'bookseattle': () => ({$view: 'bookseattle'}),
        'home':   () => ({$view: 'home'}),
        'rooms/:name': (stateUpdate, name) => {
          return ({$view: 'room'})
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
      </div>
  }
});
