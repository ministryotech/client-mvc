# Client MVC #
A lightweight client MVC framework for building small Single Page Applications in Javascript with it's roots in Backbone.

### Introduction ###
A Lightweight MVC framework for Javascript with it's roots in Backbone. 

The opposite of my similar backbone-ribs project, the intention is to create a framework without the strict REST model dependencies of Backbone that is focussed on view management, leaving data access up to the framework user to do as they see fit. Models in Client MVC are regarded as simple dumb objects for the most part and can be basic JSON responses, the implementation of which is in your hands (hence why there are no base Model or Collection objects). Instead, Client MVC makes heavy use of controller classes which are expected to call data access methods to obtain data which can then be returned in either a custom form or as raw JSON.

#### Known Issues ####
* This is still a heavy beta project

#### Dependencies ####
Client MVC is dependent on Underscore and jQuery. The jQuery dependency is not managed by the NPM or Nuget packages, giving you freedom to manage your jQuery implementation how you like.

### Core Client MVC Objects ###
Client MVC currently exposes the following primary objects for building simple Single Page Apps...

#### ClientMVC.Controller ####
A Controller is where your application's core logic, or the entry points to it, should be located. 
Any class extending ClientMVC.Controller should ensure to call the replaced methods as follows...

    ClientMVC.Controller.prototype.init(view, region);

In Client MVC a controller is reponsible for managing the content of a given region (or regions).
        
A sample controller could look like this...

    var coreController = MVC.Controller.extend({
    
        name : 'core controller',
    
        init : function() {
            ClientMVC.Controller.prototype.init(new CoreView(), new CoreRegion());
        }
        
        showAltView : function() {
            ClientMVC.Controller.prototype.showView(new AltCoreView());
        }
        
    });

All of the properties of the base controller defined here can be overridden as indicated in the sample region defined above. Each of these properties has a specific purpose...

* name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where errors occur far easier.
* region: The linked region object currently in use. THIS SHOULD NOT BE OVERRIDDEN (see init()).
* view: The linked view object currently in use. THIS SHOULD NOT BE OVERRIDDEN (see init()).

* init(): Initiates a controller - This sets the initial view and region and calls the 'showView()' method.
* showView(): Renders the specified view into the controller's region. If a view is not specified then the controller's initialView will be used.

#### ClientMVC.AuthController ####
An Auth Controller is a special type of controller that implements authentication. It's essentially your login controller whether the authentication process is user interractive or not. 
Any class extending ClientMVC.AuthController should ensure to call the replaced methods as follows...

    ClientMVC.AuthController.prototype.init(view, region);

An auth controller needs to implement an 'isAuthenticated()' method and optionally log in and log out features. It is responsible for handling the authentication of users and generating cookies and session data to ensure users are logged in.
        
A sample controller could look something like this...

    var loginController = ClientMVC.AuthController.extend({

       currentSession : null,
        
        init : function() {
            ClientMVC.AuthController.prototype.init(new myView(), new myRegion())
            if (this.isAuthenticated()) {
                var hash = CookieManager.getSessionData().split(' ')[1];
                this.currentSession = new UserSession(hash);
            }
        },
        
        isAuthenticated : function() {
            var authData = CookieManager.getSessionData();
            return authData != undefined && authData != null && authData.length > 0;
        },
        
        logIn : function() {},
        logOut : function() {}
        
    });

All of the properties of the base controller can be overridden as indicated in the sample defined above. The 'isAuthenticated()' method MUST be overridden. Each of these properties has a specific purpose...

* name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where errors occur far easier.

* init(): Initiates a controller - This sets the initial view and region but DOES NOT call the showView() method.
* isAuthenticated(): Determines whether the site has a currently logged in user.

#### ClientMVC.SecuredController ####
A Secured Controller is a special type of controller which represents a controller where it's functionality is restricted by the authenticatin state of a provided Auth Controller (see above). 
Any class extending ClientMVC.SecuredController should ensure to call the replaced methods as follows...

    ClientMVC.SecuredController.prototype.init(view, region, authController);

A secured controller requires that an Auth Controller has been authenticated against in order to load. If authentication has failed or has not yet been made then the Secured Controller will redirect to the auth
controller automatically.

A sample controller could look something like this...

    var secureController = ClientMVC.SecuredController.extend({
    
        name : 'my secure controller',
        
        init : function() {
            ClientMVC.SecuredController.prototype.init(new myView(), new myRegion(), MYAPP.Controllers.MyAuthController);
        }
        
    });

