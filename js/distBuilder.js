jQuery.fn.visible = function() {
    return this.css('visibility', 'visible');
}

jQuery.fn.invisible = function() {
    return this.css('visibility', 'hidden');
}

jQuery.fn.visibilityToggle = function() {
    return this.css('visibility', function(i, visibility) {
        return (visibility == 'visible') ? 'hidden' : 'visible';
    });
}

function updateLabelPosition(){
  var w = $("#graphArea").width();
  var pleft;
  if (w >= 1000) {
    pleft = -800;
  } else if ((w<1000)&&(w>=800)) {
    pleft = -670;  
  } else if ((w<800)&&(w>720)) {
    pleft = -544;  
  } else {
    pleft = -120;
  }
  $(".yLabel").attr("style","left:"+pleft+"px");
}

var waitForFinalEvent = (function () {
  var timers = {};
  return function (callback, ms, uniqueId) {
    if (!uniqueId) {
      uniqueId = "Don't call this twice without a uniqueId";
    }
    if (timers[uniqueId]) {
      clearTimeout (timers[uniqueId]);
    }
    timers[uniqueId] = setTimeout(callback, ms);
  };
})();

var COLUMN_HEIGHT = 560; //in pixels
var COLUMN_WIDTH = 40;
/////////////////////////////////////
//////   HELPER    VARIABLES   //////
/////////////////////////////////////
var MARKER_HEIGHT = 1;
var MOVED = false;
////// Generate Marker Weights //////
var MARKER_WEIGHTS = new Array();
for (i=0;i<=400;i++) {
  MARKER_WEIGHTS[i] = i+1;
}
////// Generate Columns  //////
var COLUMNS = new Array();
for (i=0;i<100;i++) {
  COLUMNS[i] = {
    "name":(i+1)*5+"%",
    "weight":(i+1)*2,
    "cssClass":"box left"
  }
}

////// Initial Object  //////
var obj = {
  "title":"\"Distribution Builder\"",
  "xLabel":"Height",
  "yLabel":"Number of ocurrences",
  "markerColumnIdx":4,
  "columns": COLUMNS.slice(0,10),
  "markerWeights": MARKER_WEIGHTS.slice(0,100),
  "maxBudget": 60000,
  "displayBudget": true,
  "allowOverBudget": false,
  "reserveNowPosition": "right",
  "showPostSubmitAnimation": true,
};

/*
$(window).resize(function () {
    waitForFinalEvent(function(){
      alert('Resize...');
      //...
    }, 500, "some unique string");
});
*/
$(window).resize(function () {
  updateLabelPosition();
});

$(document).ready(function(){
  updateLabelPosition();
  ////// Collapses the accordion //////
  $('#collapseOne').collapse("hide");
  $( "#submit-btn" ).click(function() {
      $( "#dialog-confirm" ).dialog( "open" );
      return false;
  });

  var str = JSON.stringify(obj);
  $('#dataIn').html(str);
  
  // Calls the function to read in data on input boxes
  genDataIn(0);
  genDataOut();
});

function genDataIn(updateObject) {
  if (updateObject) {
    obj = JSON.parse($('#dataIn').val());
  }
  //Update distribution
  populateDist();
  //Update distribution labels
  setLabels(obj.title,obj.xLabel,obj.yLabel);
  var str = JSON.stringify(obj);
  //Update display
  if (!obj.displayBudget) {
    $('#budget-container').hide();  
  }
  // Hidden bar (using css hide), used for debugging
/*   $('#display').html(str); */
  // Reset the output string
  $("#display-out").html('');
  // Reset the progress bar & budget
  if (updateObject) {
    genDataOut();
  }

}
//Updates distribution labels
function setLabels(title,xLabel,yLabel){
  $("#dist-title").html(title);
  $("#dist-xLabel").html(xLabel);
  $("#dist-yLabel").html(yLabel);
}

