/**
 * Created by sumeetsingharora on 4/16/16.
 */

var homeJS = {
  onscreenMarker: [], // on the markers 
  selectedMarker: [], // markers in the selected region
  lastShape: undefined, // the selected region
  roadsegments: undefined,
  heatmap: undefined,
  currentVisualMode: 'markers',// other two options, 'segments', 'heatmap'
  globalDataList: undefined    
}

var homeJSLocal = {        
  visualModeToApply: "markers",
  map: undefined,
  facetObj: undefined,
  searchBox: undefined,
  drawingManager: undefined,
  clearSelectAreaButton: undefined,
  detailViewState: false
}

function initMap() {
  google.maps.visualRefresh = true;

  homeJSLocal.map = new google.maps.Map(
      document.getElementById('map'), {
        zoom: 13,
        center: {lat: 35, lng: -78},

        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.LEFT_TOP,
          mapTypeIds: [
            google.maps.MapTypeId.ROADMAP,
            google.maps.MapTypeId.TERRAIN,
            google.maps.MapTypeId.SATELLITE,
            google.maps.MapTypeId.HYBRID
          ]}
      });

  homeJSLocal.clearSelectAreaButton = createAndRenderClearSelection(homeJSLocal.map);
  homeJSLocal.drawingManager = createAndRenderDrawing(homeJSLocal.map);  

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  homeJSLocal.searchBox = createSearchBox(homeJSLocal.map, input);

  homeJSLocal.map.addListener('idle', function() {
    add_record('mapMoved');
    if(homeJS.lastShape != undefined) {
      if(homeJS.currentVisualMode === 'markers'
          &&  homeJSLocal.visualModeToApply === 'markers') return;
    }
    getEvents();
    homeJSLocal.searchBox.setBounds(homeJSLocal.map.getBounds());
  });

  getEvents();
}

function getEvents(){

  // clear the old data
  homeJS.globalDataList = undefined;

  var bound = homeJSLocal.map.getBounds();
  if(bound == undefined){
    // call this function later until the map is loaded
    setTimeout(getEvents, 100);
    return;
  }

  var ne = bound.getNorthEast();
  var sw = bound.getSouthWest();

  // NOTE: when the height is set to 50%, the get bound is still get the old boundary 
  // access the map bound
  var down = sw.lat();
  if(homeJSLocal.detailViewState){
    down = (ne.lat() + sw.lat())/2;
  }
  var filterDic = {
    'left':sw.lng(),
    'right':ne.lng(),
    'top':ne.lat(),
    'down':down,
    'facetObj':JSON.stringify(homeJSLocal.facetObj)
  };
  console.log(filterDic);
  if( homeJSLocal.visualModeToApply == "segments"){
    jQuery.post(
        "/get_segs",
        filterDic,
        getEventCB,
        'json');
  }else{
    jQuery.post(
        "/get_accidents",
        filterDic,
        getEventCB,
        'json');
  }
}

function enableDrawing() {
  if(homeJS.currentVisualMode != 'markers') {
    homeJSLocal.drawingManager.setMap(homeJSLocal.map);
    homeJSLocal.map.controls[google.maps.ControlPosition.TOP_CENTER].push(homeJSLocal.clearSelectAreaButton);
  }
}

function disableDrawing() {
  if(homeJS.currentVisualMode === 'markers') {
    homeJSLocal.drawingManager.setMap(null);
    homeJSLocal.map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
  }
}

function clearVisual(){
  if(homeJS.currentVisualMode == undefined)  return;
  if(homeJS.currentVisualMode === 'markers') {
    set_markers(homeJS.onscreenMarker, null); 
  } else if(homeJS.currentVisualMode === 'segments') {
    setSegments(homeJS.roadsegments, null);
  } else {
    homeJS.heatmap.setMap(null); 
  }
}

function getEventCB(data){
  if(homeJS.lastShape != undefined ){
    homeJS.lastShape.setMap(null);
  }
  if(data.status != 0){
    alert(data.data);
    return;
  }

  // store the data globally
  homeJS.globalDataList = data.data;

  if(homeJSLocal.visualModeToApply == "heatmap") {
    disableDrawing();
    getAccidentHeatmapCB(homeJSLocal.map, data.data);
  } else if(homeJSLocal.visualModeToApply == "segments") {
    disableDrawing();
    getRoadSegmentsCB(homeJSLocal.map, data.data);
  } else {
    enableDrawing();
    getAccidentMarkerCB(homeJSLocal.map, data.data);
  }

  // udpate the table
  if(homeJSLocal.detailViewState){
    drawTableEvent();
  }
}

