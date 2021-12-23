const fs = require("fs");
const util = require("util");
const express = require("express");
const bodyParser = require("body-parser");
const { convert } = require('convert-svg-to-png');
const cors = require("cors");
const routesHandler = require("./routes/handler.js");
//const db = require("./backend/models");
//const app = express();
const {SVG, Collection} = require('@iconify/json-tools');

var corsOptions = {
  origin: "http://localhost:3000"
};
 
// Log uncaught exceptions to stderr
process.on('uncaughtException', function (err) {
	console.error('Uncaught exception:', err);
});

const PORT = process.env.PORT || 8080;
let app = {
	root: __dirname,
};
app.config = JSON.parse(fs.readFileSync(__dirname+'\\config-default.json','utf8'));

try {
    
	let customConfig = fs.readFileSync(__dirname + '\\config.json', 'utf8');
	
	if (typeof customConfig === 'string') {
		try {
			customConfig = JSON.parse(customConfig);
			Object.keys(customConfig).forEach((key) => {
				if (
					typeof app.config[key] === 'object' &&
					typeof customConfig[key] === 'object'
				) {
					// merge object
					Object.assign(app.config[key], customConfig[key]);
				} else {
					// overwrite scalar variables
					app.config[key] = customConfig[key];
				}
			});
		} catch (err) {
			console.error('Error parsing config.json', err);
		}
	}
} catch (err) {
	console.log('Missing config.json. Using default API configuration');
}

// Add logging and mail modules
app.mail = require('./src/mail').bind(this, app);

let log = require('./src/log');
app.log = log.bind(this, app, false);
app.error = log.bind(this, app, true);

app.logger = require('./src/logger').bind(this, app);

/**
 * Validate configuration
 */
// Port
console.log('env-port='+app.config['env-port']);
console.log('process.env.port='+process.env.port);
if (app.config['env-port'] && process.env.port) {
	
	app.config.port = process.env.port;
}

// Region file to easy identify server in CDN
if (app.config['env-region']) {
	if (process.env.region) {
		app.config.region = process.env.region;
	} else if (process.env.REGION) {
		app.config.region = process.env.REGION;
	}
}
if (
	app.config.region !== '' &&
	(app.config.region.length > 10 ||
		!app.config.region.match(/^[a-z0-9_-]+$/i))
) {
	app.config.region = '';
	app.error('Invalid value for region config variable.');
}
// Reload secret key
if (app.config['reload-secret'] === '') {
	// Add reload-secret to config.json to be able to run /reload?key=your-secret-key that will reload collections without restarting server
	console.log(
		'reload-secret configuration is empty. You will not be able to update all collections without restarting server.'
	);
}
app.version = JSON.parse(
	fs.readFileSync(__dirname + '/package.json', 'utf8')
).version;
// Files helper
app.fs = require('./src/files')(app);

// JSON loader
app.loadJSON = require('./src/json').bind(this, app);

// Add directories storage
app.dirs = require('./src/dirs')(app);
if (!app.dirs.getRepos().length) {
	console.error(
		'No repositories found. Make sure either Iconify or custom repository is set in configuration.'
	);
	return;
}
// Collections
app.collections = Object.create(null);
app.reload = require('./src/reload').bind(this, app);

// Sync module
app.sync = require('./src/sync').bind(this, app);

// API request and response handlers
app.response = require('./src/response').bind(this, app);
app.iconsRequest = require('./src/request-icons').bind(this, app);
app.miscRequest = require('./src/request').bind(this, app);