// Determine marker height based on the number of items
// simple lookup table, could alternatively use COLUMN_HEIGHT
function getMarkerHeight(COLUMN_HEIGHT,numMarker){
  if (numMarker <= 50){
    return 8;
  } else if ((numMarker > 50)&&(numMarker <= 111)){
    return 5;
  } else if ((numMarker > 111)&&(numMarker <= 185)) {
    return 3;
  }  else if (numMarker > 185) {
    alert("Maximum Number of markers exceeded. Modify lookup table in distBuilder.js, \
           adjust COLUMN_HEIGHT, and change style.css.")
    return -1;
  }
}

//function populateDist(numCol,numMarker,markerColumnIdx,labels){
function populateDist(){
  var numCol = obj.columns.length;
  var numMarker = obj.markerWeights.length;
  var markerColumnIdx = obj.markerColumnIdx;
  var columns = obj.columns;
  
  // "distBuilder" container
  var distBuilderContainer = document.getElementById("graphArea");
  
  
  // New "inner-container"
  var newCont = document.createElement("div");
  newCont.setAttribute("id","distBuilder");
  newCont.setAttribute("style","width:"+((numCol+1)*(COLUMN_WIDTH+2)+20)+"px");

/*   newCont.setAttribute("class","row"); */
  var oldCont = document.getElementById("distBuilder");
  distBuilderContainer.replaceChild(newCont,oldCont);

  // "col-labels" container
  var colLabelsContainer = document.getElementById("col-labels-container");
  
  // New "col-labels"
  var newColLab = document.createElement("div");
  newColLab.setAttribute("id","col-labels");
  newColLab.setAttribute("id","col-labels");

  var oldColLab = document.getElementById("col-labels");  
  colLabelsContainer.replaceChild(newColLab,oldColLab);

  // Reserve Now Columns
  var reserveNowBox = document.createElement("div");
  if (obj.reserveNowPosition=="left"){
    reserveNowBox.setAttribute("id","reserveNowLeft");
    reserveNowBox.setAttribute("class","box left");
  } else if (obj.reserveNowPosition=="right"){
    reserveNowBox.setAttribute("id","reserveNowRight");
    reserveNowBox.setAttribute("class","box left");
  }

  var ul = document.createElement("ul");
  ul.setAttribute("class","itemListClass ui-helper-reset boxContainer");
  ul.setAttribute("id","reserveNowList");
  ul.setAttribute("name","reserveNow");

  var fill = document.createElement("div");
  fill.setAttribute("id","fill");

  fill.setAttribute("style","height:"+COLUMN_HEIGHT+"px");
  ul.appendChild(fill);
  reserveNowBox.appendChild(ul);
  MARKER_HEIGHT = getMarkerHeight(COLUMN_HEIGHT,numMarker);
  
  var h0 = COLUMN_HEIGHT - numMarker*MARKER_HEIGHT;
  fill.setAttribute("style","height:"+h0+"px");
  for (var j=0;j<numMarker;j++){
      var li = document.createElement("li");
      li.setAttribute("class","ui-draggable");
      li.setAttribute("style","height:"+(MARKER_HEIGHT-2)+"px"); //Subtract 2 to account for the CSS border
      li.setAttribute("id","marker_"+j);
      ul.appendChild(li);
  }  

  var reserveNowLabel = document.createElement("div");
  reserveNowLabel.setAttribute("class","box left col-label reserveNow-label");
  reserveNowLabel.setAttribute("id","reserveNow-label");
  // If position is on the left, then append it before the rest of the columns,
  // othewise do it after
  if (obj.reserveNowPosition=="left"){
      newColLab.appendChild(reserveNowLabel);
    $(reserveNowBox).hide().appendTo('#distBuilder').fadeIn();
  }
  // Populate the divs with:
  // Filler element (so the markers get pushed to the bottom)
  // Markers
  // Labels
  for (var i=0;i<numCol;i++){      
    var box = document.createElement("div");
    // Column name for HTML document, different than "label"
    box.setAttribute("id","column_"+i);
    box.setAttribute("class",columns[i].cssClass);
    
    var ul = document.createElement("ul");
    ul.setAttribute("class","itemListClass ui-helper-reset boxContainer");
    ul.setAttribute("id","markerList_"+i);
    ul.setAttribute("name","none");

    var fill = document.createElement("div");
    fill.setAttribute("id","fill");
    fill.setAttribute("style","height:"+COLUMN_HEIGHT+"px");
    ul.appendChild(fill);
    box.appendChild(ul);
        
    var div = document.createElement("div");
    div.setAttribute("class","box left col-label");
    div.innerHTML = columns[i].name;
    newColLab.appendChild(div);
    updateDisplay();
    $(box).hide().appendTo('#distBuilder').fadeIn();
  }
  if (obj.reserveNowPosition=="right"){
      newColLab.appendChild(reserveNowLabel);
    $(reserveNowBox).hide().appendTo('#distBuilder').fadeIn();
  }
  /*=============== Set element to be draggable and droppable ================*/
  var $itemList=$(".itemListClass");
  //assign draggable to the itemList
  $('li',$itemList).draggable({
          containment     : "#distBuilder" ,
          delay           : 200,
          cursor          : "move",       // change the cursor to the move style which is like a "+" sign
          helper          : function(){
                                          MOVED = false;
                                          //var selected = $('.itemListClass input:checked').parents('li');
                                          var selected = $('.grouped');
                                          var container = $('<div/>');
                                          var height;
                                          //if there's no selected item of class ".grouped", 
                                          //then set the selected item to be $(this) draggable element
                                          if (selected.length === 0) {
                                                  alert('NO ITEMS SELECTED?');
                                                  selected = $(this);
                                          }
                                          $('ul[name=current]').attr("name",'none');
                                          $('ul[name=previous]').attr("name",'none');

                                          //put the selected item or list to a container
                                          container.append(selected.clone());
                                          selected.visibilityToggle();
                                          //set the height of "ul" or ".itemListClass" (i.e. the "droppable area") to be 100px, 
                                          //this will fix the problem of the unseen redundant droppable area after we hide the selected items
                                          height= parseInt(selected.parent().outerHeight(),10) - (parseInt(selected.length,10) * parseInt(selected.first().outerHeight(),10));
                                          //alert(height);
                                          //selected.parent().css('height',height);
                                          return container;
                                   },
          revert          : function(dropped){
                                          $('ul').removeClass('dropHover');
                                          $('ul[name=current]').attr("name",'none');
                                          $('ul[name=previous]').attr("name",'none');

                                          
                                          var selected = $('.grouped');
                                          //if dropped===false, then it means the draggable item is dropped outside the droppable area
                                          if(dropped===false){
                                                  if(selected.length==0){
                                                          selected=$(this);
                                                  }
/*                                                   selected.visibilityToggle(); */
                                                  selected.removeClass('grouped');
                                                  //selected.parent().css('height','auto');
                                                  //alert("dropped outside");
                                                  // return true so that when dropped outside of droppable area, the item will revert back to its initial position
                                                  return true;
                                          } else {
                                                  //alert("dropped inside");
                                                  selected.removeClass('grouped');
                                                  return false;
                                          }
                                    },                                             
          zIndex          : 2700,  // when the draggable element is dragged, show it
  });                                             
  //assign droppable to the itemList
  $itemList.droppable({
          accept: ".itemListClass > li",  // define what draggable elements to accept
          tolerance: "touch" ,            // define the tolerance of how a draggable element can be dropped to droppable area
          //hoverClass: "dropHover" ,       // define the css class to use when the draggable element hovers on the droppable area
          activate: function( event, ui ) {
/*                   alert(ui.offset['top']); */
          },
          out: function( event, ui ) {
                        $(this).removeClass('dropHover');
                        /* if inside do the stuff otherwise light up reserveNow*/



/* Scenario 1: 
"current" issues an out
if "previous" exists, we must be over it
  light it up
  swap names with current
  To-do:
  Need to check if I'm still inside */
                    if ($(this).attr("name")=="current") {
                        if($('ul[name=previous]').attr("name")=='previous'){
                            $('ul[name=previous]').addClass('dropHover');
                            $('ul[name=previous]').attr("name",'current');
                        }
/* Scenario 2: 
"current" issues an out
if "previous" doesn't exist, we must be over reserveNow
  light it up
  make "current" "previous"
*/
                        else {
                            $('ul[name=reserveNow]').addClass('dropHover');
                            $('ul[name=current]').attr("name",'previous');
                        }
                        $(this).attr("name","previous");
                    }
/* Scenario 3: 
"reserveNow" issues an out
must be over "previous"
  light it up
  make it "current"
*/
                    else if ($(this).attr("name")=="reserveNow"){
                        $(this).removeClass('dropHover');
                        $('ul[name=previous]').addClass('dropHover');
                        $('ul[name=previous]').attr("name",'current');
                    }
                    
                    updateDisplay();
          },
          over: function( event, ui ) {
                    $('ul').removeClass('dropHover');
                    if ($(this).attr("name")=="none") {
                        //size of this should always be = 1
                        $('ul[name=previous]').attr("name","none");
                        $('ul[name=current]').attr("name","previous");
                        $(this).attr("name","current");
                    } else if ($(this).attr("name")=="previous") {
                        $('ul[name=current]').attr("name","previous");
                        $(this).attr("name","current");
                    } else if ($(this).attr("name")=="reserveNow") {
                        $('ul[name=previous]').attr("name","none");
                        $('ul[name=current]').attr("name","previous");
                    }
                    $(this).addClass('dropHover');
                    updateDisplay();
          },
          drop: function( event, ui ) {   
          // this event is triggered when an accepted draggable is dropped 'over' (within the tolerance of) this droppable
                  // delete or clear the helper when the draggable element is dropped
                  ui.helper.empty();
                  // set the droppable area's height to be auto
                  var dragItems = $('.grouped');
                  // if no items is selected (i.e. the item is dragged and dropped directly without selecting it), 
                  // then use the ui.draggable
                  var fill = $(this).children("div");
                  if ((MOVED)||($(this).attr("name")=="previous")) {
                    return;
                  }
                  if(dragItems.length==0){
/*                           alert('WTF: '+$(this).attr("name")); */
                          // ui.draggable represents the draggable element that has been dropped 
                          // on the droppable element, $(this) represent the droppable element
                          // moveList(ui.draggable, $(this));
                          return;
                  }
                  // otherwise use the dragItems or the set of selected items
                  else{
/*                       alert('COOL: '+$(this).attr("name")); */
                      moveList(dragItems , $(this) );
                  }
                  $('ul').removeClass('dropHover');
                  $('ul[name=current]').attr("name",'none');
                  $('ul[name=previous]').attr("name",'none');
          },
  });        
                                                                       
  /*=============== end of set element droppable and draggable ===============*/
  //kill all the li click event first before re-assign to it
  $('.itemListClass > li').die('mousedown');
  //bind the list or item with click function to select multiple items
  $('.itemListClass > li').live('mousedown', function(e){
          $('li').removeClass('grouped');
          //invert the class
          var idx=$(this).index();
          $(this).parent().children('li:lt('+idx+')').toggleClass('grouped');
          $('#display-out').html('');
          $('#display-out').parent().hide();
  });
  $('.itemListClass > li').die('click');
  $('.itemListClass > li').live('click', function(e){
          $('li').removeClass('grouped');
          //invert the class
          var idx=$(this).index();
          $(this).parent().children('li:lt('+idx+')').toggleClass('grouped');
          $('#display-out').html('');
          $('#display-out').parent().hide();

  });
}
function updateDisplay(){
                    var s;
                    $('.boxContainer').each(function(index) {
                      s += $(this).attr("name")+', ';
                    });
/*                     s = s.split("undefined"); */
                    $('#display').html(s);
}
//function to move item from list to box
function moveList($dragItem,$dropList){
/*         alert($dragItem.parent().attr('id')+' '+$dropList.attr('id')); */
        if($dragItem.parent().attr('id')!=$dropList.attr('id')){
          h_drop = $dropList.children("div").height()-MARKER_HEIGHT*($dragItem.length);
          $dropList.children("div").css("height",h_drop);

          h_remove = $dragItem.parent().children("div").height()+MARKER_HEIGHT*($dragItem.length);
          $dragItem.parent().children("div").css("height",h_remove);
          $dragItem.appendTo($dropList);
/*           $dragItem.appendTo($('ul[name=current]')); */
          //ungrouped after moved
          $('.grouped').toggleClass('grouped');
          $dragItem.visible();
          MOVED = true;
        }
        //when it is dropped to own list, then re-show the hidden items
        else{                           
            //$dragItem.toggle('fast');
            $dragItem.visible();
        }
        genDataOut();
}       

