import socketIO from './socketIO'
import EventEmitter from 'eventemitter3'
import never from 'never'

class Model {
  anemia
  context
  constructor (anemia, context) {
    if (!anemia) {
      throw new Error('Anemia model must be specified')
    }
    if (!context) {
      throw new Error('context must be specified.')
    }
    this.anemia = anemia
    this.context = context
  }
}

class Song extends Model {
  #getAsyncProp = name => {
    return (async () => {
      const songPool = await this.context.broker.fetchSongs()
      return songPool.songsById[this.anemia._id][name]
    })()
  }
  // Example data
  // album: "遠走高飛"
  // albumartist: []
  // artist: ["張震嶽"]
  // cover_location: "2a4803b04390340785efc3cba9a0c21b.jpg"
  // date_added: 1571949524605
  // date_modified: 1574188680717
  // disc: 0
  // display_artist: "張震嶽"
  // duration: 235
  // genre: ["Unknown Genre"]
  // location: "/youtube/____ayal_komod____lasang_bastard_official_music_video.mp3"
  // play_count: 35
  // title: "酒鬼"
  // track: 0
  // year: ""
  // _id: "mwREslBj5FE71pOt"
  get albumartist () {
    return this.#getAsyncProp('albumartist')
  }
  get artist () {
    return this.#getAsyncProp('artist')
  }
  get coverLocation () {
    return this.#getAsyncProp('cover_location')
  }
  get dateAdded () {
    return this.#getAsyncProp('date_added')
  }
  get dateModified () {
    return this.#getAsyncProp('date_modified')
  }
  get disc () {
    return this.#getAsyncProp('disc')
  }
  get displayArtist () {
    return this.#getAsyncProp('display_artist')
  }
  get duration () {
    return this.#getAsyncProp('duration')
  }
  get genre () {
    return this.#getAsyncProp('genre')
  }
  get location () {
    return this.#getAsyncProp('location')
  }
  get playCount () {
    return this.#getAsyncProp('play_count')
  }
  get title () {
    return this.#getAsyncProp('title')
  }
  get track () {
    return this.#getAsyncProp('track')
  }
  get year () {
    return this.#getAsyncProp('year')
  }
  get id () {
    return this.anemia._id
  }
}

class Playlist extends Model {
  #songProxy
  #riches = {}
  #createRichSongModel = (anemiaSongModel) => {
    const songId = anemiaSongModel._id
    const richSongModel = this.#riches[songId] || new Song(anemiaSongModel, this.context)
    this.#riches[songId] = richSongModel
    return richSongModel
  }
  #isAnemiaSong = (obj) => {
    if (typeof obj === 'object' && '_id' in obj) {
      return true
    }
    return false
  }
  get title () {
    return this.anemia.title
  }
  get id () {
    return this.anemia._id
  }
  get editable () {
    return this.anemia.editable
  }
  get songs () {
    if (!this.#songProxy) {
      this.#songProxy = new Proxy(this.anemia.songs, {
        get: (target, name) => {
          if (name === 'map') {
            return this.mapSongs.bind(this)
          }
          if (!target[name]) {
            return
          }

          const targetProp = target[name]
          if (this.#isAnemiaSong(targetProp)) {
            return this.#createRichSongModel(targetProp)
          }

          return targetProp
        }
      })
    }
    return this.#songProxy
  }
  mapSongs (each = () => {}) {
    return this.anemia.songs.map((anemiaSongModel, index) => each(
      this.#createRichSongModel(anemiaSongModel), index
    ))
  }
}

class Playlists extends Model {
  items = new Proxy(this.anemia, {
    get: (target, name) => {
      return target[name]
    }
  })
  get (id) {
    const anemia = this.anemia
    console.log('Finding item with id equal to', id, 'from', anemia)
    const ret = anemia.find(item => item._id === id)
    if (!ret) {
      return undefined
    }
    return new Playlist(ret, this.context)
  }
}

