#Mongo Single

Ever had to build a Node app that required you to:

*	Connect to MongoDB multiple times
*	Pass an object into all of the files (for example the app object in Express)

The MongoDB Driver for Node.js doesn't need to make multiple connections from the same app. You can actually use the same object through out your whole app. With Mongo Singleton you can require your db on every file and it will hold the reference of the same DB object through the whole application.

### Example

```js
//app.js - Set everything up for the first time
require('mongo-single')(process.env.MONGO_URL); //Set the connection but don't verify for errors or anything
// or
require('mongo-single')(process.env.MONGO_URL, function (e, db) { //Set and obtain the connection and inspect for errors
	console.log(arguments);
});
```


```js
//model.js
db = require('mongo-single')(process.env.MONGO_URL); //Obtian the connection
```

Simple as that. If your URL for the db object changes, it will also be cached. Therefore your connections will always be available to be required as long as you keep the same URL.

### Options

You can also pass in a object containing the options for the connection. This is not required but recommended.

```js
require('mongo-single')(process.env.MONGO_URL, {native_parser: true}); //Set the connection but don't verify for errors or anything
```

Feel free to submit pull requests and stuff.

### MIT License