// Function to generate JSON output containg data distribution
function genDataOut() {
  var cont = document.getElementById("distBuilder");
  var numCol = cont.childNodes.length;
  if (numCol == 0) {
    alert("No columns are present");
    return;
  }
  var markerLocations = new Array;
  var currentCost = 0;
  var markerWeightIdx = 0;
  var numMarkersMoved = 0;
  for (var i=0;i<=numCol;i++) {
    var markerList=document.getElementById("markerList_"+i);
    if (markerList) {
      var nodes = markerList.childNodes;
      if (nodes.length>1) {
        markerLocations[i] = 0;
        for (var j=0;j<nodes.length;j++) {
          //alert(i+" , "+j+" , "+nodes[j]+" , "+currentCost);
          if (nodes[j].tagName!='LI') {
            continue;
          }
          markerLocations[i]+=1;
          numMarkersMoved+=1;
          currentCost+=obj.markerWeights[markerWeightIdx]*obj.columns[i].weight;
          markerWeightIdx++;
        }
      } else {
        markerLocations[i]=0;
      }
    }
  }
  if (numMarkersMoved==obj.markerWeights.length){
      $('#budget-container').visible();
  } else {
      $('#budget-container').invisible();
  }
  obj.markerLocations = markerLocations;
  obj.currentCost = currentCost;
  var precision = 4;
  var budget = (currentCost*100/obj.maxBudget);
  if (budget < 10) {
    precision = 3;
  } else if (budget==0) {
    precision = 2;
  } else if (budget >= 100) {
    precision = 5;
  }
  budget = budget.toPrecision(precision);
  if (budget > 100.00) {
    $('#budget-bar-container').removeClass('progress-success');
    $('#budget-bar-container').addClass('progress-danger');
    if (!obj.allowOverBudget) {
      $('#submit-btn').parent().parent().hide();
    }
  } else {
    $('#budget-bar-container').removeClass('progress-danger');
    $('#budget-bar-container').addClass('progress-success');
    $('#submit-btn').parent().parent().show();
  }
  if (obj.displayBudget) {
    $('#budget-container').show();  
    $('#budget').html("Budget: "+budget+"%");
    $('#budget-bar').css("width",budget+'%');
  }
}

function genOutputString() {
  // Only generates output string if coming from the Submit dialog
  var str = JSON.stringify(obj);
  //Update display
  $('#display-out').html(str);
  $('#display-out').parent().show();
  $('li').removeClass('grouped');
  //document.getElementById("display-out").innerHTML = dataDist;
  window.scrollTo(0,1000);
}

$(function() {
    $( "#dialog-confirm" ).dialog({
        resizable: false,
        autoOpen: false, //controls initial display
        height: 160,
        show: "blind",
        hide: "fade",
        modal: false,
        buttons: {
            "Submit": function() {
                genOutputString(0);
                $( this ).dialog( "close" );
                // Insert additional submit functionality here
                if (obj.showPostSubmitAnimation == true) {
                    var markers = $('li.ui-draggable');
                    animateMarkers(markers);
                }
            },
            Cancel: function() {
                $( this ).dialog( "close" );
            }
        }
    });
});

function animateMarkers(markers) {
    var l = markers.length;
    var n = getRandomInt(0,l-1);
    markers.eq(n).fadeTo(100,0, function(){ 
        (markers=markers.filter(function(index) { return index != n; })).length && animateMarkers(markers);
    });
} 

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
