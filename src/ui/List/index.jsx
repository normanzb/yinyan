import React from 'react'
import './styles.less'

export default ({ playlist }) => {
  if (!playlist) {
    return null
  }
  return <div className='list'>
    {playlist.songs.map(song => <div key={song.id}>{song.id}</div>)}
  </div>
}