All of the properties of the base controller defined here can be overridden as indicated in the sample defined above.

* name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where errors occur far easier.

* init(): Initiates a controller - This either calls through to the base controller init method or shows the auth controller view if the auth controller has not yet been authenticated.

#### ClientMVC.Region ####
Region implementations generally tend to be extremely lightweight, as the Client MVC code here does most of what is required.

Although the framework is lightweight and allows much variation; best practice when using Client MVC is to look at a 'View' as being responsible for itself in that it's a piece of contained markup that is NOT attached to anything on a page. In a Client MVC based App containers on a page are wrapped by Regions and the regions are responsible for then rendering a view into the container that they represent. So the basic rule is...

* Is it new markup? = View
* Is the markup a container that's already present in a page or generated by another view? = Region

A Region is responsible for the rendering of any views within itself and triggering the binding and unbinding of any events.
A sample region could look like this...

    var coreRegion = MVC.Region.extend({
    
        name : 'core region',
        container: '#app-wrapper',
        
    });
   
All of the properties of the base region defined here can be overridden as indicated in the sample region defined above. Each of these properties has a specific purpose...

* name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where errors occur far easier.
* container: The jQuery selector representing the containing element that the region represents.
* parentRegion: The Region object representing the parent region. Null for the master region.
* parentView: The View object representing the parent view that the Region's selector is rendered in. Null for the master region.
* currentView: The View object currently rendered within the region.

* isAvailable(): Indicates if a region is available for rendering into.
* renderView(): Renders the specified view into the region. If the region container does not exist then this will trigger up the parent stack until an item is found and the items will render up to a point to allow the view to be rendered within this region. Once the view is rendered then the view's 'bindEvents()' method is triggered.
* disposeView(): Clears the current region and unbinds all events for the attached view. Disposal is important to avoid any memory leaks.
* extend(): This method is added to most of the key super classes in Client MVC and allows them to be extended and elements overridden and added to.
          
ClientMVC.DefaultRegion: The namespace exposes a DefaultRegion instance. This should represent the region at the uppermost level of your SPA. This is set to a standard region by default, so if you create a simple HTML page with a div on it with an ID of 'app' then that is where the base region for the app will be - you can customise and override this as you like in your app initialisation.
     
VIEW LIFECYCLE: Client MVC views maintain their bindings and have specific methods to dispose all of the events they use. A region will clear up any views it contains before allowing a new one to be attached, calling the 'clearEvents()' method on the view to clean up any used resources. It also has it's own 'disposeView()' method that will clear it's currentView.

#### ClientMVC.View ####
A view represents a visual element of the application and is always associated with a Template.

Although the framework is lightweight and allows much variation; best practice when using Client MVC is to look at a 'View' as being responsible for itself in that it's a piece of contained markup that is NOT attached to anything on a page. In a Client MVC based App containers on a page are wrapped by Regions and the regions are responsible for then rendering a view into the container that they represent. So the basic rule is...

* Is it new markup? = View
* Is the markup a container that's already present in a page or generated by another view? = Region

A view implementation will contain key elements defined below and map elements through jQuery selectors to the associated template.

