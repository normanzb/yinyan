import React, { useEffect, useState } from 'react'
import never from 'never'
import Nav from './ui/Nav'
import Broker from './Broker'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import List from './ui/List';

export default () => {
  const [currentPlaylist, setCurrentPlaylist] = useState()
  useEffect(() => {
    (async () => {
      const b = new Broker()
      await b.ready
      const playlists = await b.playlists
      setCurrentPlaylist(playlists.get('LIBRARY') ?? never('LIBRARY playlist canont be found.'))
    })()
  }, [])
  return <Router>
    <Nav />
    <Switch>
        <Route>
          <List playlist={currentPlaylist} />
        </Route>
    </Switch>
  </Router>
}