export default class Broker extends EventEmitter {
  #socket
  #playlists
  #readyPromiseResolve
  #readyPromise = new Promise((rs) => {
    this.#readyPromiseResolve = rs
  })
  #songPool = {
    songs: undefined,
    songsById: {},
    promise: undefined,
  }
  fetchSongs = () => {
    const songPool = this.#songPool
    if (songPool.promise) {
      return songPool.promise
    }
    songPool.promise = new Promise(rs => {
      const socket = this.#socket
      socket.once('songs', (data) => {
        console.log('Songs returned.')
        const songs = data.songs ?? never('Songs is not found')
        songPool.songs = songs
        songs.forEach(song => songPool.songsById[song._id] = song)
        rs(songPool)
      })
      console.log('Fetch songs...')
      socket.emit('fetch_songs')
    })
    return songPool.promise
  }
  constructor({
    host,
    pathname
  }) {
    super()
    let socket = this.#socket = socketIO.connect('//' + host, {
      path: pathname
    })
    
    socket
      .on('connect', () => {
        console.log('Server connected');

        // notify the server we have connected
        socket.emit('player_page_connected');

        this.#readyPromiseResolve()

        // We don't have to set comp_name
        // // let the server know our remote name (if set)
        // if (player.comp_name) {
        //   socket.emit('set_comp_name', {name: player.comp_name});
        // }
      })
  }
  get ready () {
    return this.#readyPromise
  }
  get playlists () {
    const socket = this.#socket
    return new Promise((rs) => {
      if (this.#playlists) {
        rs(this.#playlists)
        return
      }
      socket.once('playlists', (data) => {
        console.log('Playlists returned');
        const playlists = this.#playlists = new Playlists(
          data.playlists ?? never('Playlists not found'), {
            broker: this
          }
        )

        // pre fetch songs
        this.fetchSongs()

        rs(playlists)
      })
      console.log('Fetching playlists...');
      socket.emit('fetch_playlists')
    })
  }
}

// // soccet connection and events
// socket.on('connect', function() {
//   console.log('Socket connected');

//   // notify the server we have connected
//   socket.emit('player_page_connected');

//   // let the server know our remote name (if set)
//   if (player.comp_name) {
//     socket.emit('set_comp_name', {name: player.comp_name});
//   }
// });

// socket.on('songs', function(data) {
//   player.song_collection.add(data.songs);
//   loadedRestart('songs');
// });

// socket.on('playlists', function(data) {
//   player.playlist_collection.reset();
//   player.playlist_collection.add(data.playlists);

//   // redraw the sidebar
//   MusicApp.router.sidebar();

//   // when they are viewing a playlist that has been updated, refresh it
//   data.playlists.forEach(function(playlist, index) {
//     if (player.playlist &&
//         player.playlist.title === playlist.title &&
//         player.playlist.songs.length !== playlist.songs.length) {
//       // trigger a re-route, this will refresh the songview
//       MusicApp.router.playlist(playlist._id);
//     }
//   });

//   // restart the router if we are loading for the first time
//   loadedRestart('playlists');
// });

// // mask to either update or initialise a messenger
// var updateMask = function(messenger, message) {
//   if (messenger) {
//     messenger.update(message);
//   } else {
//     messenger = Messenger().post(message);
//   }

//   return messenger;
// };

// var SCMessenger = null;
// socket.on('sc_update', function(data) {
//   console.log(data);
//   if (data.type == 'started') {
//     SCMessenger = Messenger().post('Starting download from SoundCloud of ' + data.count + ' tracks' + (data.not_streamable > 0 ? ' (' + data.not_streamable + ' not streamable)' : ''));
//   } else if (data.type == 'added') {
//     // it came with a song
//     player.song_collection.add(data.content);

//     // show an updated message
//     var msg = 'song ' + data.completed + ' out of ' + data.count;
//     if (data.complete == data.count) {
//       msg = 'last song of SoundCloud download';
//     }

//     SCMessenger = updateMask(SCMessenger, 'Added ' + msg + ' (' + data.content.title + ')');

//     // grab the soundcloud playlist from the collection
//     var sc_plist = player.playlist_collection.getByTitle('SoundCloud');

//     // if it existed, do something, otherwise wait for the addPlaylist event
//     if (sc_plist) {
//       sc_plist = sc_plist.attributes;

//       // add the track to the soundcloud playlist
//       sc_plist.songs.push({_id: data.content._id});