// Start application
require('./src/startup')(app)
	.then(() => {
		
		// Create HTTP server
		app.server = express();
		
        app.server.use(cors(corsOptions));
		// parse requests of content-type - application/json
		app.server.use(bodyParser.json());

		// parse requests of content-type - application/x-www-form-urlencoded
		app.server.use(bodyParser.urlencoded({ extended: true }));
		//app.server.use('/', routesHandler);
		// Disable X-Powered-By header
		app.server.disable('x-powered-by');

		// CORS
		app.server.get('/cors', (req, res) => {
			res.set('Access-Control-Allow-Origin', '*');
			res.send({ "msg": "This has CORS enabled 🎈" })
			})
		app.server.options('/*', (req, res) => {
			console.log('inside2');
			if (app.config.cors) {
				res.header(
					'Access-Control-Allow-Origin',
					app.config.cors.origins
				);
				res.header(
					'Access-Control-Allow-Methods',
					app.config.cors.methods
				);
				res.header(
					'Access-Control-Allow-Headers',
					app.config.cors.headers
				);
				res.header('Access-Control-Max-Age', app.config.cors.timeout);
			}
			res.send(200);
		});
		
		// GET 3 part request
		app.server.get(
			/^\/([a-z0-9-]+)\/([a-z0-9-]+)\.(js|json|svg)$/,
			(req, res) => {
				console.log('inside3');
				// prefix/icon.svg
				// prefix/icons.json
				app.iconsRequest(
					req,
					res,
					req.params[0],
					req.params[1],
					req.params[2]
				);
			}
		);

		// GET 2 part JS/JSON request
		app.server.get(/^\/([a-z0-9-]+)\.(js|json)$/, (req, res) => {
			// prefix.json
			console.log('inside4');
			app.iconsRequest(req, res, req.params[0], 'icons', req.params[1]);
			
		});

		// GET 2 part SVG request
		app.server.get(/^\/([a-z0-9:-]+)\.svg$/, (req, res) => {
			console.log('inside5');
			let parts = req.params[0].split(':');

			if (parts.length === 2) {
				// prefix:icon.svg
				app.iconsRequest(req, res, parts[0], parts[1], 'svg');
				return;
			}

			if (parts.length === 1) {
				parts = parts[0].split('-');
				if (parts.length > 1) {
					// prefix-icon.svg
					app.iconsRequest(
						req,
						res,
						parts.shift(),
						parts.join('-'),
						'svg'
					);
					return;
				}
			}

			app.response(req, res, 404);
		});

		// Send robots.txt that disallows everything
		app.server.get('/robots.txt', (req, res) =>
		
			app.miscRequest(req, res, 'robots')
		);
		app.server.post('/robots.txt', (req, res) =>
		
			app.miscRequest(req, res, 'robots')
		);

		// API version information
		app.server.get('/version', (req, res) =>
			app.miscRequest(req, res, 'version')
		);
		// API version information
		//app.server.use('/convert', routesHandler);
		//app.server.get('/convert', (req, res) =>
		//	app.miscRequest(req, res, 'version')
		//);
		
		app.server.get('/convert', (req, res) => {
			app.server.use('/convert', routesHandler);
			//res.end(JSON.stringify(str));
			//res.end('ttt');
		});
		// Reload collections without restarting app
		app.server.get('/reload', (req, res) =>
			app.miscRequest(req, res, 'reload')
		);
		app.server.post('/reload', (req, res) =>
			app.miscRequest(req, res, 'reload')
		);

		// Get latest collection from Git repository
		app.server.get('/sync', (req, res) =>
			app.miscRequest(req, res, 'sync')
		);
		app.server.post('/sync', (req, res) =>
			app.miscRequest(req, res, 'sync')
		);

		// Redirect home page
		app.server.get('/', (req, res) => {
			//res.redirect(301, app.config['index-page']);
			//console.log('insdie');
			//iconsss = [];
			//let collection = new Collection();
			//collection.loadIconifyCollection('mdi');
			//i=0;
			//collection.listIcons(true).forEach(icon => {
			//	let svg = new SVG(collection.getIconData(icon));
			//	iconsss[i] = 'mdi-' + icon + '.svg';
			//	i++;
				//fs.writeFileSync('mdi-' + icon + '.svg', svg.getSVG({
				//	height: 'auto'
				//}));
			//});
			//res.end(JSON.stringify(iconsss));
		});
        
		// Create server
		app.server.listen(PORT, () => {
			console.log('Listening on port ' + PORT);
		});
	})
	.catch((err) => {
		console.error(err);
	});
//app = express();	

// simple route
/*app.get("/", (req, res) => {
  res.json({ message: "Welcome to application." });
});
app.get("/icons", (req, res) => {
    res.json({ message: "Welcome to application.here" });
});*/

// set port, listen for requests

/*app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});*/
// 404 Error
/*app.use((req, res, next) => {
    next(createError(404))
  })
  
  app.use(function (err, req, res, next) {
    console.error(err.message)
    if (!err.statusCode) err.statusCode = 500
    res.status(err.statusCode).send(err.message)
  })*/
/*
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });*/
