export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibW9oYWJmaXJreSIsImEiOiJjbGU4cXg1N3cwaTF3M3dtZTJ0YXlpbnp0In0.7gyOQMK55-5sLNbk_kjFCw';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mohabfirky/cle8sevsb00cj01og70aacgbp',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.map((loc) => {
    //Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);
    //add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>${loc.day}: ${loc.description}</P>`)
      .addTo(map);
    //extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      right: 100,
      left: 100,
    },
  });
};