$(function() {
  google.charts.load('current', {'packages':['table']});
  add_record('homepage'); 
  homeJSLocal.facetObj = constructEmptyFacetObj(homeJSLocal.facetObj);
  $('#facets :checkbox').click(function(){
    // TODO, detail facets
    add_record('checkboxFacet');
    getFacetsCheckboxes(homeJSLocal.facetObj);
    logFacetObj(homeJSLocal.facetObj);
    getEvents();
  });

  $('#facets :radio').click(function(){
    // TODO, detail
    add_record('radioFacet');
    getFacetsRadiobuttons(homeJSLocal.facetObj);
    logFacetObj(homeJSLocal.facetObj);
    getEvents();
  });

  $("#start-date").datepicker({
    onSelect: function(dateText) {
      add_record('changeStartDate');
      homeJSLocal.facetObj.date_range[0] = dateText;
      logFacetObj(homeJSLocal.facetObj);
      getEvents();
    }
  });

  $("#end-date").datepicker({
    onSelect: function(dateText) {
      add_record('changeEndDate');
      homeJSLocal.facetObj.date_range[1] = dateText;
      logFacetObj(homeJSLocal.facetObj);
      getEvents();
    }
  });

  $("#start-time").timepicker({
    change: function(time) {
      add_record('changeStartTime');
      var element =  $(this), text;
      var timepicker = element.timepicker();
      text = timepicker.format(time);
      var seconds = getSeconds(text);
      homeJSLocal.facetObj.timeofday_range[0] = seconds;
      logFacetObj(homeJSLocal.facetObj);
      getEvents();
    }
  });

  $("#end-time").timepicker({
    change: function(time) {
      add_record('changeEndTime');
      var element =  $(this), text;
      var timepicker = element.timepicker();
      text = timepicker.format(time);
      var seconds = getSeconds(text);
      homeJSLocal.facetObj.timeofday_range[1] = seconds;
      logFacetObj(homeJSLocal.facetObj);
      getEvents();
    }
  });

  $('#accidents').click(function () {
    add_record("accidentViewMode");
    homeJSLocal.visualModeToApply = "markers";
    document.getElementById("details").disabled = false;
    document.getElementById("export").disabled = false;
    getEvents();
  });

  $('#roadsegments').click(function () {
    add_record("roadViewMode");
    document.getElementById("details").disabled = true;
    document.getElementById("export").disabled = true;
    homeJSLocal.visualModeToApply = "segments";
    getEvents();
  });

  $('#heatpmap').click(function () {
    add_record("heatmapViewMode");
    document.getElementById("details").disabled = true;
    document.getElementById("export").disabled = true;
    homeJSLocal.visualModeToApply = "heatmap";
    getEvents();
  });

  $("#export").click(function(){
    add_record("exportData");
    exportData();
  });

  $('#details').click(function () {
    if( homeJSLocal.visualModeToApply != "markers"){
      alert("Only Accident View support ViewDetail");
      return;
    }

    // TODO, state , change to a better name
    if(homeJSLocal.detailViewState == false) {
      add_record("viewDetail");
      homeJSLocal.detailViewState = true;
      $('#details').text('Hide details');
      $("#map").css("height", "50%");

      // re-get the events, and the draw table will be called after data is loaded.
      getEvents();    

    } else {
      add_record("closeViewDetail");
      homeJSLocal.detailViewState = false;
      $('#details').text('View details');
      $("#map").css("height", "100%");
      $('#table_div').remove();
      $('#table_row').append('<div id="table_div"></div>');

      // re-get the events
      getEvents();
    }
  });

  initMap();

  // get user information
  jQuery.post(
      "/get_user_info",
      {},
      function(data){
        if(data.status != 0){
          alert('user information error'+data.data);
          return;
        }
        user_info = data.data;
        tmp_str = "You are user "+user_info.user_id;
        $('#userinfo').html(tmp_str);
      },
      'json');
});
