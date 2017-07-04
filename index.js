import 'webcomponents.js/webcomponents-lite.js'; // polyfill
import { Component } from 'panel';
import { html } from 'snabbdom-jsx';
import 'normalize.css';

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
        '':        'home',
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
            <li><a href="#rooms">rooms</a></li>
          </ul>
        </div>
    };
  }
});

document.registerElement('home-view', class extends Component {
  get config() {
    return {
      template: state =>
        <div className="home">
            bookseattle
        </div>
    };
  }
});
