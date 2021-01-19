/* eslint-disable no-undef */
registerPlugin({
  install: function(less, pluginManager, functions) {
    functions.add('unit', function (scale) {
      return scale.value * 1.2 + 'rem'
    });
  }
})