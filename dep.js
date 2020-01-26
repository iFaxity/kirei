let data = { price: 5, quantity: 2 };
let target = null;

// Our simple Dep class

class Dep {
  constructor() {
    this.subscribers = [];
  }
  depend() {
    if (target && !this.subscribers.includes(target)) {
      // Only if there is a target & it's not already subscribed
      this.subscribers.push(target);
    }
  }
  notify() {
    this.subscribers.forEach(sub => sub());
  } 
}

let deps = new Map(); // Let's store all of our data's deps in a map

Object.keys(data).forEach(key => {
  // Each property gets a dependency instance
  deps.set(key, new Dep());
});

let data_without_proxy = data // Save old data object

data = new Proxy(data_without_proxy, {  // Override data to have a proxy in the middle
  get(obj, key) {
    deps.get(key).depend(); // <-- Remember the target we're running
    return obj[key]; // call original data
  },

  set(obj, key, newVal) {
    obj[key] = newVal; // Set original data to new value
    deps.get(key).notify(); // <-- Re-run stored functions
    return true;
  }
});


// The code to watch to listen for reactive properties
function watcher(myFunc) {
  target = myFunc;
  target();
  target = null;
}

let total = 0

watcher(() => {
  total = data.price * data.quantity;
});

console.log("total = " + total); 
data.price = 20;
console.log("total = " + total);
data.quantity = 10;
console.log("total = " + total);

deps.set('discount', new Dep())
data['discount'] = 5;

let salePrice = 0;

watcher(() => {
  salePrice = data.price - data.discount;
});

console.log("salePrice = " + salePrice); 
data.discount = 7.5
console.log("salePrice = " + salePrice); 
