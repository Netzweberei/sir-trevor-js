"use strict";
var $ = require('jquery');
var _ = require('../lodash');
var Block = require('../block');

var widget_template = _.template([
  "<a data-type=\"widget\" class=\"st-block-control\" style=\"text-align: center\" onclick=\"$.fancybox( { href: '?cmd=getWidgetByName&name=<%= selected %>&slide=<%= slide %>',  title: '<%= selected %>', type: 'iframe' } );\">",
  "<span class='st-icon'>image</span>",
  "Widget \"<%= selected %>\"",
  "</a>"
].join("\n"));

var widget_selection = _.template([
  "<a data-type='<%= widget.type %>' id='<%= widget.name %>' href='<%= widget.uri %>' class='st-block-control'>",
  "<span class='st-icon'><%= widget.icon %></span>",
  "\"<%= widget.name %>\"",
  "</a>",
].join("\n"));

module.exports = Block.extend({

  type: "widget",
  title: function() { return i18n.t('blocks:widget:title'); },
  toolbarEnabled: true,

  droppable: false,
  uploadable: true,
  fetchable: true,

  icon_name: 'widget',

  loadData: function(data){

    // Prevent ajax-call, if an already configured widget gets rendered
    this.dontAjax = true;

    // Set editorpanel
    this.$inner.prepend(widget_template(data));
  },

  onBlockRender: function(){

    if(!this.dontAjax) {
      // Fetch available widgets
      var ajaxOptions = {
        url:"?cmd=loadAvailableWidgets",
        dataType: "json"
      };
      this.fetch(ajaxOptions, this.onWidgetsFound, this.onNoWidgetsFound);
    }

    /* Setup the upload button */
    this.$inputs.find('button').bind('click', function(ev){ ev.preventDefault(); });
    this.$inputs.find('input').on('change', (function(ev) {
      this.onDrop(ev.currentTarget);
    }).bind(this));
  },

  onDrop: function(transferData){
    //var file = transferData.files[0];
  },

  onWidgetsFound: function(data){
    var widgets_container = $("<div>", { 'class': 'st-block__widgets-container' });
    // Offer available widgets
    if(data.data.available){
      data.data.available.forEach(
        function(widget){
          widgets_container.append(widget_selection({'widget': widget}));
        }
      );
      this.$inputs.prepend(widgets_container);
      this.$inputs.find('a').bind('click', function(ev){ ev.preventDefault(); });
      this.$inputs.find('a').on('click', (function(ev){
        this.onWidgetSelected(ev.target.parentElement.id);
      }).bind(this));
    }
  },

  onNoWidgetsFound: function(){
    window.alert('No widgets found!');
  },

  onWidgetSelected: function(widget){

    // Fetch available widgets
    var ajaxOptions = {
      url:"?cmd=copySelectedWidget&widget=" + widget,
      dataType: "json"
    };
    this.fetch(ajaxOptions, this.onWidgetCopied, this.onNoWidgetCopied);

    this.ready();
  },

  onWidgetCopied: function(data)
  {
    if(data.selected)
    {
      var obj = {
        selected: data.selected,
        slide: 0
      };
      this.setAndLoadData(obj);

    }
    else
    {
      this.destroy();
    }
  },

  onNoWidgetCopied: function(){
    window.alert('Couldn\'t copy widget!');
  }

});
