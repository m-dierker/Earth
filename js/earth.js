function FaceEarth() {

    window.earth = this;

    this.fetcher = new EarthFetcher(this);
    this.markers = new Array();
    this.markersByLat = {};
    this._inSlideshow = false;

    var options = {
        zoom: .1,
        position: LOCATION_STARTING
    };

    $('#earth').resize(function() {
        this.earth.handleResize();
        this.adjustEarthBackground(false);
    }.bind(this));

    this.listenerSetup();

    $('#container').fadeIn(750);

    this.earth = new WebGLEarth('earth', options);
    this.resetEarth();

    setTimeout(this.setup.bind(this), 50);
}

/**
 * Sets up button listeners and such
 */
FaceEarth.prototype.listenerSetup = function() {

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

    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange',this.onFullScreenChange.bind(this));
}

FaceEarth.prototype.addFacebookToMap = function(userID) {
    for (var albumID in this.albums[userID]) {
        for (var photoID in this.albums[userID][albumID].images) {

            var photo = this.albums[userID][albumID].images[photoID];

            if (photo.place && photo.place.location && photo.place.location.latitude && photo.place.location.longitude) {
                this.createMarker(photo.place.location.latitude, photo.place.location.longitude, photo);
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

    this._facebookSetup = false;

    for (var marker_key in this.markers) {
        this.markers[marker_key].enabled = false;
        this.markers[marker_key].element.style.display = 'none';
    }

    this.resetEarth();
};

/**
 * Called when the user enters or exits full screen mode
 */
FaceEarth.prototype.onFullScreenChange = function() {
    setTimeout(function(){this.adjustEarthBackground(false);}.bind(this), 100);
}

/**
 * Adjusts the earth's background we use right now to prevent the awkward hole
 * @param  {boolean} animate Whether or not to animate the change (on by default)
 */
FaceEarth.prototype.adjustEarthBackground = function(animate) {
    var trans = {};

    if (!animate) {
        if (this._earthBGTimeout) {
            clearTimeout(this._earthBGTimeout);
        }
        $('#earth').removeClass('earth-trans');
    }

    $('#earth').css('background-size', (((6.50/7.21)*window.innerHeight/100)*parseInt($('#earth')[0].style.height)) + 'px');

    if (!animate) {
        this._earthBGTimeout = setTimeout(function() {
            $('#earth').addClass('earth-trans');
        }, 1000);
    }
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
            this.adjustEarthBackground(true);
            this.setupFacebook(response.authResponse.userID);
        } else {
            $('#fb-button').fadeIn();
            $('#earth').css('height', '80%').css('width', '80%');;
            this.adjustEarthBackground(true);
        }
        setTimeout(this.earth.handleResize.bind(this.earth), 1000);
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
    this.earth.flyTo(LOCATION_STARTING[0], LOCATION_STARTING[1], 100000000, 0, 0);
    this.earth.setZoom(2.39315877065304);
    this.spin(.1);
};

FaceEarth.prototype.createMarker = function(lat, lng, photo) {

    // If we already have something at the *exact* same spot, use only one marker. Even slightly off won't be caught by this.
    var marker;
    if (this.markersByLat[this.latKey(lat,lng)]) {
        marker = this.markersByLat[this.latKey(lat,lng)].marker;
        marker.photos.push(photo);
        return;
    }

    marker = this.earth.initMarker();

    if (!marker.photos) {
        marker.photos = new Array();
    }

    marker.photos.push(photo);
    this.markers.push(marker);

    marker.setPosition(lat, lng);
    if (!this.markersByLat[this.latKey(lat, lng)]) {
        this.markersByLat[this.latKey(lat, lng)] = {};
    }
    this.markersByLat[this.latKey(lat, lng)].marker = marker;

    marker.on('click', function(e) {
        this.markerClicked(e);
    }.bind(this));

    marker.on('mouseover', function(e) {
        this.markerMouseOver(e);
    }.bind(this));

    marker.on('mouseout', function(e) {
        this.markerMouseOut(e);
    }.bind(this));
}

FaceEarth.prototype.latKey = function(lat, lng) {
    return 't' + lat + '|' + lng;
}

FaceEarth.prototype.markerMouseOver = function(e) {
    var lat = e.latitude;
    var lng = e.longitude;
    var markerInfo = this.markersByLat[this.latKey(lat, lng)];

    this.openPopup(e, markerInfo.marker);
}

FaceEarth.prototype.markerMouseOut = function(e) {
    var lat = e.latitude;
    var lng = e.longitude;
    var markerInfo = this.markersByLat[this.latKey(lat, lng)];

    this._closePopup = setTimeout(function(e){this.closePopup(e, markerInfo.marker)}.bind(this), 1000);
}

FaceEarth.prototype.markerClicked = function(e) {
    var lat = e.latitude;
    var lng = e.longitude;
    var markerInfo = this.markersByLat[this.latKey(lat, lng)];
    var evt = e;
    if (!markerInfo.clicks || markerInfo.clicks == 0) {
        markerInfo.clicks = 1;
        markerInfo.timer = setTimeout(function(e){this.clearClicksForMarker(markerInfo.marker, lat, lng, evt);}.bind(this), 250);
    } else if (markerInfo.clicks >= 1) {
        markerInfo.clicks = 0;
        if (markerInfo.timer) {
            clearTimeout(markerInfo.timer);
        }
        this.markerDoubleClick(e, markerInfo.marker);
    }

    this.killEventWithFire(e);
}

FaceEarth.prototype.markerDoubleClick = function(e, marker) {
    console.log("Marker double click");

    this.setupSlideshow(marker);
};

FaceEarth.prototype.markerSingleClick = function(e, marker) {
    console.log("Marker single click");
};

FaceEarth.prototype.setupSlideshow = function(marker) {
    this.resetEarth();
    var css = {
        height: '40%',
        width: '40%'
    };
    css['margin-right'] = '-100px';
    css['background-size'] = '1px';
    $('#earth').css(css);

    this._inSlideshow = true;

    this.slideshowPictures = new Array();

    this.addMarkerPhotosToSlideshow(marker);

    setTimeout(function(){
        this.adjustEarthBackground();
        this.earth.handleResize();
        this.startSlideshow();
    }.bind(this),1000);
};

FaceEarth.prototype.startSlideshow = function() {
    this._slideshowIndex = 0;
    this.changePictureInSlideshow();
    $('#slideshow').show();
    setInterval(this.changePictureInSlideshow.bind(this), 5000);
}

FaceEarth.prototype.changePictureInSlideshow = function() {
    var imgIndex = (this._slideshowIndex >= this.slideshowPictures.length ? 0 : this._slideshowIndex);

    var img = this.slideshowPictures[imgIndex];

    var duration = 1000;

    $('#slideshow-img').fadeOut(duration);
    setTimeout(function(){$('#slideshow-img').attr('src', img.source).fadeIn(duration)}.bind(this), duration);
}

FaceEarth.prototype.addMarkerPhotosToSlideshow = function(marker) {
    for (var a = 0; a < marker.photos.length; a++) {
        this.slideshowPictures.push(marker.photos[a]);
        this.preloadImage(marker.photos[a].source);
    }
}

FaceEarth.prototype.preloadImage = function(url) {
    var img = new Image();
    img.src = url;
}

FaceEarth.prototype.isSlideshow = function() {
    return this._inSlideshow;
}

FaceEarth.prototype.openPopup = function(e, marker) {
    if (this._closePopup) {
        clearTimeout(this._closePopup);
    }

    var photo = marker.photos[0];
    $('#marker-popover .popover-title').html(photo.place.name);
    $('#marker-popover .popover-content').html('<img src="' + photo.picture + '">');
    $('#marker-popover').fadeIn();

}

FaceEarth.prototype.closePopup = function(e, marker) {
    if (this._closePopup) {
        this._closePopup = null;
    }
    $('#marker-popover').fadeOut();
};

FaceEarth.prototype.clearClicksForMarker = function(marker, lat, lng, e) {
    this.markersByLat[this.latKey(lat, lng)].clicks = 0;
    this.markerSingleClick(e, marker);
};

FaceEarth.prototype.killEventWithFire = function(e) {
    e.cancel=true;
    e.returnValue=false;
    e.cancelBubble=true;
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    return false;
}

/**
 * Load the earth when we load the window
 */
window.onload = function() {
    var earth = new FaceEarth();
}