A sample view could look something like this...

    var myView = ClientMVC.View.extend({
        
        name : 'my view',
        template: TemplateSource,
        
    });
    
    myView.prototype.renderContent = function() {
        MyTemplateEngine.html(this.template, this.getDataObject();
    };
    
    myView.prototype.logOut = function(e) {
        e.preventDefault();
        MYAPP.Controllers.Auth.logOut();
    };
    
    myView.prototype.events = [
        new ClientMVC.View.Event($('#logout-button'), 'click', myView.prototype.logOut)
    ];

All of the properties of the base view can be overridden as indicated in the sample view defined above. If the template needs to be processed with data then the 'renderContent()' method must be replaced in the child class.

* name : This is for debugging purposes only and indicates which view you are using - populating this will make identifying where errors occur far easier.
* template: This is the template content for the view to process. This could be a piece of static HTML or it could be a fragment in a file, using a templating engine like Mustache or Handlebars.
* data: This is the JSON data or a function that returns JSON data to power the view and can be null.
* events: This is an array of ClientMVC.View.Event objects (see below) which map defined elements in the template.

* getDataObject(): The data object from View.data as an object fully loaded. Should be called by renderContent();
* bindEvents(): Goes through any events defined and binds them to the template. This method is called automatically by a region when it renders the view.
* clearEvents(): Removes any existing event bindings on the view. This method is called automatically by a region when disposing of a view.
* renderContent(): By default, this returns the template content as it stands. This is fine if the template is static HTML. If you need to process data with your view then this method should be overridden.
* postRender(): By default, this does nothing but when overridden this is called by the rendering view after render has completed.

#### ClientMVC.View.Elements ####
This namespace is created in Client MVC so that elements for each view can be appended to it for reference elsewhere in the custom view code. Elements would potentially look like this but are entirely optional...

    ClientMVC.View.Elements.MyView = {
        username : '#email',
        password : '#password',
        loginButton : '#form input[type=submit]'
    };

VIEW LIFECYCLE: Client MVC views maintain their bindings and have specific methods to dispose all of the events they use. When used in conjunction with a Region, to represent the holding area for the view, these methods ensure that orphan views and events within a region are always removed when not used anymore preventing memory leaks.

#### ClientMVC.View.Event ####
An event represents an event handler for an item on the template, wrapping a jQuery style event. When writing the event callback function the value 'this' is bound to the event as the parent object using prototype.bind().

A sample event can be seen in the view documentation above. Unlike most of the other elements of Client MVC, events are not overridden they are just created using 'new ClientMVC.View.Event()' and passing in a jQuery selector for the item, the name of the event and the function to execute when the event occurs.
    
An event has methods for bind and clear (called bindEvent and clearEvent). These methods are called by the view that the event belongs to automatically by the view's bind and clear methods (which are, in turn, called by the region).

#### ClientMVC.Router ####
The routing system. Routers map faux-URLs to actions, and fire events when routes are matched. The router and history sections in ClientMVC are based on Backbone.
        
A sample router could look something like this...    

    var router = ClientMVC.Router.extend({
    
        name : 'my router',
        
        init : function() {
            // Do some auth stuff here
        },

        routes: [
            new ClientMVC.Router.Route('search/*query', function(query) {
                alert(query);
            }, 'searchRoute'),
            new ClientMVC.Router.Route('posts/:id', function(id) {
                alert(id);
            }, 'searchRoute'),
            new ClientMVC.Router.Route('posts/:id/:pref', function(id, pref) {
                alert(id + ' Ordered from ' + pref);
            }, 'searchRoute'),
            new ClientMVC.Router.Route('home', function() {
                alert('You are home');
            }, 'homeRoute'),
            new ClientMVC.Router.Route('away', function() {
                alert('You are away');
            }, 'awayRoute'),
            new ClientMVC.Router.Route('*action', function(action) {
                alert('You are at ' + action);
            }, 'defaultRoute')
        ]
        
    });

For a routed app the router is a key component so you may wish to attach it yo your application's namespace.

Many of the properties of the base router can be overridden as indicated in the sample view defined above. The routes array must be overridden in order to set up the routes themselves. It is unlikely that you would wish to override any of the other elements in most cases as it is nicely self contained. The router uses ClientMVC.History's default implementation (see below).

#### ClientMVC.Router.Route ####
A route is a simple object structure definition that represents a route. A route consists of a route, a callback and a name. The roter example above shows construction of Route objects.

#### ClientMVC.History ####
The History system handles the management of forward and back using hash change and / or push state. This functionality is lifted almost line for line from Backbone.

The router uses the default history implementation of ClientMVC.history. If you override any functionality to create your own implementation of history it should be loaded in the same namespace to connect up to the rest of Client MVC as follows...

    ClientMVC.history = ClientMVC.History.extend({
    
        name : 'my history'
    });


Cross-browser history management is based on either [pushState](http://diveintohtml5.info/history.html) and real URLs, or [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange) and URL fragments. If the browser supports neither (old IE, natch) it falls back to polling.

### Javascript Functional Extensions ###
As well as the core part of Client MVC itself, the library also adds the following global Javascript helpers to aid in creating more terse, readable code...

* Object.hasValue - Returns true if the object is not undefined, null or empty
* Object.exists - Returns true if the object is not undefined or null
* Object.isTruthy - Returns true if the object is not undefined or null and is true
* Object.isFunction - Returns true if the object is not undefined or null and is a function
* String.trim() - Set up if not supported by the target browser
* String.ltrim() - Set up if not supported by the target browser
* String.rtrim() - Set up if not supported by the target browser
* String.fulltrim() - Set up if not supported by the target browser
* String.escapeRegExp() - Escape regular expressions
* String.replaceAll(find, replace) - Find and replace one value with another

### How do I get set up? ###
Client MVC is designed to be used either traditionallly, exposing itself as a global scope object, or through an AMD pattern implemented by a product like RequireJS.

#### To set up as a Global scope object ####
Add a reference to Client MVC and it's dependencies to your page as follows. Paths may vary, but the paths given here assume that the reference was obtained from NPM...

    <script src="node_modules/client-mvc/node_modules/underscore/underscore.js"></script>
    <script src="node_modules/client-mvc/client-mvc.js"></script>

Client MVC has an additional dependency on jQuery. This is not hardcoded into the NPM package to allow you to use the version of jQuery suited to your project and locate it where you like.

#### To set up with RequireJS ####
With RequireJS in use I use the following as a base RequireJS config (again assuming NPM paths)...

    require.config({
        baseUrl: "{insert your app base url here - commonly empty, app/ or scripts/}",
        paths: {
            jquery: "node_modules/jquery/dist/jquery",
            underscore: "node_modules/client-mvc/node_modules/underscore/underscore",
            client-mvc: "node_modules/client-mvc/client-mvc"
        },
        shim: {
            jquery: { exports: '$' },
            underscore: { exports: '_' },
            client-mvc: { deps: ['underscore', 'jquery'], exports: 'MVC' }
        }
    });


### Advanced Usage Patterns ###
For more complex products I recommend using a patter that allows you to create your own variation of the key Client MVC objects that extend the main object elements themselves. This allows for integration of client mvc updates while minimising the potential for breaking your code but allows you to slip in your own variations into the design for your own app.

In a global scope object style a sample extended version of Client MVC may look something like this...

    (function() {
    
        if (window.ClientMVC === undefined)
            throw 'ClientMVC has not been set up on the page.';
    
        window.MyMVC = window.MyMVC || {};
    
        window.MyMVC.Controller = window.ClientMVC.Controller;
        window.MyMVC.AuthController = window.ClientMVC.AuthController;
        window.MyMVC.View = window.ClientMVC.View;
    
        window.MyMVC.SecuredController = window.ClientMVC.SecuredController.extend({
            
            // Your customisation code here
            
        });
    
        window.MyMVC.Region = window.ClientMVC.Region.extend({
            
            // Your customisation code here.
            
        });
        
        window.MyMVC.Router = window.ClientMVC.Router.extend({
        
            routes: [
                // new routes here.
            ]
        
        });
    })();


Using RequireJS (which I wholeheartedly recommend for SPA projects) it would look like this...

    define(['client-mvc'],
        function(ClientMVC) {

            var exSecureController = ClientMVC.SecuredController.extend({

                // Your customisation code here

            });

            var exRegion = ClientMVC.Region.extend({

                // Your customisation code here.

            });

            var appRouter = ClientMVC.Router.extend({

                routes: [
                    // new routes here.
                ]

            });

            return {
                Controller: ClientMVC.Controller,
                AuthController: ClientMVC.AuthController,
                SecuredController: exSecureController,
                View: ClientMVC.View,
                Region: exRegion,
                Router : appRouter
            };
        });

## The Ministry of Technology Open Source Products ##
Welcome to The Ministry of Technology open source products. All open source Ministry of Technology products are distributed under the MIT License for maximum re-usability. Details on more of our products and services can be found on our website at http://www.minotech.co.uk

Our other open source repositories can be found here...

* [https://github.com/ministryotech](https://github.com/ministryotech)
* [https://github.com/tiefling](https://github.com/tiefling)

Most of our content is stored on both Github and Bitbucket.

### Where can I get it? ###
You can download the javascript file (dev or minified version) from the downloads page here and add it to your website manually or you can use any of the following package managers...

- **NPM** - [https://www.npmjs.org/package/client-mvc](https://www.npmjs.org/package/client-mvc)
- **NUGET** - [https://www.nuget.org/packages/client-mvc](https://www.nuget.org/packages/client-mvc)

### Contribution guidelines ###
If you would like to contribute to the project, please contact me.

The source code can be used in a simple text editor or within Visual Studio using NodeJS Tools for Visual Studio. We recommend Visual Studio Code or Sublime Text!

### Who do I talk to? ###
* Keith Jackson - keith@minotech.co.uk
