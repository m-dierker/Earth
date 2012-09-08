function FaceEarth() {

    window.earth = this;

    this.fetcher = new EarthFetcher(this);
    this.markers = new Array();

    var options = {
        zoom: .1,
        position: LOCATION_STARTING
    };

    $('#earth').resize(function() {
        this.earth.handleResize();
    }.bind(this));

    this.buttonSetup();

    $('#container').fadeIn(750);

    this.earth = new WebGLEarth('earth', options);
    this.resetEarth();

    setTimeout(this.setup.bind(this), 50);

    // setInterval(this.createMarker.bind(this), 5000);
}

/**
 * Sets up button listeners
 */
FaceEarth.prototype.buttonSetup = function() {

    $('#add-player-button').click(function(){

    }.bind(this));

    $('#fullscreen-button').click(function() {
        this.toggleFullscreen();
    }.bind(this));

    $('#spin-left-button').click(function() {
        if (this._spinInterval == .1) {
            this.stopSpinning();
        } else {
            this.spin(.1);
        }
    }.bind(this));

    $('#spin-right-button').click(function() {
        if (this._spinInterval == -.1) {
            this.stopSpinning();
        } else {
            this.spin(-.1);
        }
    }.bind(this));

    $('#logout-button').click(function() {
        this.logout();
    }.bind(this));
}

FaceEarth.prototype.addFacebookToMap = function(userID) {
    for (var albumID in this.albums[userID]) {
        for (var photoID in this.albums[userID][albumID].images) {

            var photo = this.albums[userID][albumID].images[photoID];

            if (photo.place && photo.place.location && photo.place.location.latitude && photo.place.location.longitude) {
                this.createMarker(photo.place.location.latitude, photo.place.location.longitude, '<a href="' + photo.source + '" target="_blank"><img src="' + photo.picture + '"></a>');
            }
        }
    }

    this.stopSpinning();
    this.earth.flyTo(LOCATION_SIEBEL[0], LOCATION_SIEBEL[1], 5000, 0, 0);
}

/**
 * Completes setup so we can get the earth spinning as quickly as possible
 */
FaceEarth.prototype.setup = function() {
    this._facebookSetup = false;

    this.hidePromoText();
    this.checkFacebook();

    FB.Event.subscribe('auth.statusChange', this.checkFacebook.bind(this));
}

FaceEarth.prototype.logout = function() {
    FB.logout();
    this.albums = {};
    this.friends = {};

    for (var marker_key in this.markers) {
        this.markers[marker_key].enabled = false;
        this.markers[marker_key].element.style.display = 'none';
    }

    this.resetEarth();
};

/**
 * Toggles fullscreen
 */
FaceEarth.prototype.toggleFullscreen = function() {
    if (document.fullScreen) {
        document.cancelFullscreen();
    } else {
       var el = document.documentElement
        , rfs =
               el.requestFullScreen
            || el.webkitRequestFullScreen
            || el.mozRequestFullScreen
        ;
        rfs.call(el);
    }
};

/**
 * Things that should happen once the user has connected to Facebook
 */
FaceEarth.prototype.setupFacebook = function(userID) {
    if (!this._facebookSetup) {
        this._facebookSetup = true;
        this.userID = userID;

        if (!this.albums) {
            this.albums = {};
        }

        // Get the user's albums
        this.fetcher.fetchAlbumsForUser(this.userID);

        if (!this.friends) {
            this.friends = {};
        }

        // Get the user's friends
        this.fetcher.fetchFriendsForUser(this.userID);
    }
}

/**
 * Checks the login status for the facebook button, and adds pictures to the map (as well as fetches the associated data on pictures)
 */
FaceEarth.prototype.checkFacebook = function() {

    FB.getLoginStatus(function(response) {
        if(response.status === 'connected') {
            $('#fb-button').fadeOut();
            $('#earth').css('height', '100%').css('width', '100%');;
            this.setupFacebook(response.authResponse.userID);
        } else {
            $('#fb-button').fadeIn();
            $('#earth').css('height', '80%').css('width', '80%');;

            if (this.markers.length > 0) {
                setTimeout(this.earth.handleResize.bind(this.earth), 1000);
            }
        }
    }.bind(this));
}

/**
 * Starts a slow spinning animation
 */
FaceEarth.prototype.spin = function(latAdd) {
    if (this._spinner) {
        this.stopSpinning();
    }
    var p = this.earth.getPosition();
    this.earth.flyTo(p[0], p[1], 5000, this.earth.getHeading(), this.earth.getTilt());
    this._spinInterval = latAdd;
    this._spinner = setInterval(function(){
        var pos = this.earth.getPosition();
        this.earth.setPosition(pos[0], pos[1]+latAdd);
    }.bind(this), 30);
}

/**
 * Stops the spinning globe
 */
FaceEarth.prototype.stopSpinning = function() {
    clearInterval(this._spinner);
    this._spinner = 0;
    this._spinInterval = 0;
}

/**
 * Hides the promo text that the WebGL Earth inserts since it hurts the
 * extremely clean interface. I'll find a way to add it back later.
 */
FaceEarth.prototype.hidePromoText = function() {
    $('p:contains("Powered by")').parent().hide();
}

FaceEarth.prototype.resetEarth = function() {
    this.earth.flyTo(LOCATION_STARTING[0], LOCATION_STARTING[1], 10000000, 0, 0);
    this.spin(.1);
};

FaceEarth.prototype.createMarker = function(lat, lng, html) {

    var marker = this.earth.initMarker();

    this.markers.push(marker);

    // var lat = LOCATION_SIEBEL[0] + (Math.random() - .5)/10;
    // var lng = LOCATION_SIEBEL[1] + (Math.random() - .5)/10;

    marker.setPosition(lat, lng);

    marker.bindPopup(html);
}

/**
 * Load the earth when we load the window
 */
window.onload = function() {
    var earth = new FaceEarth();
}
