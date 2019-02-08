// Generated by CoffeeScript 2.3.2
  // ![PlayFrame](https://avatars3.githubusercontent.com/u/47147479)
  // # Statue

  // ###### 0.4 kb Art of functional State

  // ## Installation
  // ```sh
  // npm install --save @playframe/statue
  // ```

  // ## Description
  // Statue is a [Redux](https://github.com/reduxjs/redux)
  // like functional state manegement library that lets you define
  // and access actions right inside of your state. So you could
  // describe a deeply nested state tree with nested actions
  // in one simple object.

  // To update state, action could return a new object
  // that has one or more properties.
  // This will produce a new state with those properties updated.

  // Another option is to mutate a state object passed to your function.
  // Mutation will be detected and this will produce a new state as well.
  // Returned value is ignored in this case.
  // If you are writing a performance demanding reducer,
  // please use this mutation trick and define the hottest property as
  // the first one in your initial state for faster checking.

  // If you don't want to update state, please make sure you action
  // returns something
  // [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy)

  // To work with state directly you can do
  // ```js
  // // to update the state
  // state._(updated)

  // // to read the latest state
  // state = state._()

  // // to turn a function into a reducer
  // state._.new_action = state._( (x, state)=> state.x = x )
  // ```
  //  Statue also cares not to send too many updates
  // from child to parent branches
  // ## Usage
  // ```js
  // import statue from '@playframe/statue'
  // const state = statue({
  //   i: 0,
  //   _: {
  //     increment: (x, state)=> i: state.i + 1,
  //     incrementBy: (n)=>(event, state)=> state.i += n // mutating
  //   },
  //   subState: {
  //     i: 0,
  //     _: {
  //       increment: (x, state)=> i: state.i + 1
  //     }
  //   }
  //   },
  //   setTimeout,
  //   (newState)=> {
  //     console.log('Counter is:', newState.i)
  //     console.log('Subcounter is:', newState.subState.i)
  //   }
  // )
  // for(let j = 0; j < 100; j++){
  //   state.subState._.increment()
  //   state.subState._.increment()
  //   state._.increment()
  // }
  // // Logs only once
  // //> Counter is: 100
  // //> Subcounter is: 200
  // // Will increment by 10 and log in console on every click
  // $('button').click( state._.incrementBy(10) )
  // ```
  // ## Annotated Source
  // Caching static functions from `Object`
var assign, create, is_function, keys, statue,
  hasProp = {}.hasOwnProperty;

({assign, create, keys} = Object);

is_function = (f) => {
  return typeof f === 'function';
};

// Let's define a function that takes a takes `state_actions`
// as an initial state and its reducers (actions)
// defined under `_` (underscore) property.
// Our function also takes `level_up` or 'subscribe' function
// that will be called when state updates. Most sertainly we don't
// want to update the whole state tree every time nested leaf updates,
// so we also pass a `delayed` function that will help debounce
// parent update
module.exports = statue = (state_actions, delayed, level_up) => {
  /*                       state._.actions
                                 ]_[.state._.actions
                                 [_]      ]_[.
                                 [_]      [_]
  */
  var _scheduled, _state, action, actions, inject_state, k, save_state, update_state, v;
  actions = state_actions._;
  _state = state_actions; // _closure
  _scheduled = false; // _closure

// recursive statue if there nested actions
  for (k in state_actions) {
    v = state_actions[k];
    if (v._) {
      _state[k] = statue(v, delayed, ((k) => {
        return (new_v) => { // closure for k
          return update_state({
            [k]: new_v
          });
        };
      })(k));
    }
  }
  save_state = (state) => {
    // saving new state in closure
    _state = state;
    if (!_scheduled) {
      _scheduled = true;
      // lazy parent update
      delayed(() => {
        var nested_state;
        _scheduled = false;
        nested_state = _state;
        _state = create(null);
        for (k in nested_state) {
          v = nested_state[k];
          // merging proto tree in plain object
          _state[k] = v;
        }
        return level_up(_state);
      });
    }
    return _state;
  };
  // This function is a little overloaded, it's a getter/setter but
  // also is a function wrapper.
  // You can access it like this `yourState._(updated)`.
  // The wrapper will return a twin of your function
  // that calls yours and passes a copy of latest state
  // as the second argument. State will update, if the copy is mutated
  // or a new object returned. If your function
  // returns a new function, it will be wrapped in the same manner.
  // So we support state updates for deeply curried functions.

  // curry down or make state
  _state._ = update_state = (arg) => {
    if (is_function(arg)) {
      return inject_state(arg);
    } else {
      if (arg) {
        return save_state(assign(create(_state), arg));
      } else {
        return _state;
      }
    }
  };
  // `inject_state` is a higher order function that does the magic.
  // It produces a cheap clone if current state by setting current
  // state as its prototype. Please note that such a clone has no
  // own properties, and all property accees falls back to its
  // prototype. If we mutate such a clone, new properties are
  // easily detected
  inject_state = (f) => {
    return (x) => {
      var cloned, mutated, y;
      // _state as prototype of cloned
      cloned = create(_state);
      y = f(x, cloned);
      for (k in cloned) {
        if (!hasProp.call(cloned, k)) continue;
        // mutation detected
        mutated = true;
        save_state(cloned);
        break;
      }
      if (is_function(y)) {
        // recursevely currying down
        return inject_state(y);
      } else {
        if (y && !mutated && y !== cloned && !y.then) { // not promise
          save_state(assign(cloned, y));
        }
        return y;
      }
    };
  };
// Now let's wrap all of your actions and set under the `_` property.
// That's it! You new state machine is ready!

// bind actions to state
  for (k in actions) {
    action = actions[k];
    update_state[k] = inject_state(action);
  }
  return _state;
};