//       // render if we are on the SoundCloud playlist
//       if (player.playlist.title == 'SoundCloud') {
//         // update the model data
//         player.playlist = sc_plist;
//         player.songs = player.song_collection.getByIds(player.playlist);
//         player.queue_pool = player.songs.slice(0);
//         player.genShufflePool();

//         // resort the model data
//         player.resortSongs();
//         redrawSongsChangedModel();
//       }
//     }

//     // add the track to the library playlist
//     addToLibraryPlaylist(data.content._id);
//   } else if (data.type == 'skipped') {
//     SCMessenger = updateMask(SCMessenger, 'Skipped song ' + data.completed + '. Unable to read from SoundCloud');
//   } else if (data.type == 'error') {
//     SCMessenger = updateMask(SCMessenger, 'Soundcloud track already exists');
//   }
// });

// var YTMessenger = null;
// socket.on('yt_update', function(data) {
//   console.log(data);
//   if (data.type == 'started') {
//     YTMessenger = Messenger().post('Starting download from Youtube');
//   } else if (data.type == 'added') {
//     player.song_collection.add(data.content);
//     YTMessenger = updateMask(YTMessenger, 'Added ' + data.content.title);
//     var yt_plist = player.playlist_collection.getByTitle('Youtube');
//     if (yt_plist) {
//       yt_plist = yt_plist.attributes;

//       // add the track to the youtube playlist
//       yt_plist.songs.push({_id: data.content._id});

//       // if the user currently has the youtube playlist focussed, refresh it
//       if (player.playlist.title == 'Youtube') {
//         // update the model data
//         player.playlist = yt_plist;
//         player.songs = player.song_collection.getByIds(player.playlist);
//         player.queue_pool = player.songs.slice(0);
//         player.genShufflePool();

//         // resort the model data
//         player.resortSongs();

//         // redraw the songs view
//         redrawSongsChangedModel();
//       }
//     }

//     // add the track to the library playlist
//     addToLibraryPlaylist(data.content._id);
//   } else if (data.type == 'error') {
//     YTMessenger = updateMask(YTMessenger, data.content);
//   } else if (data.type === 'updated') {
//     YTMessenger = updateMask(YTMessenger, 'Updated ' + data.content.title);
//     songUpdated([data]);
//   }
// });

// var SongMessenger = null;
// socket.on('song_update', function(data) {
//   console.log('Updating song info');
//   songUpdated(data);
// });

// var ScanMessenger = null;
// var ScanTemplate = 'Scanned {{completed}} out of {{count}}{% if details %}: {{details}}{% endif %}';
// socket.on('scan_update', function(data) {
//   console.log(data);
//   if (ScanMessenger === null) {
//     ScanMessenger = Messenger().post(swig.render(ScanTemplate, {locals: data}));
//   } else {
//     ScanMessenger.update(swig.render(ScanTemplate, {locals: data}));
//   }

//   // do we need to remove it first?
//   if (data.type == 'update') {
//     // remove the track
//     player.song_collection.remove(player.song_collection.where({_id: data.doc._id}));
//   }

//   // add the track
//   player.song_collection.add(data.doc);

//   // add the id to the library
//   if (data.type == 'add') {
//     addToLibraryPlaylist(data.doc._id);
//   }
// });

// // for when the sync between servers has progressed
// var SyncMessenger = null;
// var SyncTemplate = 'Synced {{completed}} out of {{count}}{% if content %} - Added {{content.title}}{% endif %}';
// socket.on('sync_update', function(data) {
//   // log the sync data to the developer tools
//   console.log(data);

//   if (SyncMessenger === null) {
//     SyncMessenger = Messenger().post(swig.render(SyncTemplate, {locals: data}));
//   } else {
//     SyncMessenger.update(swig.render(SyncTemplate, {locals: data}));
//   }

//   // add the track to the songs collection
//   player.song_collection.add(data.content);

//   // add the id to the library
//   if (data.type == 'add') {
//     addToLibraryPlaylist(data.content._id);
//   }

//   // if it's completed, refresh the playlists
//   if (data.completed == data.count) {
//     socket.emit('fetch_playlists');
//   }
// });

// // for when the durations are added
// socket.on('duration_update', function(data) {
//   player.song_collection.where({_id: data._id})[0].attributes.duration = data.new_duration;
// });

