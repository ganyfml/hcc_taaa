/*
 * create by sumeet
 * complete by xing
 * */

// TODO, rename
detailViewData = {
  lastSelectCaseno: undefined,
  table: undefined,  // google table view
  data : undefined   // google data 
}

function createAccData(acc_list){
  var data = new google.visualization.DataTable();
  name_list = ['Caseno', 'date', 'time', 'NumK', 'NumA', 'NumB','NumC'];
  type_list = ['number', 'string', 'string', 'number', 'number', 'number', 'number'];

  for( var i = 0;i < name_list.length;i++){
    data.addColumn(type_list[i], name_list[i]);
  }

  for(var i = 0;i < acc_list.length;i++){
    data.addRow([
        acc_list[i].caseno,
        acc_list[i].acc_date,
        acc_list[i].time,
        acc_list[i].num_k,
        acc_list[i].num_a,
        acc_list[i].num_b,
        acc_list[i].num_c
        ]);
  }
  return data;
}

function createSegData(seg_list){
  var acc_list = seg_list;
  var data = new google.visualization.DataTable();

  name_list = ['Route Number', 'Begin Milepost', 'End Milepost', 'Accident Num'];
  type_list = ['string', 'number', 'number', 'number'];

  for( var i = 0;i < name_list.length;i++){
    data.addColumn(type_list[i], name_list[i]);
  }
  for(var i=0;i < acc_list.length;i++){
    var casenum = 0;
    if (acc_list[i].casenolist != undefined)
      casenum = acc_list[i].casenolist.length;
    data.addRow([
        acc_list[i].cntyrte,
        acc_list[i].begmp,
        acc_list[i].endmp, 
        casenum
        ]);
  }
  return data;
}


function rowSelectCB() {
  var acc_list = homeJS.globalDataList;
  
  var row = detailViewData.table.getSelection()[0].row;
  console.log('You selected ' + detailViewData.data.getValue(row, 0));
  // TODO
  // if any marker/polyline is currently selected
  // destroy the effect first

  if( homeJSLocal.visualModeToApply == 'markers'){
    // TODO, need to merge Yue's code
    var caseno = detailViewData.data.getValue(row, 0);
    if( detailViewData.lastSelectCaseno == caseno){
      return;
    }

    for( var i = 0;i < homeJS.onscreenMarker.length;i++){

      if( homeJS.onscreenMarker[i].accidentID == 
          detailViewData.lastSelectCaseno){
        console.log("remove effet on old one");
        homeJS.onscreenMarker[i].setMap(null);
        homeJS.onscreenMarker[i] = new google.maps.Marker({
          position: new google.maps.LatLng(acc_list[i].lat, acc_list[i].lng), 
          map: homeJSLocal.map,
          icon: '/static/imgs/red_cross_12.png',
          accidentID: detailViewData.lastSelectCaseno
        });
        var infoWindow = new google.maps.InfoWindow();
        makeAccInfowindowEvent(
            map, 
            infoWindow, 
            get_acc_details(acc_list[i]),
            homeJS.onscreenMarker[i]);
      }

      if( homeJS.onscreenMarker[i].accidentID ==  caseno){
        console.log("add animation to new one");
        homeJS.onscreenMarker[i].setMap(null);
        homeJS.onscreenMarker[i] = new google.maps.Marker({
          position: new google.maps.LatLng(acc_list[i].lat, acc_list[i].lng), 
          //animation: google.maps.Animation.DROP,
          animation: google.maps.Animation.BOUNCE,
          map: homeJSLocal.map,
          icon: '/static/imgs/red_cross_12.png',
          accidentID: caseno
        });
        var infoWindow = new google.maps.InfoWindow();
        makeAccInfowindowEvent(
            map, 
            infoWindow, 
            get_acc_details(acc_list[i]),
            homeJS.onscreenMarker[i]);
      }
    }
    // update the last select
    detailViewData.lastSelectCaseno = caseno;
  }else{
    console.log("TODO");
    // for polygon, change the line width
  }
}

function drawTableEvent() {
  // update by Xing, 4/22,  plot the actual data instead of the dummy data.
  // the datatable should be updated when the map is moved. 

  google.charts.setOnLoadCallback(drawTable);
  function drawTable() {
    // TODO, also need to update the table when the region is selected as polygon
    // The createXXXData function need to be changed
    if(homeJSLocal.visualModeToApply == "segments"){
      detailViewData.data = createSegData(homeJS.globalDataList);
    }else{ 
      detailViewData.data = createAccData(homeJS.globalDataList);
    }

    detailViewData.table = new google.visualization.Table(document.getElementById('table_div'));
    google.visualization.events.addListener(detailViewData.table, 'select', rowSelectCB);
    detailViewData.table.draw(detailViewData.data, {showRowNumber: true, width: '100%', height: '40%'}); 
  }
}


