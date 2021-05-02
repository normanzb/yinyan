import React, { useEffect, useState } from 'react'
import never from 'never'
import Nav from './ui/Nav'
import Broker from './Broker'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  // Link
} from "react-router-dom";
import List from './ui/List';

const config = {
  api: {
    host: window.location.host,
    pathname: window.location.pathname + 'socket.io'
  }
}

export default () => {
  const [currentPlaylist, setCurrentPlaylist] = useState()
  useEffect(() => {
    (async () => {
      const b = new Broker(config.api)
      await b.ready
      const playlists = await b.playlists
      setCurrentPlaylist(playlists.get('LIBRARY') ?? never('LIBRARY playlist canont be found.'))
    })()
  }, [])
  return <Router>
    <Nav />
    <div className='content'>
      <Switch>
          <Route>
            <List playlist={currentPlaylist} />
          </Route>
      </Switch>
    </div>
  </Router>
}
