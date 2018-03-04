"use strict";

var _ = require('./lodash');
var $ = require('jquery');

// ES6 shims
require('object.assign').shim();
require('array.prototype.find');
require('./vendor/array-includes'); // shims ES7 Array.prototype.includes

require('./helpers/event'); // extends jQuery itself

var SirTrevor = {

  config: require('./config'),

  log: require('./utils').log,
  Locales: require('./locales'),

  Events: require('./events'),
  EventBus: require('./event-bus'),

  EditorStore: require('./extensions/editor-store'),
  Submittable: require('./extensions/submittable'),
  FileUploader: require('./extensions/file-uploader'),

  BlockMixins: require('./block_mixins'),
  BlockPositioner: require('./block-positioner'),
  BlockReorder: require('./block-reorder'),
  BlockDeletion: require('./block-deletion'),
  BlockValidations: require('./block-validations'),
  BlockStore: require('./block-store'),
  BlockManager: require('./block-manager'),

  SimpleBlock: require('./simple-block'),
  Block: require('./block'),
  Formatter: require('./formatter'),
  Formatters: require('./formatters'),

  Blocks: require('./blocks'),

  BlockControl: require('./block-control'),
  BlockControls: require('./block-controls'),
  FloatingBlockControls: require('./floating-block-controls'),

  FormatBar: require('./format-bar'),
  Editor: require('./editor'),

  toMarkdown: require('./to-markdown'),
  toHTML: require('./to-html'),

  setDefaults: function(options) {
    Object.assign(SirTrevor.config.defaults, options || {});
  },

  getInstance: function(identifier) {
    if (_.isUndefined(identifier)) {
      return this.config.instances[0];
    }

    if (_.isString(identifier)) {
      return this.config.instances.find(function(editor) {
        return editor.ID === identifier;
      });
    }

    return this.config.instances[identifier];
  },

  setBlockOptions: function(type, options) {
    var block = SirTrevor.Blocks[type];

    if (_.isUndefined(block)) {
      return;
    }

    Object.assign(block.prototype, options || {});
  },

  runOnAllInstances: function(method) {
    if (SirTrevor.Editor.prototype.hasOwnProperty(method)) {
      var methodArgs = Array.prototype.slice.call(arguments, 1);
      Array.prototype.forEach.call(SirTrevor.config.instances, function(i) {
        i[method].apply(null, methodArgs);
      });
    } else {
      SirTrevor.log("method doesn't exist");
    }
  },

  dragBlockFromInstanceToInstance: function(block, dropped_on) {

    console.log('dragBlockFromInstanceToInstance');

    var fromInstance = SirTrevor.getInstance(block.attr('data-instance'));
    var toInstance = SirTrevor.getInstance(dropped_on.parents(".st-outer").attr('id'));
    var dataInstance;
    var blockObj;
    var positioner;
    var newType;
    var newData;

    blockObj = fromInstance.block_manager.findBlockById(block.attr('id'));
    positioner = new SirTrevor.BlockPositioner(blockObj.block, toInstance.block_manager.mediator);

    if(fromInstance.options.effectAllowed === 'copy') {
      newType = blockObj.blockStorage.type;
      newData = (JSON.parse(JSON.stringify(blockObj.blockStorage.data)));
      blockObj = fromInstance.block_manager.createBlock(newType, newData);
      block = $(blockObj.el);
      dataInstance = dropped_on.parents(".st-outer").attr('id');
    } else {
      dataInstance = dropped_on.attr('data-instance');
    }

    block.attr('data-instance', dataInstance);

    dropped_on.after(block);
    dropped_on.attr('data-instance', dataInstance);

    blockObj.instanceID = dataInstance;
    blockObj.mediator = toInstance.mediator;
    blockObj._withUIComponent(
      positioner,
      '.st-block-ui-btn--reorder',
      positioner.toggle
    );

    toInstance.removeBlockDragOver();
    toInstance.block_manager.blocks.push(blockObj);
    toInstance.block_manager._incrementBlockTypeCount(block.attr('data-type'));
    toInstance.block_manager.triggerBlockCountUpdate();
    toInstance.block_manager.mediator.trigger('block:limitReached', toInstance.block_manager.blockLimitReached());

    if(fromInstance.options.effectAllowed !== 'copy') {
      fromInstance.block_manager.removeBlock(block.attr('id'));
      fromInstance.block_manager.triggerBlockCountUpdate();
    }

    // Remind the user to save his changes
    // @todo: Remove this hack!
    $(".st-submit input[type=submit]").css("background-color","#990000");
  },

};

Object.assign(SirTrevor, require('./form-events'));


module.exports = SirTrevor;
