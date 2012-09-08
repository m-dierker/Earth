function EarthFetcher(earth) {
    this.earth = earth;
}

/**
 * Gets the albums for a user and puts them in the albums object
 * @param  {int} userID The user ID
 */
EarthFetcher.prototype.fetchAlbumsForUser = function(userID) {
    this.fetchAlbumsForUserWithURL(userID, '/' + userID + '/albums?limit=500&fields=id,name,from');
}

/**
 * Using a given URL, fetches albums for a user
 * @param  {int} userID the user ID
 * @param  {string} url the URL to use
 */
EarthFetcher.prototype.fetchAlbumsForUserWithURL = function(userID, url) {
    FB.api(url, function(response){
        this.addAlbumsForUser(userID, response.data);
        if (response.paging && response.paging.next) {
            setTimeout(function(){this.fetchAlbumsForUserWithURL(userID, response.paging.next);}.bind(this), 25);
        } else {
            console.log("Done loading all albums");
            // Get the user's photos
            setTimeout(function(){this.fetchPhotosForAlbums(userID);}.bind(this), 1000);
        }
    }.bind(this));
}

/**
 * Given album data, adds it to the album object
 * @param {int} userID the user ID
 * @param {object} data the data itself
 */
EarthFetcher.prototype.addAlbumsForUser = function(userID, data) {
    if (!this.earth.albums[userID]) {
        this.earth.albums[userID] = {};
    }

    for (var a = 0; a < data.length; a++) {
        this.earth.albums[userID][data[a].id] = data[a];
    }
}


/**
 * Gets the friends for a user and puts them in the friends object
 * @param  {int} userID The user ID
 */
EarthFetcher.prototype.fetchFriendsForUser = function(userID) {
    this.fetchFriendsForUserWithURL(userID, '/' + userID + '/friends?limit=4000&fields=id,name');
}

/**
 * Using a given URL, fetches friends for a user
 * @param  {int} userID the user ID
 * @param  {string} url the URL to use
 */
EarthFetcher.prototype.fetchFriendsForUserWithURL = function(userID, url) {
    FB.api(url, function(response){
        this.addFriendsForUser(userID, response.data);
        if (response.paging && response.paging.next) {
            setTimeout(function(){this.fetchFriendsForUserWithURL(userID, response.paging.next);}.bind(this), 25);
        } else {
            console.log("Done loading all friends");
        }
    }.bind(this));
}

/**
 * Given friends data, adds it to the friends object
 * @param {int} userID the user ID
 * @param {object} data the data itself
 */
EarthFetcher.prototype.addFriendsForUser = function(userID, data) {
    if (!this.earth.friends[userID]) {
        this.earth.friends[userID] = {};
    }

    for (var a = 0; a < data.length; a++) {
        this.earth.friends[userID][data[a].id] = data[a];
    }
}

/**
 * Fetches photos for albums and stores them in the album object
 */
EarthFetcher.prototype.fetchPhotosForAlbums = function(userID) {
    this._albumsRemainingToLoad = 0;
    var userAlbums = this.earth.albums[userID];
    for (var albumID in userAlbums) {
        this._albumsRemainingToLoad++;
        this.fetchPhotosForAlbumWithURL(userID, albumID, '/' + albumID + '/photos?limit=500&fields=id,source,picture,place');
    }
}

/**
 * Fetches photos for albums given a URL
 */
EarthFetcher.prototype.fetchPhotosForAlbumWithURL = function(userID,albumID, url) {
    FB.api(url, function(response){
        this.addPhotosToAlbum(userID, albumID, response.data);
        if (response.paging && response.paging.next) {
            setTimeout(function(){this.fetchPhotosForAlbumWithURL(userID, albumID, response.paging.next);}.bind(this), 25);
        }
    }.bind(this));
}
/**
 * Adds the photos to the album object
 */
EarthFetcher.prototype.addPhotosToAlbum = function(userID, albumID, data) {
    if (!this.earth.albums[userID][albumID].images) {
        this.earth.albums[userID][albumID].images = {};
    }

    for (var a = 0; a < data.length; a++) {
        this.earth.albums[userID][albumID].images[data[a].id] = data[a];
    }

    this._albumsRemainingToLoad--;

    if (this._albumsRemainingToLoad == 0) {
        console.log("Done loading all photos");
        this.earth.addFacebookToMap(userID);
    }
}