// // remote controll events
// var CommandMessenger = null;
// var CommandTemplate = 'Received command \'{{command}}\'.';
// socket.on('command', function(data) {
//   var command = data.command;

//   // show command
//   if (CommandMessenger === null) {
//     CommandMessenger = Messenger().post(swig.render(CommandTemplate, {locals: data}));
//   } else {
//     CommandMessenger.update(swig.render(CommandTemplate, {locals: data}));
//   }

//   // run command
//   switch (command){
//     case 'next':
//       player.nextTrack();
//       break;
//     case 'prev':
//       player.prevTrack();
//       break;
//     case 'playpause':
//       player.togglePlayState();
//       break;
//     default:
//       break;
//   }
// });

// // similar songs data received
// socket.on('similar_songs', function(data) {
//   if (data.error) {
//     Messenger().post('Error generating mix, see log for more info');
//   } else {
//     if (data.songs.length === 0) {
//       Messenger().post('Error generating mix, lastfm failed to find similar songs');
//     } else {
//       // map them to models we understand
//       var songsConverted = data.songs.map(function (song) {
//         // remove the song from the song collection if it already exists
//         if (song.youtubeId && song.youtubeId.length > 0) {
//           player.song_collection.remove(
//             player.song_collection.where({youtube_id: song.youtubeId})
//           );
//         }

//         return {
//           _id: 'YOUTUBE_' + song.youtubeId,
//           title: song.title,
//           album: song.album,
//           artist: song.artist,
//           albumartist: song.artist,
//           display_artist: song.artist,
//           genre: song.genre,
//           cover_location: song.coverUrl,
//           disc: song.discNumber,
//           track: song.trackNumber,
//           duration: 0,
//           play_count: 0,
//           is_youtube: true,
//           youtube_id: song.youtubeId,
//         };
//       });

//       // add the tracks into the song_collection
//       // NOTE: this doesn't add them to the library playlist
//       player.song_collection.add(songsConverted);

//       // instruct the player to create a view for the mix
//       player.showMix(data.title, songsConverted);

//       // update the url without navigating
//       MusicApp.router.navigate(data.url, true);
//     }
//   }
// });

// // add a new playlist
// socket.on('addPlaylist', function(data) {
//   // add the playlist to the collection
//   player.playlist_collection.add(data);

//   // redraw the sidebar
//   MusicApp.router.sidebar();
// });

// // generic info message reciever
// socket.on('message', function(data) {
//   Messenger().post(data.message);
// });

// function redrawSongsChangedModel() {
//   MusicApp.router.songview.render();
// }

// function redrawInfoView() {
//   MusicApp.infoRegion.currentView.render();
// }

// function addToLibraryPlaylist(id) {
//   var libraryPlaylist = player.playlist_collection.where({_id: 'LIBRARY'})[0].attributes;
//   libraryPlaylist.songs.push({_id: id});

//   // if they are focussed on the Library playlist, refresh it
//   if (player.playlist.title == 'Library') {
//     // update the model data
//     player.playlist = libraryPlaylist;
//     player.songs = player.song_collection.getByIds(player.playlist);
//     player.queue_pool = player.songs.slice(0);
//     player.genShufflePool();

//     // resort the model data
//     player.resortSongs();
//     redrawSongsChangedModel();
//   }
// }

// function songUpdated(data) {

//   // iterate over tracks and update them
//   for (var x = 0; x < data.length; x++) {
//     // remove the track
//     player.song_collection.remove(player.song_collection.where({_id: data[x]._id}));

//     // add the track
//     player.song_collection.add(data[x]);

//     // if it was the current track, update the player reference
//     if (data[x]._id == player.current_song.attributes._id) {
//       // refetch it from the song collection
//       player.current_song = player.song_collection.where({_id: player.current_song.attributes._id})[0];
//     }
//   }

//   // regenerate the list of current songs
//   player.songs = player.song_collection.getByIds(player.playlist);
//   player.queue_pool = player.songs.slice(0);
//   player.genShufflePool();

//   // resort the model data
//   player.resortSongs();

//   // redraw the view
//   redrawSongsChangedModel();

//   // redraw info view
//   redrawInfoView();
// }
